#!/usr/bin/env node
import { getReviewWindowData, getSubmoduleReviewWindowData, loadReviewFileContents } from "./git.js";
import { composeReviewPrompt } from "./prompt.js";
import { loadCommentShortcuts } from "./shortcuts.js";
import { hasExactSubmoduleRange } from "./types.js";
import { createPiExec } from "./standalone/pi-shim.js";
import { copyToClipboard, stageIntoPane } from "./standalone/tmux.js";
import { runReviewAppStandalone } from "./ui/review-app.js";

interface CliOptions {
  target?: string;
  clipboard: boolean;
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = { clipboard: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--target") {
      index += 1;
      options.target = argv[index];
    } else if (arg.startsWith("--target=")) {
      options.target = arg.slice("--target=".length);
    } else if (arg === "--clipboard") {
      options.clipboard = true;
    }
  }
  return options;
}

// Human-facing status goes to stderr so it never contaminates the composed
// prompt written to stdout in the no-target/no-clipboard fallback.
function logStatus(message: string): void {
  process.stderr.write(`${message}\n`);
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const pi = createPiExec();
  const cwd = process.cwd();

  const { repoRoot, files } = await getReviewWindowData(pi, cwd);
  const shortcutConfig = loadCommentShortcuts();

  if (files.length === 0) {
    logStatus("No reviewable files found for git diff, last commit, or all files.");
    process.exit(0);
  }

  for (const warning of shortcutConfig.warnings) {
    logStatus(`slopchop config: ${warning}`);
  }

  const { result, files: submittedFiles } = await runReviewAppStandalone({
    files,
    repoRoot,
    loadFileContents: (activeRepoRoot, file, scope) => loadReviewFileContents(pi, activeRepoRoot, file, scope),
    loadSubmoduleReviewData: (submodule) => {
      if (hasExactSubmoduleRange(submodule)) {
        return getSubmoduleReviewWindowData(pi, submodule.repoRoot, submodule.oldSha, submodule.newSha);
      }
      return getReviewWindowData(pi, submodule.repoRoot);
    },
    commentShortcuts: shortcutConfig.shortcuts,
    notify: (message, level) => logStatus(`[${level}] ${message}`),
  });

  if (result.type === "cancel") {
    // Cancelled review: exit quietly with success, staging nothing.
    process.exit(0);
  }

  const prompt = composeReviewPrompt(submittedFiles, result);

  if (options.clipboard) {
    await copyToClipboard(prompt);
    logStatus("Copied review feedback to clipboard.");
  } else if (options.target != null) {
    await stageIntoPane(options.target, prompt);
    logStatus(`Staged review feedback into pane ${options.target}.`);
  } else {
    process.stdout.write(prompt);
    if (!prompt.endsWith("\n")) process.stdout.write("\n");
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`slopchop-cc: ${message}\n`);
  process.exit(1);
});
