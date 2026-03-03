-- characters: キャラクター情報テーブル
-- stats/skills/metadata は JSONB を活用した汎用設計

CREATE TABLE characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  rarity TEXT,
  element TEXT,
  role TEXT,
  race TEXT,
  position TEXT,
  stats JSONB DEFAULT '{}'::jsonb,
  skills JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  image_url TEXT,
  is_provisional BOOLEAN NOT NULL DEFAULT false,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- インデックス
CREATE INDEX idx_characters_element ON characters (element);
CREATE INDEX idx_characters_slug ON characters (slug);
CREATE INDEX idx_characters_is_hidden ON characters (is_hidden) WHERE is_hidden = false;

COMMENT ON TABLE characters IS 'キャラクター情報';
COMMENT ON COLUMN characters.slug IS 'URL用キャラ識別子';
COMMENT ON COLUMN characters.stats IS 'ステータス値 (HP, 物理攻撃, 魔法攻撃, 防御, 速度, クリティカル等)';
COMMENT ON COLUMN characters.skills IS 'スキル情報';
COMMENT ON COLUMN characters.metadata IS 'その他メタ情報 (アルバイトアイテム等)';
COMMENT ON COLUMN characters.is_provisional IS '暫定値フラグ (サイト上に警告表示)';
COMMENT ON COLUMN characters.is_hidden IS '非表示フラグ (公開ページから除外、DB上は維持)';
