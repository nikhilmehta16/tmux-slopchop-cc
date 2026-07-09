/**
 * Concrete Theme implementation for the standalone build.
 *
 * Pi supplies a Theme object to extensions; here we build one ourselves using
 * ANSI truecolor escapes and a catppuccin-macchiato palette. Foreground spans
 * reset with `\x1b[39m` (default foreground) and background spans reset with
 * `\x1b[49m` (default background) rather than a full `\x1b[0m` reset so that
 * nested fg/bg spans compose correctly (e.g. a diff background wrapped around
 * text that already contains syntax foreground colors).
 */

export type ThemeColor =
  // foreground keys
  | "accent"
  | "border"
  | "borderMuted"
  | "dim"
  | "error"
  | "muted"
  | "success"
  | "warning"
  | "text"
  | "toolDiffContext"
  | "syntaxNumber"
  | "syntaxPunctuation"
  | "syntaxString"
  | "syntaxVariable"
  | "mdCode"
  | "mdCodeBlockBorder"
  | "mdHeading"
  | "mdHr"
  | "mdLink"
  | "mdLinkUrl"
  | "mdListBullet"
  | "mdQuoteBorder"
  // background keys
  | "selectedBg"
  | "toolSuccessBg"
  | "toolErrorBg"
  | "toolPendingBg";

export interface Theme {
  fg(color: ThemeColor, text: string): string;
  bg(color: ThemeColor, text: string): string;
}

type Rgb = readonly [number, number, number];

// catppuccin-macchiato base palette.
const PALETTE = {
  rosewater: [244, 219, 214],
  flamingo: [240, 198, 198],
  pink: [245, 189, 230],
  mauve: [198, 160, 246],
  red: [237, 135, 150],
  maroon: [238, 153, 160],
  peach: [245, 169, 127],
  yellow: [238, 212, 159],
  green: [166, 218, 149],
  teal: [139, 213, 202],
  sky: [145, 215, 227],
  sapphire: [125, 196, 228],
  blue: [138, 173, 244],
  lavender: [183, 189, 248],
  text: [202, 211, 245],
  subtext1: [184, 192, 224],
  subtext0: [165, 173, 203],
  overlay2: [147, 154, 183],
  overlay1: [128, 135, 162],
  overlay0: [110, 115, 141],
  surface2: [91, 96, 120],
  surface1: [73, 77, 100],
  surface0: [54, 58, 79],
  base: [36, 39, 58],
  mantle: [30, 32, 48],
  crust: [24, 25, 38],
} as const satisfies Record<string, Rgb>;

const FG_COLORS: Record<Exclude<ThemeColor, "selectedBg" | "toolSuccessBg" | "toolErrorBg" | "toolPendingBg">, Rgb> = {
  accent: PALETTE.mauve,
  border: PALETTE.surface2,
  borderMuted: PALETTE.surface1,
  dim: PALETTE.overlay0,
  error: PALETTE.red,
  muted: PALETTE.subtext0,
  success: PALETTE.green,
  warning: PALETTE.yellow,
  text: PALETTE.text,
  toolDiffContext: PALETTE.subtext0,
  syntaxNumber: PALETTE.peach,
  syntaxPunctuation: PALETTE.overlay2,
  syntaxString: PALETTE.green,
  syntaxVariable: PALETTE.lavender,
  mdCode: PALETTE.peach,
  mdCodeBlockBorder: PALETTE.surface2,
  mdHeading: PALETTE.mauve,
  mdHr: PALETTE.surface2,
  mdLink: PALETTE.blue,
  mdLinkUrl: PALETTE.sky,
  mdListBullet: PALETTE.mauve,
  mdQuoteBorder: PALETTE.overlay0,
};

// Background tints: diff add/del use dark green/red blends readable under the
// default text foreground; selection/pending reuse surface tones.
const BG_COLORS: Record<"selectedBg" | "toolSuccessBg" | "toolErrorBg" | "toolPendingBg", Rgb> = {
  selectedBg: PALETTE.surface1,
  toolSuccessBg: [45, 74, 52],
  toolErrorBg: [74, 45, 52],
  toolPendingBg: PALETTE.surface0,
};

function fgEscape([r, g, b]: Rgb, text: string): string {
  return `\x1b[38;2;${r};${g};${b}m${text}\x1b[39m`;
}

function bgEscape([r, g, b]: Rgb, text: string): string {
  return `\x1b[48;2;${r};${g};${b}m${text}\x1b[49m`;
}

export const theme: Theme = {
  fg(color: ThemeColor, text: string): string {
    const rgb = (FG_COLORS as Record<string, Rgb>)[color] ?? (BG_COLORS as Record<string, Rgb>)[color] ?? PALETTE.text;
    return fgEscape(rgb, text);
  },
  bg(color: ThemeColor, text: string): string {
    const rgb = (BG_COLORS as Record<string, Rgb>)[color] ?? (FG_COLORS as Record<string, Rgb>)[color] ?? PALETTE.surface0;
    return bgEscape(rgb, text);
  },
};
