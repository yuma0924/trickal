-- build_comments: 編成コメント
-- 各編成に対してコメントを投稿できる

CREATE TABLE build_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  build_id UUID NOT NULL REFERENCES builds(id),
  user_hash TEXT NOT NULL,
  display_name TEXT,
  body TEXT NOT NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  thumbs_up_count INTEGER NOT NULL DEFAULT 0,
  thumbs_down_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 編成別コメント一覧 (新着順)
CREATE INDEX idx_build_comments_build_created ON build_comments (build_id, created_at DESC);

-- リアクション数順ソート
CREATE INDEX idx_build_comments_thumbs_up ON build_comments (build_id, thumbs_up_count DESC);
CREATE INDEX idx_build_comments_thumbs_down ON build_comments (build_id, thumbs_down_count DESC);

-- updated_at 自動更新トリガー
CREATE TRIGGER trg_build_comments_updated_at
  BEFORE UPDATE ON build_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE build_comments IS '編成コメント';
COMMENT ON COLUMN build_comments.thumbs_up_count IS '👍数 (非正規化キャッシュ、トリガーで自動更新)';
COMMENT ON COLUMN build_comments.thumbs_down_count IS '👎数 (非正規化キャッシュ、トリガーで自動更新)';
