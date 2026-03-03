> ## Documentation Index
> Fetch the complete documentation index at: https://code.claude.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Claude Code セッションのチームを調整する

> 複数の Claude Code インスタンスがチームとして連携して動作するように調整します。共有タスク、エージェント間メッセージング、一元管理を備えています。

<Warning>
  エージェントチームは実験的機能であり、デフォルトでは無効です。`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` を [settings.json](/ja/settings) または環境に追加して有効にしてください。エージェントチームには、セッション再開、タスク調整、シャットダウン動作に関する [既知の制限](#limitations) があります。
</Warning>

エージェントチームを使用すると、複数の Claude Code インスタンスが連携して動作するように調整できます。1 つのセッションがチームリーダーとして機能し、作業を調整し、タスクを割り当て、結果を統合します。チームメイトは独立して動作し、それぞれ独自のコンテキストウィンドウで動作し、互いに直接通信します。

単一セッション内で実行され、メインエージェントにのみ報告できる [subagents](/ja/sub-agents) とは異なり、リーダーを経由せずに個別のチームメイトと直接対話することもできます。

このページでは、以下について説明します。

* [エージェントチームを使用する場合](#when-to-use-agent-teams)。ベストユースケースと subagents との比較を含みます
* [チームを開始する](#start-your-first-agent-team)
* [チームメイトを制御する](#control-your-agent-team)。表示モード、タスク割り当て、委任を含みます
* [並列作業のベストプラクティス](#best-practices)

## エージェントチームを使用する場合

エージェントチームは、並列探索が実際の価値を追加するタスクに最も効果的です。完全なシナリオについては、[ユースケース例](#use-case-examples) を参照してください。最も強力なユースケースは以下の通りです。

* **研究とレビュー**: 複数のチームメイトが問題のさまざまな側面を同時に調査し、その後、互いの発見を共有して異議を唱えることができます
* **新しいモジュールまたは機能**: チームメイトは、互いに干渉することなく、個別のピースを所有できます
* **競合する仮説でのデバッグ**: チームメイトは異なる理論を並列でテストし、より速く答えに収束します
* **クロスレイヤー調整**: フロントエンド、バックエンド、テストにまたがる変更。各チームメイトが異なる部分を所有します

エージェントチームは調整オーバーヘッドを追加し、単一セッションよりも大幅に多くのトークンを使用します。チームメイトが独立して動作できる場合に最適です。順序付きタスク、同じファイルの編集、または多くの依存関係を持つ作業の場合、単一セッションまたは [subagents](/ja/sub-agents) がより効果的です。

### subagents との比較

エージェントチームと [subagents](/ja/sub-agents) の両方を使用すると、作業を並列化できますが、動作方法が異なります。ワーカーが互いに通信する必要があるかどうかに基づいて選択してください。

<Frame caption="Subagents は結果をメインエージェントに報告するだけで、互いに話しません。エージェントチームでは、チームメイトがタスクリストを共有し、作業を要求し、互いに直接通信します。">
  <img src="https://mintcdn.com/claude-code/nsvRFSDNfpSU5nT7/images/subagents-vs-agent-teams-light.png?fit=max&auto=format&n=nsvRFSDNfpSU5nT7&q=85&s=2f8db9b4f3705dd3ab931fbe2d96e42a" className="dark:hidden" alt="Subagent とエージェントチームアーキテクチャを比較する図。Subagent はメインエージェントによって生成され、作業を実行し、結果を報告します。エージェントチームは共有タスクリストを通じて調整し、チームメイトが互いに直接通信します。" data-og-width="4245" width="4245" data-og-height="1615" height="1615" data-path="images/subagents-vs-agent-teams-light.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/claude-code/nsvRFSDNfpSU5nT7/images/subagents-vs-agent-teams-light.png?w=280&fit=max&auto=format&n=nsvRFSDNfpSU5nT7&q=85&s=a2cfe413c2084b477be40ac8723d9d40 280w, https://mintcdn.com/claude-code/nsvRFSDNfpSU5nT7/images/subagents-vs-agent-teams-light.png?w=560&fit=max&auto=format&n=nsvRFSDNfpSU5nT7&q=85&s=c642c09a4c211b10b35eee7d7d0d149f 560w, https://mintcdn.com/claude-code/nsvRFSDNfpSU5nT7/images/subagents-vs-agent-teams-light.png?w=840&fit=max&auto=format&n=nsvRFSDNfpSU5nT7&q=85&s=40d286f77c8a4075346b4fcaa2b36248 840w, https://mintcdn.com/claude-code/nsvRFSDNfpSU5nT7/images/subagents-vs-agent-teams-light.png?w=1100&fit=max&auto=format&n=nsvRFSDNfpSU5nT7&q=85&s=923986caa23c0ef2c27d7e45f4dce6d1 1100w, https://mintcdn.com/claude-code/nsvRFSDNfpSU5nT7/images/subagents-vs-agent-teams-light.png?w=1650&fit=max&auto=format&n=nsvRFSDNfpSU5nT7&q=85&s=17a730a070db6d71d029a98b074c68e8 1650w, https://mintcdn.com/claude-code/nsvRFSDNfpSU5nT7/images/subagents-vs-agent-teams-light.png?w=2500&fit=max&auto=format&n=nsvRFSDNfpSU5nT7&q=85&s=e402533fc9e8b5e8d26a835cc4aa1742 2500w" />

  <img src="https://mintcdn.com/claude-code/nsvRFSDNfpSU5nT7/images/subagents-vs-agent-teams-dark.png?fit=max&auto=format&n=nsvRFSDNfpSU5nT7&q=85&s=d573a037540f2ada6a9ae7d8285b46fd" className="hidden dark:block" alt="Subagent とエージェントチームアーキテクチャを比較する図。Subagent はメインエージェントによって生成され、作業を実行し、結果を報告します。エージェントチームは共有タスクリストを通じて調整し、チームメイトが互いに直接通信します。" data-og-width="4245" width="4245" data-og-height="1615" height="1615" data-path="images/subagents-vs-agent-teams-dark.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/claude-code/nsvRFSDNfpSU5nT7/images/subagents-vs-agent-teams-dark.png?w=280&fit=max&auto=format&n=nsvRFSDNfpSU5nT7&q=85&s=06ca5b18b232855acc488357d8d01fa7 280w, https://mintcdn.com/claude-code/nsvRFSDNfpSU5nT7/images/subagents-vs-agent-teams-dark.png?w=560&fit=max&auto=format&n=nsvRFSDNfpSU5nT7&q=85&s=3d34daee83994781eb74b74d1ed511c4 560w, https://mintcdn.com/claude-code/nsvRFSDNfpSU5nT7/images/subagents-vs-agent-teams-dark.png?w=840&fit=max&auto=format&n=nsvRFSDNfpSU5nT7&q=85&s=82ea35ac837de7d674002de69689b9cf 840w, https://mintcdn.com/claude-code/nsvRFSDNfpSU5nT7/images/subagents-vs-agent-teams-dark.png?w=1100&fit=max&auto=format&n=nsvRFSDNfpSU5nT7&q=85&s=3653085214a9fc65d1f589044894a296 1100w, https://mintcdn.com/claude-code/nsvRFSDNfpSU5nT7/images/subagents-vs-agent-teams-dark.png?w=1650&fit=max&auto=format&n=nsvRFSDNfpSU5nT7&q=85&s=8e74b42694e428570e876d34f29e6ad6 1650w, https://mintcdn.com/claude-code/nsvRFSDNfpSU5nT7/images/subagents-vs-agent-teams-dark.png?w=2500&fit=max&auto=format&n=nsvRFSDNfpSU5nT7&q=85&s=3be00c56c6a0dcccbe15640020be0128 2500w" />
</Frame>

|             | Subagents                    | エージェントチーム                     |
| :---------- | :--------------------------- | :---------------------------- |
| **コンテキスト**  | 独自のコンテキストウィンドウ。結果は呼び出し元に返される | 独自のコンテキストウィンドウ。完全に独立          |
| **通信**      | メインエージェントにのみ結果を報告            | チームメイトが互いに直接メッセージを送信          |
| **調整**      | メインエージェントがすべての作業を管理          | 自己調整を備えた共有タスクリスト              |
| **最適な用途**   | 結果のみが重要な焦点を絞ったタスク            | 議論と協力が必要な複雑な作業                |
| **トークンコスト** | 低い: 結果がメインコンテキストに要約される       | 高い: 各チームメイトは個別の Claude インスタンス |

結果を報告する必要がある迅速で焦点を絞ったワーカーが必要な場合は subagents を使用してください。チームメイトが発見を共有し、互いに異議を唱え、独立して調整する必要がある場合は、エージェントチームを使用してください。

## エージェントチームを有効にする

エージェントチームはデフォルトでは無効です。`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` 環境変数を `1` に設定して有効にします。シェル環境または [settings.json](/ja/settings) を通じて設定できます。

```json settings.json theme={null}
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

## 最初のエージェントチームを開始する

エージェントチームを有効にした後、Claude に対してエージェントチームを作成するよう指示し、自然言語でタスクとチーム構造を説明してください。Claude はチームを作成し、チームメイトを生成し、プロンプトに基づいて作業を調整します。

この例は、3 つのロールが独立しており、互いに待つことなく問題を探索できるため、うまく機能します。

```text  theme={null}
I'm designing a CLI tool that helps developers track TODO comments across
their codebase. Create an agent team to explore this from different angles: one
teammate on UX, one on technical architecture, one playing devil's advocate.
```

そこから、Claude は [共有タスクリスト](/ja/interactive-mode#task-list) を備えたチームを作成し、各視点のチームメイトを生成し、問題を探索させ、発見を統合し、完了時に [チームをクリーンアップ](#clean-up-the-team) しようとします。

リーダーのターミナルには、すべてのチームメイトと彼らが取り組んでいることが表示されます。Shift+Down を使用してチームメイトをサイクルして、直接メッセージを送信してください。最後のチームメイトの後、Shift+Down はリーダーに戻ります。

各チームメイトを独自の分割ペインに配置したい場合は、[表示モードを選択](#choose-a-display-mode) を参照してください。

## チームメイトを制御する

リーダーに自然言語で何をしたいかを伝えてください。指示に基づいて、チーム調整、タスク割り当て、委任を処理します。

### 表示モードを選択する

エージェントチームは 2 つの表示モードをサポートしています。

* **インプロセス**: すべてのチームメイトがメインターミナル内で実行されます。Shift+Down を使用してチームメイトをサイクルして、直接メッセージを入力してください。任意のターミナルで動作し、追加のセットアップは不要です。
* **分割ペイン**: 各チームメイトが独自のペインを取得します。すべてのユーザーの出力を一度に表示でき、ペインをクリックして直接対話できます。tmux または iTerm2 が必要です。

<Note>
  `tmux` には特定のオペレーティングシステムでの既知の制限があり、従来は macOS で最適に動作します。iTerm2 で `tmux -CC` を使用することが、`tmux` への推奨エントリーポイントです。
</Note>

デフォルトは `"auto"` です。これは、既に tmux セッション内で実行している場合は分割ペインを使用し、そうでない場合はインプロセスを使用します。`"tmux"` 設定は分割ペインモードを有効にし、ターミナルに基づいて tmux または iTerm2 を使用するかどうかを自動検出します。オーバーライドするには、[settings.json](/ja/settings) で `teammateMode` を設定してください。

```json  theme={null}
{
  "teammateMode": "in-process"
}
```

単一セッションのインプロセスモードを強制するには、フラグとして渡してください。

```bash  theme={null}
claude --teammate-mode in-process
```

分割ペインモードには、[tmux](https://github.com/tmux/tmux/wiki) または [`it2` CLI](https://github.com/mkusaka/it2) を備えた iTerm2 が必要です。手動でインストールするには、以下を実行してください。

* **tmux**: システムのパッケージマネージャーを通じてインストールしてください。プラットフォーム固有の手順については、[tmux wiki](https://github.com/tmux/tmux/wiki/Installing) を参照してください。
* **iTerm2**: [`it2` CLI](https://github.com/mkusaka/it2) をインストールしてから、**iTerm2 → Settings → General → Magic → Enable Python API** で Python API を有効にしてください。

### チームメイトとモデルを指定する

Claude はタスクに基づいてスポーンするチームメイトの数を決定するか、正確に何をしたいかを指定できます。

```text  theme={null}
Create a team with 4 teammates to refactor these modules in parallel.
Use Sonnet for each teammate.
```

### チームメイトのプラン承認を要求する

複雑またはリスクの高いタスクの場合、チームメイトが実装する前にプランを立てることを要求できます。チームメイトは、リーダーがアプローチを承認するまで、読み取り専用プランモードで動作します。

```text  theme={null}
Spawn an architect teammate to refactor the authentication module.
Require plan approval before they make any changes.
```

チームメイトがプランを完了すると、リーダーにプラン承認リクエストを送信します。リーダーはプランをレビューして、承認するか、フィードバック付きで却下するかのいずれかを行います。却下された場合、チームメイトはプランモードのままで、フィードバックに基づいて修正し、再送信します。承認されると、チームメイトはプランモードを終了し、実装を開始します。

リーダーは自律的に承認決定を下します。リーダーの判断に影響を与えるには、プロンプトに「テストカバレッジを含むプランのみを承認する」や「データベーススキーマを変更するプランを却下する」などの基準を指定してください。

### チームメイトと直接話す

各チームメイトは、完全で独立した Claude Code セッションです。任意のチームメイトに直接メッセージを送信して、追加の指示を与えたり、フォローアップの質問をしたり、アプローチをリダイレクトしたりできます。

* **インプロセスモード**: Shift+Down を使用してチームメイトをサイクルして、メッセージを入力してください。Enter キーを押してチームメイトのセッションを表示し、Escape キーを押して現在のターンを中断してください。Ctrl+T を押してタスクリストを切り替えてください。
* **分割ペインモード**: チームメイトのペインをクリックして、セッションと直接対話してください。各チームメイトは独自のターミナルの完全なビューを持っています。

### タスクを割り当てて要求する

共有タスクリストはチーム全体の作業を調整します。リーダーはタスクを作成し、チームメイトはそれらを処理します。タスクには 3 つの状態があります。保留中、進行中、完了。タスクは他のタスクに依存することもできます。未解決の依存関係を持つ保留中のタスクは、それらの依存関係が完了するまで要求できません。

リーダーはタスクを明示的に割り当てるか、チームメイトが自己要求できます。

* **リーダーが割り当てる**: リーダーに、どのタスクをどのチームメイトに与えるかを伝えてください
* **自己要求**: タスクを完了した後、チームメイトは次の割り当てられていない、ブロックされていないタスクを独立して選択します

タスク要求はファイルロックを使用して、複数のチームメイトが同じタスクを同時に要求しようとするときの競合状態を防ぎます。

### チームメイトをシャットダウンする

チームメイトのセッションを適切に終了するには、以下を実行してください。

```text  theme={null}
Ask the researcher teammate to shut down
```

リーダーはシャットダウンリクエストを送信します。チームメイトは承認して適切に終了するか、説明付きで却下できます。

### チームをクリーンアップする

完了したら、リーダーにクリーンアップするよう依頼してください。

```text  theme={null}
Clean up the team
```

これにより、共有チームリソースが削除されます。リーダーがクリーンアップを実行すると、アクティブなチームメイトをチェックし、まだ実行中の場合は失敗するため、最初にシャットダウンしてください。

<Warning>
  常にリーダーを使用してクリーンアップしてください。チームメイトはクリーンアップを実行しないでください。チームメイトのチームコンテキストが正しく解決されない可能性があり、リソースが不整合な状態のままになる可能性があります。
</Warning>

### hooks で品質ゲートを実施する

[hooks](/ja/hooks) を使用して、チームメイトが作業を完了したときまたはタスクが完了したときのルールを実施してください。

* [`TeammateIdle`](/ja/hooks#teammateidle): チームメイトがアイドル状態になろうとしているときに実行されます。終了コード 2 でフィードバックを送信し、チームメイトを動作させ続けてください。
* [`TaskCompleted`](/ja/hooks#taskcompleted): タスクが完了としてマークされているときに実行されます。終了コード 2 で完了を防止し、フィードバックを送信してください。

## エージェントチームの仕組み

このセクションでは、エージェントチームの背後にあるアーキテクチャとメカニクスについて説明します。使用を開始したい場合は、上記の [チームメイトを制御する](#control-your-agent-team) を参照してください。

### Claude がエージェントチームを開始する方法

エージェントチームが開始される方法は 2 つあります。

* **チームをリクエストする**: 並列作業から利益を得るタスクを Claude に与え、明示的にエージェントチームをリクエストしてください。Claude は指示に基づいてチームを作成します。
* **Claude がチームを提案する**: Claude がタスクが並列作業から利益を得ると判断した場合、チームの作成を提案する可能性があります。進行する前に確認してください。

どちらの場合でも、制御は維持されます。Claude は承認なしにチームを作成しません。

### アーキテクチャ

エージェントチームは以下で構成されています。

| コンポーネント     | ロール                                             |
| :---------- | :---------------------------------------------- |
| **チームリーダー** | チームを作成し、チームメイトを生成し、作業を調整するメイン Claude Code セッション |
| **チームメイト**  | 割り当てられたタスクで動作する個別の Claude Code インスタンス           |
| **タスクリスト**  | チームメイトが要求して完了する共有作業項目リスト                        |
| **メールボックス** | エージェント間の通信用メッセージングシステム                          |

表示設定オプションについては、[表示モードを選択](#choose-a-display-mode) を参照してください。チームメイトメッセージは自動的にリーダーに到着します。

システムはタスク依存関係を自動的に管理します。チームメイトが他のタスクが依存するタスクを完了すると、ブロックされたタスクは手動介入なしにブロック解除されます。

チームとタスクはローカルに保存されます。

* **チーム設定**: `~/.claude/teams/{team-name}/config.json`
* **タスクリスト**: `~/.claude/tasks/{team-name}/`

チーム設定には、各チームメイトの名前、エージェント ID、エージェントタイプを含む `members` 配列が含まれています。チームメイトはこのファイルを読み取って、他のチームメンバーを発見できます。

### 権限

チームメイトはリーダーの権限設定で開始します。リーダーが `--dangerously-skip-permissions` で実行される場合、すべてのチームメイトも同様です。生成後、個別のチームメイトモードを変更できますが、生成時にチームメイトごとのモードを設定することはできません。

### コンテキストと通信

各チームメイトは独自のコンテキストウィンドウを持っています。生成されると、チームメイトは通常のセッションと同じプロジェクトコンテキストをロードします。CLAUDE.md、MCP サーバー、スキル。また、リーダーからのスポーンプロンプトも受け取ります。リーダーの会話履歴は引き継がれません。

**チームメイトが情報を共有する方法:**

* **自動メッセージ配信**: チームメイトがメッセージを送信すると、受信者に自動的に配信されます。リーダーは更新をポーリングする必要はありません。
* **アイドル通知**: チームメイトが完了して停止すると、自動的にリーダーに通知します。
* **共有タスクリスト**: すべてのエージェントはタスクステータスを表示でき、利用可能な作業を要求できます。

**チームメイトメッセージング:**

* **message**: 1 つの特定のチームメイトにメッセージを送信します
* **broadcast**: すべてのチームメイトに同時に送信します。チームサイズでコストがスケールするため、控えめに使用してください。

### トークン使用量

エージェントチームは単一セッションよりも大幅に多くのトークンを使用します。各チームメイトは独自のコンテキストウィンドウを持ち、トークン使用量はアクティブなチームメイトの数でスケールします。研究、レビュー、新機能作業の場合、追加のトークンは通常価値があります。ルーチンタスクの場合、単一セッションがより費用効果的です。使用ガイダンスについては、[エージェントチームトークンコスト](/ja/costs#agent-team-token-costs) を参照してください。

## ユースケース例

これらの例は、並列探索が価値を追加するタスクをエージェントチームがどのように処理するかを示しています。

### 並列コードレビューを実行する

単一のレビュアーは、一度に 1 つのタイプの問題に向かう傾向があります。レビュー基準を独立したドメインに分割することで、セキュリティ、パフォーマンス、テストカバレッジがすべて同時に徹底的に注意を受けます。プロンプトは各チームメイトに異なるレンズを割り当てるため、重複しません。

```text  theme={null}
Create an agent team to review PR #142. Spawn three reviewers:
- One focused on security implications
- One checking performance impact
- One validating test coverage
Have them each review and report findings.
```

各レビュアーは同じ PR から動作しますが、異なるフィルターを適用します。リーダーは、3 人全員が完了した後、すべてのレビュアーの発見を統合します。

### 競合する仮説で調査する

根本原因が不明な場合、単一のエージェントは 1 つのもっともらしい説明を見つけて、探索を停止する傾向があります。プロンプトは、チームメイトを明示的に敵対的にすることでこれと戦います。各チームメイトの仕事は、独自の理論を調査するだけでなく、他の理論に異議を唱えることです。

```text  theme={null}
Users report the app exits after one message instead of staying connected.
Spawn 5 agent teammates to investigate different hypotheses. Have them talk to
each other to try to disprove each other's theories, like a scientific
debate. Update the findings doc with whatever consensus emerges.
```

議論構造はここでの重要なメカニズムです。順序付き調査はアンカリングに悩まされます。1 つの理論が探索されると、その後の調査はそれに向かってバイアスされます。

複数の独立した調査官が互いに積極的に反証しようとしている場合、生き残る理論は実際の根本原因である可能性がはるかに高くなります。

## ベストプラクティス

### チームメイトに十分なコンテキストを提供する

チームメイトはプロジェクトコンテキストを自動的にロードします。CLAUDE.md、MCP サーバー、スキルを含みます。ただし、リーダーの会話履歴は継承しません。詳細については、[コンテキストと通信](#context-and-communication) を参照してください。スポーンプロンプトにタスク固有の詳細を含めてください。

```text  theme={null}
Spawn a security reviewer teammate with the prompt: "Review the authentication module
at src/auth/ for security vulnerabilities. Focus on token handling, session
management, and input validation. The app uses JWT tokens stored in
httpOnly cookies. Report any issues with severity ratings."
```

### 適切なチームサイズを選択する

チームメイトの数に厳しい制限はありませんが、実際の制約が適用されます。

* **トークンコストは線形にスケール**: 各チームメイトは独自のコンテキストウィンドウを持ち、独立してトークンを消費します。詳細については、[エージェントチームトークンコスト](/ja/costs#agent-team-token-costs) を参照してください。
* **調整オーバーヘッドが増加**: より多くのチームメイトは、より多くの通信、タスク調整、および競合の可能性を意味します
* **収益逓減**: ある時点を超えると、追加のチームメイトは作業を比例的に高速化しません

ほとんどのワークフローでは、3～5 人のチームメイトで開始してください。これは並列作業と管理可能な調整のバランスを取ります。このガイドの例では、3～5 人のチームメイトを使用しています。その範囲はさまざまなタスクタイプ全体でうまく機能するためです。

チームメイトあたり 5～6 個の [タスク](/ja/agent-teams#architecture) を持つことで、過度なコンテキストスイッチングなしに、すべてを生産的に保ちます。15 個の独立したタスクがある場合、3 人のチームメイトは良い出発点です。

作業が本当にチームメイトが同時に動作することから利益を得る場合にのみスケールアップしてください。3 人の焦点を絞ったチームメイトは、5 人の散らばったチームメイトを上回ることが多いです。

### タスクを適切にサイズする

* **小さすぎる**: 調整オーバーヘッドが利益を超える
* **大きすぎる**: チームメイトはチェックインなしで長時間動作し、無駄な努力のリスクが増加します
* **ちょうど良い**: 関数、テストファイル、またはレビューなど、明確な成果物を生成する自己完結型ユニット

<Tip>
  リーダーは作業をタスクに分割し、チームメイトに自動的に割り当てます。十分なタスクを作成していない場合は、作業をより小さなピースに分割するよう依頼してください。チームメイトあたり 5～6 個のタスクを持つことで、すべてを生産的に保ち、誰かが立ち往生した場合にリーダーが作業を再割り当てできます。
</Tip>

### チームメイトが完了するまで待つ

リーダーがチームメイトを待たずにタスク自体を実装し始めることがあります。これに気付いた場合は、以下を実行してください。

```text  theme={null}
Wait for your teammates to complete their tasks before proceeding
```

### 研究とレビューから開始する

エージェントチームが初めての場合は、明確な境界があり、コードを書く必要がないタスクから開始してください。PR をレビューする、ライブラリを研究する、またはバグを調査します。これらのタスクは、並列実装に伴う調整の課題なしに、並列探索の価値を示しています。

### ファイルの競合を回避する

2 人のチームメイトが同じファイルを編集すると、上書きが発生します。作業を分割して、各チームメイトが異なるファイルセットを所有するようにしてください。

### 監視とステアリング

チームメイトの進捗をチェックし、機能していないアプローチをリダイレクトし、発見が入ってくるにつれて統合してください。チームを長時間無人で実行させると、無駄な努力のリスクが増加します。

## トラブルシューティング

### チームメイトが表示されない

Claude にチームを作成するよう依頼した後、チームメイトが表示されない場合は、以下を実行してください。

* インプロセスモードでは、チームメイトは既に実行されているが、表示されていない可能性があります。Shift+Down を押してアクティブなチームメイトをサイクルしてください。
* Claude に与えたタスクがチームを保証するのに十分複雑であることを確認してください。Claude はタスクに基づいてチームメイトをスポーンするかどうかを決定します。
* 分割ペインを明示的にリクエストした場合は、tmux がインストールされ、PATH で利用可能であることを確認してください。

```bash  theme={null}
which tmux
```

* iTerm2 の場合、`it2` CLI がインストールされ、Python API が iTerm2 の設定で有効になっていることを確認してください。

### 権限プロンプトが多すぎる

チームメイト権限リクエストはリーダーにバブルアップし、摩擦を生じさせる可能性があります。チームメイトをスポーンする前に、[権限設定](/ja/permissions) で一般的な操作を事前承認して、中断を減らしてください。

### チームメイトがエラーで停止する

チームメイトはエラーが発生した後、回復する代わりに停止する可能性があります。インプロセスモードで Shift+Down を使用するか、分割モードでペインをクリックして、出力をチェックしてから、以下のいずれかを実行してください。

* 追加の指示を直接与える
* 作業を続行するために置き換えチームメイトをスポーンする

### リーダーが作業完了前にシャットダウンする

リーダーは、すべてのタスクが実際に完了する前に、チームが完了したと判断する可能性があります。これが発生した場合は、続行するよう指示してください。リーダーが作業を委任する代わりに実行を開始した場合、チームメイトが完了するまで待つようにリーダーに指示することもできます。

### 孤立した tmux セッション

チームが終了した後、tmux セッションが存在する場合、完全にクリーンアップされていない可能性があります。セッションをリストして、チームによって作成されたセッションを終了してください。

```bash  theme={null}
tmux ls
tmux kill-session -t <session-name>
```

## 制限事項

エージェントチームは実験的です。注意すべき現在の制限事項は以下の通りです。

* **インプロセスチームメイトでのセッション再開なし**: `/resume` と `/rewind` はインプロセスチームメイトを復元しません。セッションを再開した後、リーダーは存在しなくなったチームメイトにメッセージを送信しようとする可能性があります。これが発生した場合は、リーダーに新しいチームメイトをスポーンするよう指示してください。
* **タスクステータスは遅延する可能性があります**: チームメイトはタスクを完了としてマークできず、依存タスクをブロックすることがあります。タスクが立ち往生しているように見える場合は、作業が実際に完了しているかどうかを確認し、タスクステータスを手動で更新するか、リーダーにチームメイトを促すよう指示してください。
* **シャットダウンは遅い可能性があります**: チームメイトは現在のリクエストまたはツール呼び出しを完了してからシャットダウンします。これには時間がかかる可能性があります。
* **セッションあたり 1 つのチーム**: リーダーは一度に 1 つのチームのみを管理できます。新しいチームを開始する前に、現在のチームをクリーンアップしてください。
* **ネストされたチームなし**: チームメイトは独自のチームまたはチームメイトをスポーンできません。リーダーのみがチームを管理できます。
* **リーダーは固定**: チームを作成するセッションは、その生涯のリーダーです。チームメイトをリーダーに昇格させたり、リーダーシップを譲渡したりすることはできません。
* **権限はスポーン時に設定**: すべてのチームメイトはリーダーの権限モードで開始します。スポーン後に個別のチームメイトモードを変更できますが、スポーン時にチームメイトごとのモードを設定することはできません。
* **分割ペインには tmux または iTerm2 が必要**: デフォルトのインプロセスモードは任意のターミナルで動作します。分割ペインモードは VS Code の統合ターミナル、Windows Terminal、または Ghostty ではサポートされていません。

<Tip>
  **`CLAUDE.md` は正常に動作します**: チームメイトは作業ディレクトリから `CLAUDE.md` ファイルを読み取ります。これを使用して、すべてのチームメイトにプロジェクト固有のガイダンスを提供してください。
</Tip>

## 次のステップ

並列作業と委任の関連アプローチを探索してください。

* **軽量委任**: [subagents](/ja/sub-agents) はセッション内でヘルパーエージェントを生成して、研究または検証を行います。エージェント間調整が必要ないタスクに適しています
* **手動並列セッション**: [Git worktrees](/ja/common-workflows#run-parallel-claude-code-sessions-with-git-worktrees) を使用すると、自動チーム調整なしで複数の Claude Code セッションを自分で実行できます
* **アプローチを比較**: [subagent とエージェントチーム](/ja/features-overview#compare-similar-features) の比較を参照して、並べて比較してください
