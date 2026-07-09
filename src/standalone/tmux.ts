import { spawn } from "node:child_process";

function run(command: string, args: string[], input?: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["pipe", "ignore", "pipe"] });
    let stderr = "";
    child.stderr?.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.once("error", reject);
    child.once("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      const detail = stderr.trim();
      reject(new Error(`${command} ${args.join(" ")} exited with code ${code}${detail ? `: ${detail}` : ""}`));
    });

    if (input !== undefined) {
      child.stdin?.write(input);
    }
    child.stdin?.end();
  });
}

/**
 * Stage `text` into the given tmux pane without submitting it.
 *
 * Loads the text into tmux's paste buffer from stdin, then pastes it into the
 * target pane using bracketed paste (`-p`, so the receiving program treats it
 * as a single pasted input rather than typed keystrokes) and deletes the buffer
 * afterwards (`-d`). No Enter/newline is sent, so the prompt lands staged in the
 * Claude Code input, ready for the user to review and send.
 */
export async function stageIntoPane(target: string, text: string): Promise<void> {
  await run("tmux", ["load-buffer", "-"], text);
  await run("tmux", ["paste-buffer", "-p", "-d", "-t", target]);
}

/** Copy `text` to the macOS clipboard via `pbcopy`. */
export async function copyToClipboard(text: string): Promise<void> {
  await run("pbcopy", [], text);
}
