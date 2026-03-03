-- updated_at 自動更新トリガー関数
-- updated_at カラムを持つ全テーブルに適用

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- characters
CREATE TRIGGER trg_characters_updated_at
  BEFORE UPDATE ON characters
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- comments
CREATE TRIGGER trg_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- comment_reactions
CREATE TRIGGER trg_comment_reactions_updated_at
  BEFORE UPDATE ON comment_reactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
