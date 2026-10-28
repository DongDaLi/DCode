import { afterEach, describe, expect, it, vi } from "vitest";
import {
  applyUiFontFamilyId,
  DEFAULT_UI_FONT_FAMILY_ID,
  getUiFontFamilyOption,
  loadUiFontFamilyId,
  normalizeUiFontFamilyId,
  subscribeToUiFontFamilyStorageChanges,
  UI_FONT_FAMILY_OPTIONS,
  UI_FONT_FAMILY_STORAGE_KEY,
} from "../src/lib/uiFontFamily.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("uiFontFamily", () => {
  it("缺少持久化值时使用系统默认", () => {
    vi.stubGlobal("localStorage", { getItem: () => null });
    expect(loadUiFontFamilyId()).toBe(DEFAULT_UI_FONT_FAMILY_ID);
  });

  it("未知字体标识回落到系统默认", () => {
    expect(normalizeUiFontFamilyId("not-installed-font")).toBe(DEFAULT_UI_FONT_FAMILY_ID);
    expect(normalizeUiFontFamilyId(undefined)).toBe(DEFAULT_UI_FONT_FAMILY_ID);
    expect(normalizeUiFontFamilyId("inter")).toBe("inter");
  });

  it("每个候选字体的字体栈都带 CJK 兜底", () => {
    for (const option of UI_FONT_FAMILY_OPTIONS) {
      expect(option.cssStack).toMatch(/PingFang SC|Microsoft YaHei|Noto Sans CJK SC/);
      expect(option.cssStack.endsWith("sans-serif")).toBe(true);
    }
  });

  it("通过 UI 自定义属性应用字体族，不修改根 DOM 字号", () => {
    const properties = new Map<string, string>();
    const style = {
      fontSize: "",
      setProperty: (name: string, value: string) => properties.set(name, value),
    };
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => (key === UI_FONT_FAMILY_STORAGE_KEY ? "inter" : null),
    });
    vi.stubGlobal("document", { documentElement: { style } });

    const fontFamilyId = loadUiFontFamilyId();
    applyUiFontFamilyId(fontFamilyId);

    expect(fontFamilyId).toBe("inter");
    expect(style.fontSize).toBe("");
    expect(properties.get("--font-sans")).toBe(getUiFontFamilyOption("inter").cssStack);
  });

  it("监听其他窗口的字体存储变化并支持清理订阅", () => {
    const properties = new Map<string, string>();
    const listeners = new Map<string, EventListener>();
    const windowStub = {
      addEventListener: vi.fn((type: string, listener: EventListener) => {
        listeners.set(type, listener);
      }),
      removeEventListener: vi.fn((type: string, listener: EventListener) => {
        if (listeners.get(type) === listener) listeners.delete(type);
      }),
    };
    vi.stubGlobal("window", windowStub);
    vi.stubGlobal("document", {
      documentElement: {
        style: {
          setProperty: (name: string, value: string) => properties.set(name, value),
        },
      },
    });

    const dispose = subscribeToUiFontFamilyStorageChanges();
    listeners.get("storage")?.({
      key: UI_FONT_FAMILY_STORAGE_KEY,
      newValue: "lxgw-wenkai",
    } as StorageEvent);

    expect(properties.get("--font-sans")).toBe(getUiFontFamilyOption("lxgw-wenkai").cssStack);

    dispose();
    expect(windowStub.removeEventListener).toHaveBeenCalledOnce();
    expect(listeners.has("storage")).toBe(false);
  });
});
