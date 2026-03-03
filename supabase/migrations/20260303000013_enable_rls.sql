-- RLS (Row Level Security) を全テーブルで有効化
-- 方針: 公開読み取り(anon)、書き込みはAPI Route経由 (service_role key) のみ
-- API Route は service_role key を使用するため RLS をバイパスする

-- RLS 有効化
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE blacklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE builds ENABLE ROW LEVEL SECURITY;
ALTER TABLE build_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE build_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE build_comment_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- 公開読み取りポリシー (anon ロール)
-- キャラクター: 非表示でないもののみ公開
CREATE POLICY "characters_select_public" ON characters
  FOR SELECT TO anon
  USING (is_hidden = false);

-- コメント: 全件読み取り可 (is_deleted は表示側で制御)
CREATE POLICY "comments_select_public" ON comments
  FOR SELECT TO anon
  USING (true);

-- ランキング: 全件公開
CREATE POLICY "character_rankings_select_public" ON character_rankings
  FOR SELECT TO anon
  USING (true);

-- コメントリアクション: 全件公開
CREATE POLICY "comment_reactions_select_public" ON comment_reactions
  FOR SELECT TO anon
  USING (true);

-- サイト設定: 公開
CREATE POLICY "site_config_select_public" ON site_config
  FOR SELECT TO anon
  USING (true);

-- blacklist: 公開読み取り不可 (API Route の service_role 経由でのみアクセス)
-- anon への SELECT ポリシーなし = アクセス拒否

-- 編成: 全件読み取り可 (is_deleted は表示側で制御)
CREATE POLICY "builds_select_public" ON builds
  FOR SELECT TO anon
  USING (true);

-- 編成リアクション: 全件公開
CREATE POLICY "build_reactions_select_public" ON build_reactions
  FOR SELECT TO anon
  USING (true);

-- 編成コメント: 全件読み取り可
CREATE POLICY "build_comments_select_public" ON build_comments
  FOR SELECT TO anon
  USING (true);

-- 編成コメントリアクション: 全件公開
CREATE POLICY "build_comment_reactions_select_public" ON build_comment_reactions
  FOR SELECT TO anon
  USING (true);

-- reports: 公開読み取り不可 (管理者のみ service_role 経由でアクセス)
-- anon への SELECT ポリシーなし = アクセス拒否
