# slopchop-cc

A standalone terminal diff-review UI for **Claude Code**, forked from
[`pi-slopchop`](https://github.com/robzolkos/pi-slopchop) (MIT, by Rob Zolkos).

Navigate a git diff, annotate lines with **FIX** / **DISCUSS**, and on submit the
built prompt is **staged into your Claude Code pane** via tmux (pasted, not sent —
you press Enter when ready). No Pi agent required.

## Install
```bash
npm install
npm run build
npm link          # puts `slopchop-cc` on PATH
```

## tmux setup
Run Claude Code inside tmux. Add to `~/.tmux.conf`:
```tmux
bind r display-popup -w 90% -h 90% -E "slopchop-cc --target #{pane_id}"
```
Then: `prefix + r` opens the review overlay over the current pane. Annotate, press
`s` to submit, and the prompt is staged into that pane.

## CLI
```
slopchop-cc --target <tmux-pane-id>   # stage prompt into that pane (bracketed paste, no Enter)
slopchop-cc --clipboard               # copy prompt to clipboard instead
slopchop-cc                           # print prompt to stdout
```

## Keys (in the review UI)
`1/2/3` scope · `Tab` focus · `j/k` move · `n/p` hunk · `f` FIX · `d`/`c` DISCUSS ·
`l` file · `a` all · `t` templates · `s` submit · `Esc` exit.

## Attribution
Fork of `pi-slopchop` by Rob Zolkos. The backend was changed from Pi's editor to a
tmux paste bridge; the TUI, diff, annotation, and prompt engine are reused. MIT.
