-- ティアリアクション テーブル
CREATE TABLE tier_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_id UUID NOT NULL REFERENCES tiers(id) ON DELETE CASCADE,
  user_hash TEXT NOT NULL,
  reaction_type TEXT NOT NULL DEFAULT 'up' CHECK (reaction_type = 'up'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 同一ユーザーは1つのティアに1回のみ
ALTER TABLE tier_reactions ADD CONSTRAINT tier_reactions_unique UNIQUE (tier_id, user_hash);

-- likes_count 自動更新トリガー
CREATE OR REPLACE FUNCTION update_tier_reaction_counts()
RETURNS TRIGGER AS $$
DECLARE
  target_tier_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_tier_id := OLD.tier_id;
  ELSE
    target_tier_id := NEW.tier_id;
  END IF;

  UPDATE tiers
  SET likes_count = (
    SELECT COUNT(*) FROM tier_reactions
    WHERE tier_id = target_tier_id AND reaction_type = 'up'
  )
  WHERE id = target_tier_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tier_reactions_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON tier_reactions
  FOR EACH ROW
  EXECUTE FUNCTION update_tier_reaction_counts();

-- RLS 有効化
ALTER TABLE tier_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tier_reactions_select" ON tier_reactions FOR SELECT USING (true);
CREATE POLICY "tier_reactions_insert" ON tier_reactions FOR INSERT WITH CHECK (true);
CREATE POLICY "tier_reactions_update" ON tier_reactions FOR UPDATE USING (true);
CREATE POLICY "tier_reactions_delete" ON tier_reactions FOR DELETE USING (true);

-- インデックス
CREATE INDEX idx_tier_reactions_tier_id ON tier_reactions (tier_id);
CREATE INDEX idx_tier_reactions_user_hash ON tier_reactions (user_hash);
