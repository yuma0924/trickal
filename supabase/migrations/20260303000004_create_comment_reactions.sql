-- comment_reactions: コメント👍/👎
-- 1人1コメントにつき1リアクション (UNIQUE制約)
-- 変更・取り消し可: up→down, down→up, 削除(取り消し)

CREATE TABLE comment_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES comments(id),
  user_hash TEXT NOT NULL,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('up', 'down')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (comment_id, user_hash)
);

-- ユーザーの既存リアクション検索
CREATE INDEX idx_comment_reactions_user ON comment_reactions (user_hash, comment_id);

COMMENT ON TABLE comment_reactions IS 'コメント👍/👎リアクション';
COMMENT ON COLUMN comment_reactions.reaction_type IS 'up: 👍, down: 👎';
