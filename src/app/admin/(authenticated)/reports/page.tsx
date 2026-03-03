import { ReportsManager } from "../../_components/reports-manager";

export default function ReportsManagePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-text-primary">通報管理</h1>
        <p className="mt-1 text-sm text-text-secondary">
          ユーザーからの通報の確認・対応
        </p>
      </div>
      <ReportsManager />
    </div>
  );
}
