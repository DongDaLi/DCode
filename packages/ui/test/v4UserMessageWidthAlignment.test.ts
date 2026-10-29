// @vitest-environment jsdom

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import type { UserInputRow } from "@zcode/shared/zcode-protocol-v4";
import { TooltipProvider } from "@/components/ui/tooltip.js";
import { DEFAULT_CODE_PREVIEW_SETTINGS } from "@/lib/codePreviewSettings.js";
import { ZCodeIntlProvider } from "@/i18n/IntlProvider.js";
import { ConversationRowView } from "@/v4/ConversationRowView.js";
import type { ConversationRowRenderContext } from "@/v4/conversationRowContext.js";

// docs/chat/user-message-attachment-layout.md：用户消息卡与下方 composer 同宽、同左边界。
// 过去气泡在右对齐的 flex item 里以 max-w-xl 封顶，视觉上像被推到右边且比输入框窄。
const context: ConversationRowRenderContext = {
  codePreviewSettings: DEFAULT_CODE_PREVIEW_SETTINGS,
  sessionId: "session-1",
  theme: "system",
  workspacePath: "/workspace",
};

function userInputRow(overrides: Partial<UserInputRow> = {}): UserInputRow {
  return {
    rowId: 11,
    entityId: "message-user-11",
    turnId: "turn-1",
    createdAt: 1_700_000_000_000,
    createdAtSeq: 1,
    kind: "userInput",
    origin: "realUser",
    text: "帮我看这个按钮",
    attachments: [
      {
        bytes: 12,
        fileName: "note.txt",
        mime: "text/plain",
        ref: "/workspace/note.txt",
      },
    ],
    ...overrides,
  };
}

function renderRow(row: UserInputRow): HTMLElement {
  document.body.innerHTML = renderToStaticMarkup(
    createElement(
      ZCodeIntlProvider,
      { initialLocale: "zh-CN" },
      createElement(
        TooltipProvider,
        null,
        createElement(ConversationRowView, { context, row }),
      ),
    ),
  );
  return document.body;
}

function requireElement(container: HTMLElement, selector: string): HTMLElement {
  const element = container.querySelector<HTMLElement>(selector);
  expect(element).not.toBeNull();
  return element!;
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("ConversationRowView user message width", () => {
  it("renders the sent bubble at full row width instead of capping it at max-w-xl", () => {
    const body = renderRow(userInputRow());
    const bubble = requireElement(body, '[data-v4-user-input-bubble="true"]');
    expect(bubble.className).toContain("w-full");
    expect(bubble.className).not.toContain("max-w-xl");
    expect(bubble.className).not.toContain("@min-[624px]");
  });

  it("left-aligns the user row, attachment area and pill row", () => {
    const body = renderRow(userInputRow());

    const row = requireElement(body, '[data-row-id="11"]');
    expect(row.className).toContain("items-start");
    expect(row.className).not.toContain("items-end");

    const attachmentArea = requireElement(body, '[data-v4-user-input-attachments="true"]');
    expect(attachmentArea.className).toContain("w-full");
    expect(attachmentArea.className).toContain("items-start");
    expect(attachmentArea.className).not.toContain("max-w-xl");

    const pillRow = requireElement(body, '[data-v4-user-input-attachment-pills="true"]');
    expect(pillRow.className).toContain("justify-start");
    expect(pillRow.className).not.toContain("justify-end");
  });

  it("shares the left boundary between the attachment area and the bubble", () => {
    const body = renderRow(userInputRow());
    const attachmentArea = requireElement(body, '[data-v4-user-input-attachments="true"]');
    const bubble = requireElement(body, '[data-v4-user-input-bubble="true"]');
    expect(attachmentArea.className).toContain("w-full");
    expect(bubble.className).toContain("w-full");
  });
});
