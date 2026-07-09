# slopchop-cc — design

A fork of `pi-slopchop@0.10.1` that runs standalone (no Pi) and stages review
annotations into a **Claude Code** pane via tmux, instead of into Pi's editor.

## Goal
Reproduce slopchop's diff-review UX for Claude Code users: navigate a diff, add
FIX/DISCUSS line annotations, and on submit paste the built prompt into the Claude
Code pane (staged, not auto-sent). Overlay via a tmux popup.

## What we keep vs replace

| Kept unchanged (reused as-is) | Replaced / added |
|---|---|
| `diff.ts`, `prompt.ts`, `shortcuts.ts`, `search.ts`, `state.ts`, `types.ts`, `theme-highlight.ts` | `index.ts` (Pi extension entry) → `bin.ts` standalone CLI |
| `git.ts` logic | `pi.exec` → `standalone/pi-shim.ts` (node `child_process`) |
| `ui/review-app.ts` `ReviewApp` class + rendering | its `runReviewApp(ctx)` → add `runReviewAppStandalone()` that builds the TUI itself |
| pi-tui (`TUI`, `ProcessTerminal`, `Editor`) — standalone lib | `pi-render.ts` Pi highlight import → local `getLanguageFromPath` + passthrough `highlightCode` |
| — | `standalone/theme.ts` (concrete Theme, catppuccin-macchiato) |
| — | `standalone/tmux.ts` (paste-buffer bridge + clipboard fallback) |

## The 4 Pi coupling points (from `index.ts`) and their replacements
1. `ctx.cwd` → `process.cwd()`
2. `ctx.ui.notify(msg, level)` → write to `stderr`
3. `runReviewApp(ctx, opts)` → `runReviewAppStandalone(opts)`:
   `new TUI(new ProcessTerminal())`, build `theme`, `new ReviewApp(tui, theme, done, {...opts, notify})`,
   `tui.start()`, resolve on `done`, then `tui.stop()` + `app.dispose()`.
4. `ctx.ui.setEditorText(prompt)` → `tmux.ts` stage into the target pane.

`git.ts` `pi.exec(cmd, args, {cwd})` returns `{ code, stdout, stderr }` — shim with `spawn`.

## Type decoupling
- `review-app.ts` derives `Theme` from `ExtensionContext["ui"]["custom"]` and types `notify` as
  `ExtensionContext["ui"]["notify"]`. Replace both with concrete local types:
  - `interface Theme { fg(c: ThemeColor, t: string): string; bg(c: ThemeColor, t: string): string }`
  - `type Notify = (message: string, level: "info" | "warning" | "error") => void`
- `ThemeColor` = the union of all keys used: fg — accent, border, borderMuted, dim, error, muted,
  success, warning, text, toolDiffContext, syntaxNumber, syntaxPunctuation, syntaxString,
  syntaxVariable, mdCode, mdCodeBlockBorder, mdHeading, mdHr, mdLink, mdLinkUrl, mdListBullet,
  mdQuoteBorder; bg — selectedBg, toolSuccessBg, toolErrorBg, toolPendingBg.

## tmux bridge (staged, no auto-send)
- `tmux load-buffer -` (prompt on stdin) then `tmux paste-buffer -p -d -t <target>`.
  `-p` = bracketed paste (one input, no submit); `-d` = delete buffer after.
- `<target>` = the pane id passed by the popup binding (`#{pane_id}` of the Claude pane).
- Fallback `--clipboard`: `pbcopy` only, no tmux.

## Launch / overlay
- Claude Code runs in a tmux pane.
- `~/.tmux.conf`: `bind r display-popup -w 90% -h 90% -E "slopchop-cc --target #{pane_id}"`
- `prefix + r` → popup opens over Claude → annotate → `s` submit → popup closes → prompt staged in Claude.

## Project
- Node/TS, ESM. Deps: `@earendil-works/pi-tui`, `@pierre/diffs`. Dev: `typescript`, `@types/node`.
- `tsc` build → `dist/`. `bin` = `slopchop-cc` → `dist/bin.js`. Install via `npm link`.
- MIT (inherits from pi-slopchop; attribution to robzolkos retained in LICENSE/README).

## v1 scope
- ✅ FIX/DISCUSS line + file + all annotations, 3 scopes, templates, staged paste, clipboard fallback, tmux popup.
- ❌ Non-goals: auto-apply edits, live per-hunk AI-explanation pane, syntax token highlighting
  (diff add/del backgrounds kept; token colors deferred), config UI, multi-agent targeting.

## Risks
- pi-tui `TUI` mount details (input wiring, render loop) — verify by running.
- Losing token syntax highlighting may look plainer than Pi; acceptable for v1.
