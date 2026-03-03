import type { Metadata } from "next";
import { SITE_NAME, SITE_DOMAIN } from "@/lib/constants";

export const metadata: Metadata = {
  title: `ガイドライン・利用規約 | ${SITE_NAME}`,
  description:
    "トリッカルランキングの利用規約・免責事項・プライバシーポリシーをご確認ください。",
  openGraph: {
    title: `ガイドライン・利用規約 | ${SITE_NAME}`,
    description:
      "トリッカルランキングの利用規約・免責事項・プライバシーポリシーをご確認ください。",
    type: "website",
    url: `https://${SITE_DOMAIN}/guidelines`,
  },
  twitter: {
    card: "summary_large_image",
  },
};

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 mt-8 border-b border-border-secondary pb-2 text-base font-bold text-text-primary first:mt-0">
      {children}
    </h2>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-2 mt-5 text-sm font-bold text-text-primary">
      {children}
    </h3>
  );
}

function Paragraph({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-sm leading-relaxed text-text-secondary">
      {children}
    </p>
  );
}

function ListItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="mb-1.5 text-sm leading-relaxed text-text-secondary">
      {children}
    </li>
  );
}

export default function GuidelinesPage() {
  return (
    <div className="mx-auto max-w-2xl pb-12">
      <h1 className="mb-6 text-xl font-bold text-text-primary">
        ガイドライン・利用規約
      </h1>

      <div className="rounded-xl border border-border-primary bg-bg-card p-5 sm:p-8">
        <SectionHeading>1. サイトについて</SectionHeading>
        <Paragraph>
          「{SITE_NAME}」（以下「本サイト」）は、ゲーム「トリッカル・もちもちほっぺ大作戦」（以下「トリッカル」）の非公式ファンサイトです。
          プレイヤーの投票・コメントによるキャラクターランキングや、性能データベース、編成共有機能を提供します。
        </Paragraph>
        <Paragraph>
          本サイトはトリッカルの開発元・運営元とは一切関係がありません。
          ゲーム内の画像・名称等の権利はすべて原著作者に帰属します。
        </Paragraph>

        <SectionHeading>2. 利用規約</SectionHeading>

        <SubHeading>2-1. 投稿について</SubHeading>
        <ul className="mb-3 list-disc pl-5">
          <ListItem>
            投稿（コメント・投票・編成）はログイン不要で行えます。
          </ListItem>
          <ListItem>
            同一キャラへの投票（★評価）は、最新の投票で上書きされます。過去のコメント本文は履歴として残ります。
          </ListItem>
          <ListItem>
            投稿後のコメント編集・削除はできません（投票コメントの★評価のみ再投票で更新可能）。
          </ListItem>
          <ListItem>
            投稿内容は他の利用者に公開されます。個人情報の投稿はご遠慮ください。
          </ListItem>
        </ul>

        <SubHeading>2-2. 禁止事項</SubHeading>
        <ul className="mb-3 list-disc pl-5">
          <ListItem>
            荒らし行為、スパム、連続投稿による妨害行為
          </ListItem>
          <ListItem>
            他の利用者への誹謗中傷、差別的表現
          </ListItem>
          <ListItem>
            わいせつな内容、暴力的な内容の投稿
          </ListItem>
          <ListItem>
            虚偽の情報を故意に流布する行為
          </ListItem>
          <ListItem>
            本サイトの運営を妨害する行為
          </ListItem>
          <ListItem>
            その他、管理人が不適切と判断する行為
          </ListItem>
        </ul>

        <SubHeading>2-3. 投稿の管理</SubHeading>
        <Paragraph>
          管理人は、利用規約に違反する投稿を予告なく削除することがあります。
          削除されたコメントは「このコメントは削除されました」と表示されます。
          悪質な行為を繰り返すユーザーに対しては、投稿を制限する場合があります。
        </Paragraph>

        <SectionHeading>3. ランキングについて</SectionHeading>
        <ul className="mb-3 list-disc pl-5">
          <ListItem>
            人気キャラランキングは、プレイヤーの投票（★評価）の平均点に基づいて毎日0時（JST）に集計されます。
          </ListItem>
          <ListItem>
            有効票が4件以上のキャラクターがランキング対象となります。
          </ListItem>
          <ListItem>
            投稿から365日が経過した投票、および低評価（ネットスコア -10以下）の投票は集計から除外されます（投稿自体は表示されます）。
          </ListItem>
          <ListItem>
            ランキングはプレイヤーの主観的な評価であり、公式の見解ではありません。
          </ListItem>
        </ul>

        <SectionHeading>4. プライバシーポリシー</SectionHeading>

        <SubHeading>4-1. 収集する情報</SubHeading>
        <Paragraph>
          本サイトでは、荒らし対策および一人一票制の実現のため、以下の情報を利用してユーザー識別を行います。
        </Paragraph>
        <ul className="mb-3 list-disc pl-5">
          <ListItem>
            Cookie に保存されるランダムな識別子（UUID）
          </ListItem>
          <ListItem>
            IPアドレス（ハッシュ化して利用。生のIPアドレスは保存しません）
          </ListItem>
        </ul>
        <Paragraph>
          これらの情報から一方向ハッシュ値（user_hash）を生成し、投稿者の識別に使用します。
          IPアドレス由来の識別子は、荒らし対策を目的として利用されます。
        </Paragraph>

        <SubHeading>4-2. Cookieの利用</SubHeading>
        <Paragraph>
          本サイトではユーザー識別のためにCookieを使用します。Cookieの有効期限は1年間です。
          Cookieを削除した場合、別のユーザーとして扱われます。
        </Paragraph>

        <SubHeading>4-3. 第三者への提供</SubHeading>
        <Paragraph>
          収集した情報を第三者に提供することはありません。ただし、法令に基づく場合を除きます。
        </Paragraph>

        <SectionHeading>5. 免責事項</SectionHeading>
        <ul className="mb-3 list-disc pl-5">
          <ListItem>
            本サイトに掲載されている情報の正確性・完全性について保証するものではありません。
          </ListItem>
          <ListItem>
            本サイトの利用により生じたいかなる損害についても、管理人は責任を負いません。
          </ListItem>
          <ListItem>
            ゲームのアップデートにより、掲載情報が古くなる場合があります。
            暫定値のデータには「暫定」マークが表示されます。
          </ListItem>
          <ListItem>
            本サイトは予告なくサービスの変更・停止を行うことがあります。
          </ListItem>
        </ul>

        <SectionHeading>6. お問い合わせ</SectionHeading>
        <Paragraph>
          本サイトに関するお問い合わせは、管理人までご連絡ください。
        </Paragraph>

        <div className="mt-8 text-xs text-text-muted">
          最終更新: 2026年3月
        </div>
      </div>
    </div>
  );
}
