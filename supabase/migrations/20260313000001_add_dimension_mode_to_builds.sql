-- 編成モードに「次元の衝突」(dimension) を追加
DO $$
BEGIN
  ALTER TABLE builds DROP CONSTRAINT IF EXISTS builds_mode_check;
  ALTER TABLE builds ADD CONSTRAINT builds_mode_check
    CHECK (mode IN ('pvp', 'pve', 'dimension'));
END $$;
