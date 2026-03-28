-- tier_comments テーブル
CREATE TABLE tier_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_id UUID NOT NULL REFERENCES tiers(id) ON DELETE CASCADE,
  user_hash TEXT NOT NULL,
  display_name TEXT,
  body TEXT NOT NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  thumbs_up_count INTEGER NOT NULL DEFAULT 0,
  thumbs_down_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- tier_comment_reactions テーブル
CREATE TABLE tier_comment_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_comment_id UUID NOT NULL REFERENCES tier_comments(id) ON DELETE CASCADE,
  user_hash TEXT NOT NULL,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('up', 'down')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tier_comment_id, user_hash)
);

-- インデックス
CREATE INDEX idx_tier_comments_tier_created ON tier_comments(tier_id, created_at DESC);
CREATE INDEX idx_tier_comments_thumbs_up ON tier_comments(tier_id, thumbs_up_count DESC);
CREATE INDEX idx_tier_comment_reactions_comment ON tier_comment_reactions(tier_comment_id);
CREATE INDEX idx_tier_comment_reactions_user ON tier_comment_reactions(user_hash);

-- RLS
ALTER TABLE tier_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tier_comment_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read tier_comments" ON tier_comments FOR SELECT USING (true);
CREATE POLICY "Allow all tier_comments for service_role" ON tier_comments FOR ALL TO service_role USING (true);

CREATE POLICY "Allow read tier_comment_reactions" ON tier_comment_reactions FOR SELECT USING (true);
CREATE POLICY "Allow all tier_comment_reactions for service_role" ON tier_comment_reactions FOR ALL TO service_role USING (true);
