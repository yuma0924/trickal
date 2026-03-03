-- blacklist: BAN ユーザー管理
-- BAN ユーザーは全投稿 (コメント/編成/リアクション) を拒否
-- 既存投稿は表示維持 (削除は管理者が個別対応)

CREATE TABLE blacklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_hash TEXT UNIQUE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- BAN チェック用
CREATE INDEX idx_blacklist_user_hash ON blacklist (user_hash);

COMMENT ON TABLE blacklist IS 'BAN ユーザー管理';
COMMENT ON COLUMN blacklist.user_hash IS 'BAN 対象ユーザーのハッシュ';
COMMENT ON COLUMN blacklist.reason IS 'BAN 理由 (管理者メモ)';
