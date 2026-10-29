## 结论先行

我已定位：主界面里"输入后跑到右边、比下方输入框窄"的是**用户消息卡片**（`ConversationUserInputBubble`，右对齐 + `max-w-xl` 封顶 576px）和**它的行内编辑框**（`ChatPromptEditor` 在 `items-end` 行里 `max-w-xl`）。两者都改为整行宽度、左对齐，与底部 composer 同宽。

## 改动内容

### 1. 发送后的用户消息卡片 → 整行宽、左对齐

```text
现在（会话态 1280px+，列宽 1152px）            改后
        ┌──────────────┐                       ┌────────────────────────────────┐
        │ 我输入的文字  │ ← 右对齐 576px   →    │ 我输入的文字                    │ ← 左对齐
        └──────────────┘                       └────────────────────────────────┘
┌────────────────────────────────────────────┐ ┌──────────────────────────────┐
│  composer  1152 - 32 = 1120px              │ │ composer  1120px             │
└────────────────────────────────────────────┘ └──────────────────────────────┘
```

- `packages/ui/src/v4/ConversationUserInputBubble.tsx:27`：`max-w-full ... @min-[624px]/conversation:max-w-xl` → `w-full`，圆角尾角从 `rounded-tr-xs` 改为 `rounded-tl-xs`（跟随左对齐）。
- `packages/ui/src/v4/ConversationRowView.tsx`：
  - `1298` 行壳 `items-end` → `items-start`；`1302` 自动化来源行 `max-w-xl` → `w-full`。
  - `1319` 附件区 `max-w-xl flex-col items-end` → `w-full flex-col items-start`；`1322/1332/1351` 的 `justify-end` → `justify-start`。
  - `1325/1365/1366/1369/1374/1378` 上下文 chip 的 `contentAlign="end"` → `"start"`（浮层改为左边缘对齐、向右展开）。
  - `1398/1408/1419`（genUi 来源、插件来源、发送状态）`text-right` → `text-left`。
- `packages/ui/src/v4/ConversationShareReadonlyTimeline.tsx`（分享只读时间线的同款卡片）：`269` 容器 `items-end` → `items-start`，`273` 附件行 `max-w-xl ... justify-end` → `w-full ... justify-start`，`287` 气泡 `max-w-xl` → `w-full`，尾角同步。
- `packages/ui/src/v4/BotTopicPreparation.tsx:36`：群话题准备态行 `items-end` → `items-start`，避免复用的气泡左对齐后仍被父级推到右边。

### 2. 行内编辑框 → 同宽左对齐

- `ConversationRowView.tsx:1151` 编辑态行壳 `items-end` → `items-start`；`1272` `className="w-full max-w-xl"` → `"w-full"`。工具栏内部保持右侧发送/取消按钮不变。

### 3. 让"同宽"是精确相等，而不是差 8px

消息列内容区是 `px-4 @md/conversation:px-6`（`ConversationTurnGroup.tsx:1471`），composer dock 是 `px-4`（`ConversationTimeline.tsx:2172`）。只把卡片做成 `w-full` 时，容器 ≥448px 后卡片每侧仍比输入框窄 8px，用户大概率仍会觉得"没对齐"。

因此把 composer dock 的水平内边距改成与消息列一致：`px-4 pb-4` → `px-4 @md/conversation:px-6 pb-4`（`ConversationTimeline.tsx:2172`）。这样消息正文、用户卡片、composer 三者左右边界统一，只改一个类名，不动其他消息行。移动端（容器 <448px）仍是 16px，触屏余量不变。

### 4. 先更新 spec（AGENTS.md 要求）

- `docs/chat/user-message-attachment-layout.md`：`10`、`27`、`31`、`35`、`39`、`49` 行把"右对齐 / flex item 自动宽度 / `max-w-xl` 封顶 / 浮层 `align=end`"改写为"整行宽、左对齐、与 composer 同宽、浮层 `align=start`"；验收条件同步。
- `docs/bots-topic-input-materials.md:94`："整体右对齐" → "整体左对齐"。
- `docs/conversation-session-case-catalog.md:2191`（AL06）："保持右对齐" → "保持左对齐"。
- `docs/ui/chat-view-composition.md`：把"composer dock 始终使用 `px-4 pb-4`"这条更新为与消息列共用的 `px-4 @md/conversation:px-6`。

### 5. 测试

- `packages/desktop/test/e2e/conversation-session/conversation-session-v4-attachment-layout.test.ts`：
  - `81-82`：`rightEdgesAligned` → `leftEdgesAligned`；`bubbleWidth < rowWidth - 8` → `|bubbleWidth - rowWidth| <= 2`（现在是等宽）。
  - `434-439`：字段改为比较 `left`。
  - `460-470`（`assertContextHoverAlignment("sent")`）：sent 侧改为比较左边缘。
  - `482-500`（`assertNarrowSentWrap`）：`rightAligned` → `leftAligned`，期望值同步。
- 新增/补充单测（`packages/ui/test`，沿用现有 DOM/className 断言风格）：用户消息行不含 `items-end`、气泡含 `w-full` 且不含 `max-w-xl`、编辑态编辑器为 `w-full`、附件行/媒体行 `justify-start`。

### 6. 验证

`pnpm typecheck`、`pnpm lint`、`pnpm architecture:check --changed`、`packages/ui` 受影响单测（按该包 `package.json` 脚本执行）。桌面 E2E 需要打包 Electron，本机不一定能跑，会如实报告执行情况。

## 不做的部分

- 不改动草稿态 composer 的 `max-w-2xl` 居中、`-translate-x-42` 面板让位、以及 composer 自身宽度分档。
- 不改用户消息卡片的 border / bg-surface 视觉，只改宽度和对齐；如果改完觉得整宽带边框"太重"，后续可以再去掉边框单独调。
