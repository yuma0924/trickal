import { BuildsManager } from "../../_components/builds-manager";

export default function BuildsManagePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-text-primary">編成管理</h1>
        <p className="mt-1 text-sm text-text-secondary">
          編成投稿の確認・論理削除・復元
        </p>
      </div>
      <BuildsManager />
    </div>
  );
}
