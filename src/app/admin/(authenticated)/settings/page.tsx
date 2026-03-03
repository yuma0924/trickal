import { SettingsEditor } from "../../_components/settings-editor";

export default function SettingsManagePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-text-primary">サイト設定</h1>
        <p className="mt-1 text-sm text-text-secondary">
          サイト表示名・ラベル・SEO設定の管理
        </p>
      </div>
      <SettingsEditor />
    </div>
  );
}
