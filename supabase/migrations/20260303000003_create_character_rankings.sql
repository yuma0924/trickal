-- character_rankings: ランキング集計キャッシュ (バッチ更新: 毎日0時JST)
-- 1キャラ1行。GitHub Actions バッチで UPSERT される

CREATE TABLE character_rankings (
  character_id UUID PRIMARY KEY REFERENCES characters(id),
  avg_rating NUMERIC NOT NULL DEFAULT 0,
  valid_votes_count INTEGER NOT NULL DEFAULT 0,
  board_comments_count INTEGER NOT NULL DEFAULT 0,
  rank INTEGER,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ランキング表示用: 順位順
CREATE INDEX idx_character_rankings_rank ON character_rankings (rank ASC NULLS LAST);

-- 属性フィルター用: characters テーブルとの JOIN 最適化はクエリ側で対応

COMMENT ON TABLE character_rankings IS 'ランキング集計キャッシュ (バッチ更新)';
COMMENT ON COLUMN character_rankings.avg_rating IS '★平均点 (有効投票の単純平均)';
COMMENT ON COLUMN character_rankings.valid_votes_count IS '有効投票数';
COMMENT ON COLUMN character_rankings.board_comments_count IS '掲示板コメント数';
COMMENT ON COLUMN character_rankings.rank IS '順位 (★平均点降順、同点時は有効票数降順、さらに同点時は created_at 降順)';
