import { BlacklistManager } from "../../_components/blacklist-manager";

export default function BlacklistManagePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-text-primary">BAN管理</h1>
        <p className="mt-1 text-sm text-text-secondary">
          ブラックリストの管理
        </p>
      </div>
      <BlacklistManager />
    </div>
  );
}
