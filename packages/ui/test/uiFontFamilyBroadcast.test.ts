// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { IBroadcastService } from "@zcode/services";
import { createZCodeStore } from "@/store/index.js";
import { UI_FONT_FAMILY_STORAGE_KEY } from "@/lib/uiFontFamily.js";

function createBroadcastFixture() {
  let receive: Parameters<IBroadcastService["onMessage"]>[0] | undefined;
  const send = vi.fn(async () => {});
  const service: IBroadcastService = {
    send,
    acquireClaim: async () => ({ status: "unavailable" }),
    commitClaim: async () => {},
    releaseClaim: async () => {},
    tryClaim: async () => false,
    onMessage: (listener) => {
      receive = listener;
      return { dispose: () => {} };
    },
  };
  return { send, service, receive: () => receive };
}

describe("界面字体族跨窗口同步", () => {
  beforeEach(() => localStorage.clear());

  it("切换字体广播 state:uiFontFamilyId，其他窗口按广播应用且不回播", () => {
    const { send, service, receive } = createBroadcastFixture();
    const store = createZCodeStore(service);
    expect(store.getState().uiFontFamilyId).toBe("system");

    // 窗口 A 切换字体：本地生效并广播
    store.getState().setUiFontFamilyId("inter");
    expect(store.getState().uiFontFamilyId).toBe("inter");
    expect(send).toHaveBeenCalledWith({ channel: "state:uiFontFamilyId", payload: "inter" });
    expect(localStorage.getItem(UI_FONT_FAMILY_STORAGE_KEY)).toBe("inter");
    send.mockClear();

    // 模拟窗口 B 收到广播：应用字体（含 localStorage 持久化），不回播
    receive()?.({ channel: "state:uiFontFamilyId", payload: "lxgw-wenkai" });
    expect(store.getState().uiFontFamilyId).toBe("lxgw-wenkai");
    expect(localStorage.getItem(UI_FONT_FAMILY_STORAGE_KEY)).toBe("lxgw-wenkai");
    expect(send).not.toHaveBeenCalled();

    // 未知字体标识与非法 payload 都回落到系统默认
    receive()?.({ channel: "state:uiFontFamilyId", payload: "not-a-font" });
    expect(store.getState().uiFontFamilyId).toBe("system");
    receive()?.({ channel: "state:uiFontFamilyId", payload: 123 });
    expect(store.getState().uiFontFamilyId).toBe("system");
  });

  it("新窗口启动从 localStorage 读最新字体（跨窗口共享持久层）", () => {
    localStorage.setItem(UI_FONT_FAMILY_STORAGE_KEY, "noto-sans-sc");
    const { service } = createBroadcastFixture();
    const store = createZCodeStore(service);
    expect(store.getState().uiFontFamilyId).toBe("noto-sans-sc");
  });
});
