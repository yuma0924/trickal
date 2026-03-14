import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { InsertTables } from "@/types/database";

type CharacterRow = { id: string; created_at: string };
type VoteRow = {
  character_id: string;
  rating: number | null;
  thumbs_up_count: number;
  thumbs_down_count: number;
};
type BoardCommentRow = { character_id: string };

/**
 * ランキング再集計バッチ API
 * GitHub Actions (cron) または管理画面から呼び出す
 *
 * 集計ロジック:
 * 1. 有効投票を抽出 (is_latest_vote=true, is_deleted=false, 365日以内, ネットスコア>-10)
 * 2. キャラごとに avg_rating, valid_votes_count を計算
 * 3. 掲示板コメント数 (board_comments_count) を計算
 * 4. 順位を付与 (★平均点降順、同点→有効票数降順、さらに同点→characters.created_at降順)
 * 5. character_rankings テーブルに UPSERT
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const now = new Date();
    const oneYearAgo = new Date(now);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    // 1. 非表示でない全キャラクターを取得
    const { data: characters, error: charError } = await supabase
      .from("characters")
      .select("id, created_at")
      .eq("is_hidden", false)
      .returns<CharacterRow[]>();

    if (charError) {
      return NextResponse.json({ error: charError.message }, { status: 500 });
    }

    if (!characters || characters.length === 0) {
      return NextResponse.json({
        success: true,
        updated_at: now.toISOString(),
        count: 0,
      });
    }

    // 2. 有効投票を取得 (is_latest_vote=true, is_deleted=false, 365日以内)
    const { data: validVotes, error: votesError } = await supabase
      .from("comments")
      .select("character_id, rating, thumbs_up_count, thumbs_down_count")
      .eq("comment_type", "vote")
      .eq("is_latest_vote", true)
      .eq("is_deleted", false)
      .gte("created_at", oneYearAgo.toISOString())
      .returns<VoteRow[]>();

    if (votesError) {
      return NextResponse.json({ error: votesError.message }, { status: 500 });
    }

    // 3. 掲示板コメント数を取得
    const { data: boardComments, error: boardError } = await supabase
      .from("comments")
      .select("character_id")
      .eq("comment_type", "board")
      .eq("is_deleted", false)
      .returns<BoardCommentRow[]>();

    if (boardError) {
      return NextResponse.json({ error: boardError.message }, { status: 500 });
    }

    // キャラ別の集計マップ
    const charStats = new Map<
      string,
      { totalRating: number; voteCount: number; boardCount: number }
    >();

    for (const char of characters) {
      charStats.set(char.id, { totalRating: 0, voteCount: 0, boardCount: 0 });
    }

    // 有効投票を集計 (ネットスコア > -10 のもののみ)
    if (validVotes) {
      for (const vote of validVotes) {
        const netScore = vote.thumbs_up_count - vote.thumbs_down_count;
        if (netScore <= -10) continue;

        const stat = charStats.get(vote.character_id);
        if (stat && vote.rating !== null) {
          stat.totalRating += vote.rating;
          stat.voteCount += 1;
        }
      }
    }

    // 掲示板コメント数を集計
    if (boardComments) {
      for (const bc of boardComments) {
        const stat = charStats.get(bc.character_id);
        if (stat) {
          stat.boardCount += 1;
        }
      }
    }

    // 4. ランキング計算
    type RankEntry = {
      character_id: string;
      avg_rating: number;
      valid_votes_count: number;
      board_comments_count: number;
      created_at: string;
    };

    const entries: RankEntry[] = [];
    for (const char of characters) {
      const stat = charStats.get(char.id);
      if (!stat) continue;
      entries.push({
        character_id: char.id,
        avg_rating:
          stat.voteCount >= 1 ? stat.totalRating / stat.voteCount : 0,
        valid_votes_count: stat.voteCount,
        board_comments_count: stat.boardCount,
        created_at: char.created_at,
      });
    }

    // ソート: ★平均点降順 → 有効票数降順 → created_at降順
    entries.sort((a, b) => {
      if (b.avg_rating !== a.avg_rating) return b.avg_rating - a.avg_rating;
      if (b.valid_votes_count !== a.valid_votes_count)
        return b.valid_votes_count - a.valid_votes_count;
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });

    // 順位付与 (有効票4件以上のみ) + UPSERT データ構築
    let rank = 1;
    const upsertData: InsertTables<"character_rankings">[] = entries.map(
      (entry) => {
        const assignedRank = entry.valid_votes_count >= 1 ? rank++ : null;
        return {
          character_id: entry.character_id,
          avg_rating: entry.avg_rating,
          valid_votes_count: entry.valid_votes_count,
          board_comments_count: entry.board_comments_count,
          rank: assignedRank,
          updated_at: now.toISOString(),
        };
      }
    );

    // バッチ UPSERT
    for (const data of upsertData) {
      const { error: upsertError } = await supabase
        .from("character_rankings")
        .upsert(data, { onConflict: "character_id" });

      if (upsertError) {
        return NextResponse.json(
          { error: upsertError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      updated_at: now.toISOString(),
      count: entries.length,
    });
  } catch (error) {
    console.error("Failed to recalculate rankings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
