-- site_config: サイト設定 (シングルトン: 1行のみ)
-- id = 1 の CHECK 制約でシングルトンを保証

CREATE TABLE site_config (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  display_name TEXT NOT NULL DEFAULT 'みんなで決めるトリッカルランキング',
  labels JSONB DEFAULT '{}'::jsonb,
  description TEXT DEFAULT 'トリッカル・もちもちほっぺ大作戦の全キャラクター性能を数値で比較し、プレイヤーの投票でリアルな順位を決定する非公式データベースです。'
);

-- 初期データ投入
INSERT INTO site_config (id) VALUES (1);

COMMENT ON TABLE site_config IS 'サイト設定 (シングルトン: 1行のみ)';
COMMENT ON COLUMN site_config.labels IS 'ステータス項目名の動的ラベル等';
COMMENT ON COLUMN site_config.description IS 'SEO説明文';
