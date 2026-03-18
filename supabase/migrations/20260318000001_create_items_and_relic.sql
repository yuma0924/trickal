-- items マスタテーブル（好物・アルバイト報酬の共通管理）
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  image_url TEXT,
  item_type TEXT NOT NULL CHECK (item_type IN ('favorite', 'reward')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS 有効化
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- 全ユーザー読み取り可
CREATE POLICY "items_select_all" ON items FOR SELECT USING (true);

-- characters に好物・アルバイト報酬の FK を追加
ALTER TABLE characters ADD COLUMN favorite_item_id UUID REFERENCES items(id) ON DELETE SET NULL;
ALTER TABLE characters ADD COLUMN part_time_reward_id UUID REFERENCES items(id) ON DELETE SET NULL;

-- 専用遺物は metadata JSONB 内に格納（relic: { name, image_url, description }）
-- マイグレーション不要（既存の metadata カラムを使用）
