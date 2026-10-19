# Changelog

## 0.6.0 — Publish-ready

- Bilingual launcher UI (English / 中文 depending on VS Code language).
- Companion `dsh-plugin-deep-link` client plugin — auto-installed for stock
  `@deepseek-ai/dsh` so the GUI lands on the pinned conversation without an
  extra click.
- Publish metadata: repository, icon, keywords; `private: true` removed.
- Full bilingual README with usage guide, settings table, and publish
  instructions.

## 0.5.1

- Both launcher containers are declared unconditionally: the activity-bar icon
  is always present, and the secondary (right) side bar container is added on
  builds that implement `viewsContainers.secondarySidebar` (VS Code ≥ 1.94,
  verified against the 1.137 workbench). The earlier version/context-key gating
  could hide both containers at once — removed.
- `DSH: Open Panel` now falls back through both containers and finally opens a
  conversation panel, so the extension stays reachable on any build.

## 0.5.0

- Launcher now lives in the **secondary (right) side bar** on VS Code builds that
  support `viewsContainers.secondarySidebar`; the activity-bar container remains
  for older builds, gated by the `dshHarness.doesNotSupportSecondarySidebar`
  context key — the same pattern Claude Code and Codex use.

## 0.4.1

- Official DeepSeek Harness whale mark replaces the placeholder icon.
- Editor-title button (top-right of the editor) and a status-bar entry open DSH.
- View-title refresh button on the launcher.
- Cross-machine launch: an empty `dshHarness.repoPath` falls back to the
  `dshHarness.command` executable (default `dsh` from PATH).
- Deep-link support is detected at runtime; a stock dsh server degrades to
  opening the GUI without session targeting.

## 0.4.0

- Editor-title and status-bar entry points; configurable launch command.

## 0.3.0

- Left launcher with the folder's conversation list; conversations open in a
  panel beside the editor via the `#session=<id>` deep link.

## 0.2.0

- Activity-bar view, workspace alignment, and theme sync with VS Code.

## 0.1.0

- `DSH: Open Panel` opens the GUI in an editor panel, auto-starting `dsh web`.