-- builds: 編成投稿 (PvP / PvE)
-- 上書きルール: 同一 user_hash x 同一 mode x 同一 party_size は最新で上書き

CREATE TABLE builds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mode TEXT NOT NULL CHECK (mode IN ('pvp', 'pve')),
  party_size INTEGER NOT NULL CHECK (party_size >= 1 AND party_size <= 9),
  members UUID[] NOT NULL,
  element_label TEXT,
  title TEXT,
  display_name TEXT,
  comment TEXT NOT NULL,
  user_hash TEXT NOT NULL,
  likes_count INTEGER NOT NULL DEFAULT 0,
  dislikes_count INTEGER NOT NULL DEFAULT 0,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 一覧表示: モード別 👍数降順
CREATE INDEX idx_builds_mode_likes ON builds (mode, likes_count DESC)
  WHERE is_deleted = false;

-- 上書き判定: 同一ユーザー×同一モード×同一パーティサイズ
CREATE INDEX idx_builds_upsert_lookup ON builds (user_hash, mode, party_size)
  WHERE is_deleted = false;

-- 属性フィルター
CREATE INDEX idx_builds_element ON builds (element_label)
  WHERE is_deleted = false;

-- 更新日時順 (同点時のタイブレーク)
CREATE INDEX idx_builds_updated ON builds (updated_at DESC)
  WHERE is_deleted = false;

-- updated_at 自動更新トリガー
CREATE TRIGGER trg_builds_updated_at
  BEFORE UPDATE ON builds
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE builds IS '編成投稿 (PvP / PvE)';
COMMENT ON COLUMN builds.mode IS 'pvp / pve';
COMMENT ON COLUMN builds.party_size IS '枠数 (基本6、最大9)';
COMMENT ON COLUMN builds.members IS 'キャラID配列';
COMMENT ON COLUMN builds.element_label IS '単色属性名 / 混合';
COMMENT ON COLUMN builds.likes_count IS '👍数 (非正規化キャッシュ、トリガーで自動更新)';
COMMENT ON COLUMN builds.dislikes_count IS '👎数 (非正規化キャッシュ、トリガーで自動更新)';
