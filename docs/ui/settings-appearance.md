# Appearance Settings

## Goal

Provide one Appearance settings section for application theme, UI font size, and code presentation preferences across desktop, Web, and mobile Web.

## Settings

- App theme: System, Light, or Dark, using the existing theme preference and cross-window synchronization.
- UI font size (Chinese label: `界面字号`): a numeric input from 12px through 20px, default 14px. The preference drives the dedicated `text-ui-*` scale through `--ui-font-size` without changing the root `html` font size.
- UI font family (Chinese label: `界面字体`): a fixed select of built-in font stacks, default `System default`. The preference drives `--font-sans` only. The built-in list is deliberately not a system font enumeration: enumerating local fonts depends on the Chromium Font Access API, which is not consistently available on Desktop and unavailable on Web and mobile Web. Options that are not bundled with the operating system are labeled as requiring manual installation.
- Code presentation: light and dark syntax themes, line numbers, long-line wrapping, and an independent numeric code font-size input from 12px through 20px.
- Code settings and code preview are stacked vertically. Inside code preview, the light and dark preview cards use a side-by-side layout on `sm` screens and fall back to one card per row below that breakpoint.

## Boundaries

- UI font size and code font size are persisted independently.
- UI font family is persisted independently from the UI font size; both are stored under separate keys and applied through separate CSS variables (`--font-sans` and `--ui-font-size`).
- The UI font family applies to the whole application surface, including plugin UI surfaces that map the `--font-sans` token.
- Code and diff rendering continues to consume `codePreviewSettings.fontSizePx`; it does not inherit the root UI `rem` size.
- The integrated terminal retains its own font configuration and is not controlled by either Appearance font-size setting or by the UI font family.
- UI font-size changes are applied through `--ui-font-size`, persisted, and synchronized between application windows without mutating `document.documentElement.style.fontSize`.
- UI font-family changes are applied through `--font-sans`, persisted, and synchronized between application windows the same way.
- The former Code Preview navigation target is replaced by Appearance. A stored legacy `codePreview` target resolves to Appearance.

## Copy

- The interface subsection title is `界面设置` in Chinese and `Interface Setting` in English.
- Describe visible outcomes instead of implementation details such as `rem`, root font size, or UI scaling.
- Interface font-size copy states that icons and layout dimensions do not change with text size.
- Interface font copy states that code and terminal fonts are unaffected, and marks fonts that the user must install manually.
- Code preference copy covers code blocks, file previews, and diff views rather than only the preview cards on this settings page.
- The light and dark preview cards are displayed together below the controls; copy must not describe them as a single viewer on the right.

## Verification

- Verify Appearance is listed after General and the separate Code Preview navigation item is removed.
- Verify General retains language and system behavior settings but no longer duplicates app theme.
- Verify theme, UI font size, UI font family, and code presentation controls render together under Appearance.
- Verify both font sizes use numeric inputs rather than drag sliders, and commit on Enter or blur.
- Verify the UI font family select lists the built-in candidates, marks the fonts that require manual installation, and applies the selection without changing the UI font size.
- Verify Code settings stays above Code preview, while the light / dark preview cards sit side by side at `sm` layouts and render one card per row below that breakpoint.
- Verify UI font size persistence, clamping, and cross-window synchronization without root DOM font-size mutation.
- Verify UI font family persistence, fallback for unknown stored values, and cross-window synchronization.
- Run `pnpm typecheck`, `pnpm lint`, and relevant UI tests.
