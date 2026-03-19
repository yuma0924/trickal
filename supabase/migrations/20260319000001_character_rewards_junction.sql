-- アルバイト報酬を可変数対応するため中間テーブルを作成
CREATE TABLE character_rewards (
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (character_id, item_id)
);

ALTER TABLE character_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "character_rewards_select_all" ON character_rewards FOR SELECT USING (true);

-- 既存の単一FK part_time_reward_id を削除
ALTER TABLE characters DROP COLUMN IF EXISTS part_time_reward_id;
