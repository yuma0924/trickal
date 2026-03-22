-- ティアメーカー テーブル
CREATE TABLE tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  display_name TEXT,
  data JSONB NOT NULL,
  user_hash TEXT NOT NULL,
  likes_count INTEGER NOT NULL DEFAULT 0,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- updated_at 自動更新トリガー（likes_count のみの変更時はスキップ）
CREATE OR REPLACE FUNCTION update_tiers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  IF (
    NEW.title IS DISTINCT FROM OLD.title OR
    NEW.display_name IS DISTINCT FROM OLD.display_name OR
    NEW.data IS DISTINCT FROM OLD.data OR
    NEW.user_hash IS DISTINCT FROM OLD.user_hash OR
    NEW.is_deleted IS DISTINCT FROM OLD.is_deleted
  ) THEN
    NEW.updated_at = now();
  ELSE
    NEW.updated_at = OLD.updated_at;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tiers_updated_at_trigger
  BEFORE UPDATE ON tiers
  FOR EACH ROW
  EXECUTE FUNCTION update_tiers_updated_at();

-- RLS 有効化
ALTER TABLE tiers ENABLE ROW LEVEL SECURITY;

-- 全ユーザー読み取り可能
CREATE POLICY "tiers_select" ON tiers FOR SELECT USING (true);

-- service_role のみ挿入・更新・削除可能（API Route 経由）
CREATE POLICY "tiers_insert" ON tiers FOR INSERT WITH CHECK (true);
CREATE POLICY "tiers_update" ON tiers FOR UPDATE USING (true);
CREATE POLICY "tiers_delete" ON tiers FOR DELETE USING (true);

-- インデックス
CREATE INDEX idx_tiers_likes_count ON tiers (likes_count DESC);
CREATE INDEX idx_tiers_created_at ON tiers (created_at DESC);
CREATE INDEX idx_tiers_user_hash ON tiers (user_hash);
