import type { LogLevel } from "./types";

import { isKnownLogLevelKey, resolveLogLevelLabelPt } from "./log-level-labels";

const LEVEL_STYLES: Record<LogLevel, string> = {
  debug:
    "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/35 dark:bg-emerald-950/55 dark:text-emerald-100",
  info: "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-500/35 dark:bg-sky-950/55 dark:text-sky-100",
  notice:
    "border-cyan-200 bg-cyan-50 text-cyan-900 dark:border-cyan-500/35 dark:bg-cyan-950/55 dark:text-cyan-100",
  warning:
    "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/35 dark:bg-amber-950/55 dark:text-amber-100",
  error: "border-red-200 bg-red-50 text-red-900 dark:border-red-500/35 dark:bg-red-950/55 dark:text-red-100",
  critical:
    "border-rose-300 bg-rose-100 text-rose-950 dark:border-rose-500/45 dark:bg-rose-950/65 dark:text-rose-50",
  alert:
    "border-orange-300 bg-orange-100 text-orange-950 dark:border-orange-500/45 dark:bg-orange-950/65 dark:text-orange-50",
  emergency:
    "border-red-400 bg-red-200 text-red-950 dark:border-red-500/55 dark:bg-red-950/80 dark:text-red-50",
};

const FALLBACK_STYLES =
  "border-zinc-200 bg-zinc-100 text-zinc-800 dark:border-white/15 dark:bg-zinc-800/80 dark:text-zinc-100";

const KNOWN: Set<string> = new Set(Object.keys(LEVEL_STYLES));

function stylesForLevel(level: string): string {
  if (KNOWN.has(level)) {
    return LEVEL_STYLES[level as LogLevel];
  }
  return FALLBACK_STYLES;
}

export function LogLevelBadge(props: { level: string | null | undefined }) {
  if (props.level == null || props.level === "") {
    return <span className="text-zinc-500 dark:text-zinc-400">—</span>;
  }

  const label = props.level.trim();
  if (label === "") {
    return <span className="text-zinc-500 dark:text-zinc-400">—</span>;
  }

  const styleKey = label.toLowerCase();
  const displayLabel = resolveLogLevelLabelPt(styleKey, label);

  const tooltip = isKnownLogLevelKey(styleKey)
    ? `Valor técnico (original): ${styleKey}`
    : undefined;

  return (
    <span
      title={tooltip}
      aria-label={
        isKnownLogLevelKey(styleKey)
          ? `Nível ${displayLabel}; valor técnico: ${styleKey}`
          : `Nível ${displayLabel}`
      }
      className={[
        "inline-flex max-w-full items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        stylesForLevel(styleKey),
      ].join(" ")}
    >
      <span className="truncate">{displayLabel}</span>
    </span>
  );
}
