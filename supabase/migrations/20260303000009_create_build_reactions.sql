-- build_reactions: 編成👍/👎
-- 1人1編成につき1リアクション (UNIQUE制約)
-- 変更・取り消し可: up→down, down→up, 削除(取り消し)

CREATE TABLE build_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  build_id UUID NOT NULL REFERENCES builds(id),
  user_hash TEXT NOT NULL,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('up', 'down')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (build_id, user_hash)
);

-- ユーザーの既存リアクション検索
CREATE INDEX idx_build_reactions_user ON build_reactions (user_hash, build_id);

-- updated_at 自動更新トリガー
CREATE TRIGGER trg_build_reactions_updated_at
  BEFORE UPDATE ON build_reactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE build_reactions IS '編成👍/👎リアクション';
COMMENT ON COLUMN build_reactions.reaction_type IS 'up: 👍, down: 👎';
