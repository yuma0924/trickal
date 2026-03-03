-- 非正規化カウント自動更新トリガー
-- リアクションの INSERT/UPDATE/DELETE 時に親テーブルのカウントを更新

-------------------------------------------------------
-- comment_reactions → comments.thumbs_up_count / thumbs_down_count
-------------------------------------------------------
CREATE OR REPLACE FUNCTION update_comment_reaction_counts()
RETURNS TRIGGER AS $$
DECLARE
  target_comment_id UUID;
BEGIN
  -- 対象の comment_id を特定
  IF TG_OP = 'DELETE' THEN
    target_comment_id := OLD.comment_id;
  ELSE
    target_comment_id := NEW.comment_id;
  END IF;

  -- DELETE 後に旧レコードの分も更新が必要
  IF TG_OP = 'UPDATE' AND OLD.comment_id <> NEW.comment_id THEN
    UPDATE comments SET
      thumbs_up_count = (SELECT COUNT(*) FROM comment_reactions WHERE comment_id = OLD.comment_id AND reaction_type = 'up'),
      thumbs_down_count = (SELECT COUNT(*) FROM comment_reactions WHERE comment_id = OLD.comment_id AND reaction_type = 'down')
    WHERE id = OLD.comment_id;
  END IF;

  UPDATE comments SET
    thumbs_up_count = (SELECT COUNT(*) FROM comment_reactions WHERE comment_id = target_comment_id AND reaction_type = 'up'),
    thumbs_down_count = (SELECT COUNT(*) FROM comment_reactions WHERE comment_id = target_comment_id AND reaction_type = 'down')
  WHERE id = target_comment_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_comment_reactions_count
  AFTER INSERT OR UPDATE OR DELETE ON comment_reactions
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_reaction_counts();

-------------------------------------------------------
-- build_reactions → builds.likes_count / dislikes_count
-------------------------------------------------------
CREATE OR REPLACE FUNCTION update_build_reaction_counts()
RETURNS TRIGGER AS $$
DECLARE
  target_build_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_build_id := OLD.build_id;
  ELSE
    target_build_id := NEW.build_id;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.build_id <> NEW.build_id THEN
    UPDATE builds SET
      likes_count = (SELECT COUNT(*) FROM build_reactions WHERE build_id = OLD.build_id AND reaction_type = 'up'),
      dislikes_count = (SELECT COUNT(*) FROM build_reactions WHERE build_id = OLD.build_id AND reaction_type = 'down')
    WHERE id = OLD.build_id;
  END IF;

  UPDATE builds SET
    likes_count = (SELECT COUNT(*) FROM build_reactions WHERE build_id = target_build_id AND reaction_type = 'up'),
    dislikes_count = (SELECT COUNT(*) FROM build_reactions WHERE build_id = target_build_id AND reaction_type = 'down')
  WHERE id = target_build_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_build_reactions_count
  AFTER INSERT OR UPDATE OR DELETE ON build_reactions
  FOR EACH ROW
  EXECUTE FUNCTION update_build_reaction_counts();

-------------------------------------------------------
-- build_comment_reactions → build_comments.thumbs_up_count / thumbs_down_count
-------------------------------------------------------
CREATE OR REPLACE FUNCTION update_build_comment_reaction_counts()
RETURNS TRIGGER AS $$
DECLARE
  target_build_comment_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_build_comment_id := OLD.build_comment_id;
  ELSE
    target_build_comment_id := NEW.build_comment_id;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.build_comment_id <> NEW.build_comment_id THEN
    UPDATE build_comments SET
      thumbs_up_count = (SELECT COUNT(*) FROM build_comment_reactions WHERE build_comment_id = OLD.build_comment_id AND reaction_type = 'up'),
      thumbs_down_count = (SELECT COUNT(*) FROM build_comment_reactions WHERE build_comment_id = OLD.build_comment_id AND reaction_type = 'down')
    WHERE id = OLD.build_comment_id;
  END IF;

  UPDATE build_comments SET
    thumbs_up_count = (SELECT COUNT(*) FROM build_comment_reactions WHERE build_comment_id = target_build_comment_id AND reaction_type = 'up'),
    thumbs_down_count = (SELECT COUNT(*) FROM build_comment_reactions WHERE build_comment_id = target_build_comment_id AND reaction_type = 'down')
  WHERE id = target_build_comment_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_build_comment_reactions_count
  AFTER INSERT OR UPDATE OR DELETE ON build_comment_reactions
  FOR EACH ROW
  EXECUTE FUNCTION update_build_comment_reaction_counts();
