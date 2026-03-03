-- comments: 投票コメント (comment_type='vote') / 掲示板コメント (comment_type='board')
-- 投票の上書きルール: 同一 (character_id, user_hash) で vote 再投稿時、
--   既存行の is_latest_vote を false に更新し、新しい行を true で作成

CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES characters(id),
  user_hash TEXT NOT NULL,
  comment_type TEXT NOT NULL CHECK (comment_type IN ('vote', 'board')),
  rating NUMERIC CHECK (
    rating IS NULL
    OR (rating >= 0.5 AND rating <= 5.0 AND (rating * 2) = FLOOR(rating * 2))
  ),
  body TEXT,
  display_name TEXT,
  is_latest_vote BOOLEAN,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  thumbs_up_count INTEGER NOT NULL DEFAULT 0,
  thumbs_down_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- vote は rating 必須、board は rating NULL
  CONSTRAINT chk_vote_has_rating CHECK (
    (comment_type = 'vote' AND rating IS NOT NULL)
    OR (comment_type = 'board' AND rating IS NULL)
  ),
  -- is_latest_vote は vote のみ使用、board は NULL
  CONSTRAINT chk_latest_vote_type CHECK (
    (comment_type = 'vote' AND is_latest_vote IS NOT NULL)
    OR (comment_type = 'board' AND is_latest_vote IS NULL)
  )
);

-- 集計用: 有効投票のみ抽出
CREATE INDEX idx_comments_latest_vote ON comments (character_id, is_latest_vote)
  WHERE comment_type = 'vote' AND is_latest_vote = true AND is_deleted = false;

-- キャラ別コメント一覧 (新着順)
CREATE INDEX idx_comments_character_created ON comments (character_id, created_at DESC);

-- 投票上書き判定: 同一ユーザー×同一キャラの投票コメント検索
CREATE INDEX idx_comments_vote_lookup ON comments (character_id, user_hash, comment_type)
  WHERE comment_type = 'vote' AND is_latest_vote = true;

-- リアクション数順ソート
CREATE INDEX idx_comments_thumbs_up ON comments (character_id, thumbs_up_count DESC);
CREATE INDEX idx_comments_thumbs_down ON comments (character_id, thumbs_down_count DESC);

-- 話題キャラ集計: 直近24時間のコメント数
CREATE INDEX idx_comments_created_at ON comments (created_at DESC)
  WHERE is_deleted = false;

COMMENT ON TABLE comments IS '投票コメント (vote) / 掲示板コメント (board)';
COMMENT ON COLUMN comments.comment_type IS 'vote: 投票コメント(★あり), board: 掲示板コメント(★なし)';
COMMENT ON COLUMN comments.rating IS '★評価 0.5-5.0 (0.5刻み)。vote のみ必須';
COMMENT ON COLUMN comments.is_latest_vote IS '最新投票フラグ。vote のみ使用、board は NULL';
COMMENT ON COLUMN comments.thumbs_up_count IS '👍数 (非正規化キャッシュ、トリガーで自動更新)';
COMMENT ON COLUMN comments.thumbs_down_count IS '👎数 (非正規化キャッシュ、トリガーで自動更新)';
