import { CommentsManager } from "../../_components/comments-manager";

export default function CommentsManagePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-text-primary">コメント管理</h1>
        <p className="mt-1 text-sm text-text-secondary">
          コメントの確認・論理削除・復元
        </p>
      </div>
      <CommentsManager />
    </div>
  );
}
