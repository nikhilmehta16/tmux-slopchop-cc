import { execFile } from "node:child_process";

export interface PiExecResult {
  code: number;
  stdout: string;
  stderr: string;
}

/**
 * The subset of the Pi `ExtensionAPI` that the ported git layer relies on.
 * `git.ts` only ever calls `pi.exec(...)`, so this is the whole surface.
 */
export interface PiExec {
  exec(command: string, args: string[], opts: { cwd: string }): Promise<PiExecResult>;
}

// git show / git diff of large blobs can produce megabytes of output; give the
// child process plenty of room before Node truncates and errors.
const MAX_OUTPUT_BYTES = 256 * 1024 * 1024;

/**
 * Build a standalone replacement for Pi's `ExtensionAPI.exec` using node's
 * `child_process`. Never throws on a non-zero exit code: resolves with the exit
 * code plus captured stdout/stderr so callers can branch on `result.code`.
 */
export function createPiExec(): PiExec {
  return {
    exec(command: string, args: string[], opts: { cwd: string }): Promise<PiExecResult> {
      return new Promise<PiExecResult>((resolve) => {
        execFile(
          command,
          args,
          { cwd: opts.cwd, encoding: "utf8", maxBuffer: MAX_OUTPUT_BYTES },
          (error, stdout, stderr) => {
            let code = 0;
            if (error != null) {
              const rawCode = (error as { code?: unknown }).code;
              code = typeof rawCode === "number" ? rawCode : 1;
            }
            resolve({
              code,
              stdout: stdout ?? "",
              stderr: stderr ?? "",
            });
          },
        );
      });
    },
  };
}
