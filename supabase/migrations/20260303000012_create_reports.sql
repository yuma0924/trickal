-- reports: 通報 (comment / build / build_comment 対象)
-- ポリモーフィック参照 (FK制約なし)

CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type TEXT NOT NULL CHECK (target_type IN ('comment', 'build', 'build_comment')),
  target_id UUID NOT NULL,
  user_hash TEXT NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (target_type, target_id, user_hash)
);

-- 管理画面: ステータス別一覧
CREATE INDEX idx_reports_status ON reports (status, created_at DESC);

-- 対象別の通報一覧
CREATE INDEX idx_reports_target ON reports (target_type, target_id);

COMMENT ON TABLE reports IS '通報 (comment / build / build_comment 対象)';
COMMENT ON COLUMN reports.target_type IS 'comment / build / build_comment';
COMMENT ON COLUMN reports.target_id IS '対象レコードのID (ポリモーフィック参照)';
COMMENT ON COLUMN reports.status IS 'pending: 未対応, resolved: 対応済み, dismissed: 却下';
