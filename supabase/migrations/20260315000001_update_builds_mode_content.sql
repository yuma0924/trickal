-- 編成モードをコンテンツ単位に変更
-- pvp -> arena, pve -> general に変換し、world_tree を追加
DO $$
BEGIN
  -- 既存データの変換（データがある場合）
  UPDATE builds SET mode = 'general' WHERE mode = 'pve';
  UPDATE builds SET mode = 'arena' WHERE mode = 'pvp';

  -- CHECK 制約を更新
  ALTER TABLE builds DROP CONSTRAINT IF EXISTS builds_mode_check;
  ALTER TABLE builds ADD CONSTRAINT builds_mode_check
    CHECK (mode IN ('general', 'arena', 'dimension', 'world_tree'));
END $$;
