import type { Metadata } from "next";
import { BuildsClient } from "./builds-client";

export const metadata: Metadata = {
  title: "編成ランキング | みんなで決めるトリッカルランキング",
  description:
    "トリッカルのおすすめ編成ランキング。PvP・PvEの人気編成をチェック",
};

export default function BuildsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-text-primary">編成ランキング</h1>
        <p className="mt-1 text-sm text-text-secondary">
          みんなの投稿で人気の編成が決まる
        </p>
      </div>

      <BuildsClient />
    </div>
  );
}
