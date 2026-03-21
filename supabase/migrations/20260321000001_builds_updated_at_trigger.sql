-- likes_count / dislikes_count のみの変更時は updated_at を更新しない
CREATE OR REPLACE FUNCTION update_builds_updated_at()
RETURNS trigger AS $$
BEGIN
  -- likes/dislikes だけ変わった場合はスキップ
  IF (NEW.likes_count IS DISTINCT FROM OLD.likes_count
      OR NEW.dislikes_count IS DISTINCT FROM OLD.dislikes_count)
    AND NEW.members IS NOT DISTINCT FROM OLD.members
    AND NEW.comment IS NOT DISTINCT FROM OLD.comment
    AND NEW.title IS NOT DISTINCT FROM OLD.title
    AND NEW.display_name IS NOT DISTINCT FROM OLD.display_name
    AND NEW.mode IS NOT DISTINCT FROM OLD.mode
    AND NEW.is_deleted IS NOT DISTINCT FROM OLD.is_deleted
  THEN
    RETURN NEW;
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_builds_updated_at ON builds;
CREATE TRIGGER trg_builds_updated_at
  BEFORE UPDATE ON builds
  FOR EACH ROW
  EXECUTE FUNCTION update_builds_updated_at();
