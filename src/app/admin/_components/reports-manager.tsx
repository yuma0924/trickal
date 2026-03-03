"use client";

import { useState, useEffect, useCallback } from "react";

type ReportRow = {
  id: string;
  target_type: "comment" | "build" | "build_comment";
  target_id: string;
  user_hash: string;
  reason: string | null;
  status: "pending" | "resolved" | "dismissed";
  created_at: string;
};

const TARGET_TYPE_LABELS: Record<string, string> = {
  comment: "コメント",
  build: "編成",
  build_comment: "編成コメント",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "未対応",
  resolved: "対応済み",
  dismissed: "却下",
};

export function ReportsManager() {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const limit = 50;

  const fetchReports = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      status: statusFilter,
      page: String(page),
      limit: String(limit),
    });

    const res = await fetch(`/api/admin/reports?${params}`);
    if (res.ok) {
      const data = await res.json();
      setReports(data.reports ?? []);
      setTotal(data.total ?? 0);
    }
    setLoading(false);
  }, [page, statusFilter]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleStatusChange = async (
    id: string,
    newStatus: "resolved" | "dismissed"
  ) => {
    setActionId(id);
    const res = await fetch("/api/admin/reports", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: newStatus }),
    });
    if (res.ok) {
      await fetchReports();
    }
    setActionId(null);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      {/* フィルター */}
      <div className="flex flex-wrap items-center gap-2">
        {["pending", "resolved", "dismissed", "all"].map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatusFilter(s);
              setPage(1);
            }}
            className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              statusFilter === s
                ? "bg-accent text-accent-text"
                : "bg-bg-tertiary text-text-secondary hover:text-text-primary"
            }`}
          >
            {s === "all" ? "全て" : STATUS_LABELS[s]}
          </button>
        ))}
        <span className="ml-auto text-xs text-text-tertiary">{total}件</span>
      </div>

      {/* テーブル */}
      <div className="overflow-x-auto rounded-xl border border-border-primary">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border-primary bg-bg-secondary text-left">
              <th className="px-3 py-2 font-medium text-text-secondary">対象</th>
              <th className="px-3 py-2 font-medium text-text-secondary">対象ID</th>
              <th className="px-3 py-2 font-medium text-text-secondary">理由</th>
              <th className="px-3 py-2 font-medium text-text-secondary">通報者</th>
              <th className="px-3 py-2 font-medium text-text-secondary">日時</th>
              <th className="px-3 py-2 font-medium text-text-secondary">状態</th>
              <th className="px-3 py-2 font-medium text-text-secondary">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-text-tertiary">
                  読み込み中...
                </td>
              </tr>
            ) : reports.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-text-tertiary">
                  通報がありません
                </td>
              </tr>
            ) : (
              reports.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-border-secondary hover:bg-bg-card-hover"
                >
                  <td className="px-3 py-2">
                    <span className="rounded bg-bg-tertiary px-1.5 py-0.5 text-[10px] font-medium text-text-secondary">
                      {TARGET_TYPE_LABELS[r.target_type] || r.target_type}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono text-[10px] text-text-tertiary">
                    {r.target_id.slice(0, 8)}...
                  </td>
                  <td className="max-w-xs truncate px-3 py-2 text-text-primary">
                    {r.reason || "-"}
                  </td>
                  <td className="px-3 py-2 font-mono text-[10px] text-text-tertiary">
                    {r.user_hash.slice(0, 8)}...
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-text-tertiary">
                    {new Date(r.created_at).toLocaleString("ja-JP", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                        r.status === "pending"
                          ? "bg-star/10 text-star"
                          : r.status === "resolved"
                            ? "bg-thumbs-up/10 text-thumbs-up"
                            : "bg-text-muted/10 text-text-muted"
                      }`}
                    >
                      {STATUS_LABELS[r.status]}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    {r.status === "pending" && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleStatusChange(r.id, "resolved")}
                          disabled={actionId === r.id}
                          className="cursor-pointer rounded bg-thumbs-up/10 px-2 py-1 text-[10px] font-medium text-thumbs-up transition-colors hover:bg-thumbs-up/20 disabled:opacity-50"
                        >
                          対応済み
                        </button>
                        <button
                          onClick={() => handleStatusChange(r.id, "dismissed")}
                          disabled={actionId === r.id}
                          className="cursor-pointer rounded bg-text-muted/10 px-2 py-1 text-[10px] font-medium text-text-secondary transition-colors hover:bg-text-muted/20 disabled:opacity-50"
                        >
                          却下
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ページネーション */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="cursor-pointer rounded-lg border border-border-primary px-3 py-1.5 text-xs text-text-secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            前へ
          </button>
          <span className="text-xs text-text-tertiary">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="cursor-pointer rounded-lg border border-border-primary px-3 py-1.5 text-xs text-text-secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            次へ
          </button>
        </div>
      )}
    </div>
  );
}
