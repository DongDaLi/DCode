/**
 * 界面字体（字体族）偏好。
 *
 * 与 `uiFontSize.ts` 同构：只覆盖 `--font-sans` 这一个 CSS 变量，不改 `html` 的根字号，
 * 因此界面字号、图标尺寸、间距与圆角都不会被字体切换影响。
 *
 * 字体候选是内置列表而不是系统字体枚举：
 * - 枚举本机字体依赖 Chromium Font Access API，桌面端可用性依赖 Electron 版本与权限，
 *   Web / 手机 Web 拿不到同一份列表，跨端行为无法保持一致；
 * - 内置列表让三端表现一致，代价是候选字体未安装时浏览器静默回退到栈内下一个字体。
 */
import { readSafeLocalStorage } from "@/lib/browserEnvironment.js";

export const DEFAULT_UI_FONT_FAMILY_ID = "system";
export const UI_FONT_FAMILY_STORAGE_KEY = "zcode-ui-font-family";

/**
 * 字体栈构造规则：主字体 → 平台西文回退 → 平台中文回退 → 通用 sans-serif。
 * 顺序与 `styles.css` 里的 `--font-mono` 保持一致：Windows 的西文字体不含中文字形，
 * 缺字时必须落到显式声明的 CJK 字体，而不是浏览器默认的宋体。
 */
const SYSTEM_UI_FONT_FAMILY_OPTION = {
  id: "system",
  label: "system",
  cssStack:
    'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif',
};

/**
 * 内置候选列表。字段含义：
 * - `id`：稳定标识，持久化只保存它，未知值一律回落到系统默认；
 * - `label`：展示名，字体名是专有名词，除“系统默认”外不做翻译；
 * - `requiresInstall`：是否需要用户自行安装，未随系统分发的字体在多数机器上不存在；
 * - `cssStack`：写入 `--font-sans` 的字体栈。
 */
export const UI_FONT_FAMILY_OPTIONS: readonly {
  id: string;
  label: string;
  requiresInstall?: boolean;
  cssStack: string;
}[] = [
  SYSTEM_UI_FONT_FAMILY_OPTION,
  {
    id: "inter",
    label: "Inter",
    cssStack:
      'Inter, "Segoe UI", system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif',
  },
  {
    id: "noto-sans-sc",
    label: "Noto Sans SC",
    requiresInstall: true,
    cssStack:
      '"Noto Sans SC", "Noto Sans CJK SC", "Source Han Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
  },
  {
    id: "harmonyos-sans",
    label: "HarmonyOS Sans",
    requiresInstall: true,
    cssStack:
      '"HarmonyOS Sans SC", "HarmonyOS Sans", "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif',
  },
  {
    id: "lxgw-wenkai",
    label: "LXGW WenKai",
    requiresInstall: true,
    cssStack:
      '"LXGW WenKai Screen", "LXGW WenKai", "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif',
  },
  {
    id: "pingfang-sc",
    label: "PingFang SC",
    cssStack:
      '"PingFang SC", "HarmonyOS Sans SC", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif',
  },
];

function isUiFontFamilyId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    UI_FONT_FAMILY_OPTIONS.some((option) => option.id === value)
  );
}

/** 未知或缺失的持久化值统一回落到系统默认，保证设置项不会指向不存在的字体。 */
export function normalizeUiFontFamilyId(value: unknown): string {
  return isUiFontFamilyId(value) ? value : DEFAULT_UI_FONT_FAMILY_ID;
}

export function getUiFontFamilyOption(id: unknown): (typeof UI_FONT_FAMILY_OPTIONS)[number] {
  const normalizedId = normalizeUiFontFamilyId(id);
  return (
    UI_FONT_FAMILY_OPTIONS.find((option) => option.id === normalizedId) ??
    SYSTEM_UI_FONT_FAMILY_OPTION
  );
}

export function loadUiFontFamilyId(): string {
  return normalizeUiFontFamilyId(readSafeLocalStorage(UI_FONT_FAMILY_STORAGE_KEY));
}

export function applyUiFontFamilyId(fontFamilyId: string): void {
  const rootStyle = typeof document === "undefined" ? undefined : document.documentElement?.style;
  if (!rootStyle?.setProperty) {
    return;
  }
  // 只覆盖字体族变量：`--ui-font-size` 与界面字号体系保持独立，两者互不影响。
  rootStyle.setProperty("--font-sans", getUiFontFamilyOption(fontFamilyId).cssStack);
}

export function subscribeToUiFontFamilyStorageChanges(): () => void {
  const handleStorage = (event: StorageEvent) => {
    if (event.key !== UI_FONT_FAMILY_STORAGE_KEY) {
      return;
    }

    applyUiFontFamilyId(normalizeUiFontFamilyId(event.newValue));
  };

  window.addEventListener("storage", handleStorage);
  return () => window.removeEventListener("storage", handleStorage);
}
