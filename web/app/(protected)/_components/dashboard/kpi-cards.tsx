import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle, BarChart3, Layers, SignalHigh } from "lucide-react";
import type { ReactNode } from "react";

import type { LogsSummaryPayload } from "@/lib/logs/summary-types";
import { logsHrefForDashboardPeriod } from "@/lib/logs/logs-link-dashboard";

type CardProps = {
  title: string;
  icon: LucideIcon;
  value: ReactNode;
  hint?: string;
  logsHref?: string;
};

function KpiInner(props: CardProps) {
  const Icon = props.icon;

  const body = (
    <article className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-950">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-slate-800 dark:text-zinc-200">
          <Icon size={22} aria-hidden strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <div className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            {props.title}
          </div>
          <div className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-zinc-950 dark:text-zinc-50">
            {props.value}
          </div>
          {props.hint ? (
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{props.hint}</p>
          ) : null}
        </div>
      </div>
    </article>
  );

  if (props.logsHref) {
    return (
      <Link
        href={props.logsHref}
        className="block outline-none transition hover:opacity-95 focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:focus-visible:ring-zinc-500 dark:focus-visible:ring-offset-slate-900"
      >
        {body}
      </Link>
    );
  }

  return body;
}

type Props = {
  summary: LogsSummaryPayload;
  severeTotal: number;
};

export function DashboardKpiCards(props: Props) {
  const period = props.summary.period;
  const logsHref = logsHrefForDashboardPeriod(period.from, period.to);
  const topChannel = props.summary.by_channel[0];

  const exRate =
    props.summary.total > 0
      ? ((props.summary.with_exception_count / props.summary.total) * 100).toFixed(1)
      : "0";

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiInner
        title="Registros no período"
        icon={Layers}
        value={props.summary.total.toLocaleString("pt-BR")}
        logsHref={logsHref}
        hint={`${period.from} — ${period.to}`}
      />
      <KpiInner
        title="Com exceção"
        icon={AlertTriangle}
        value={props.summary.with_exception_count.toLocaleString("pt-BR")}
        logsHref={logsHref}
        hint={`${exRate}% do total`}
      />
      <KpiInner title="Alertas graves" icon={BarChart3} value={props.severeTotal.toLocaleString("pt-BR")} logsHref={logsHref} hint="Erro, Crítico, Alerta ou emergência" />
      <KpiInner
        title="Canal em destaque"
        icon={SignalHigh}
        value={topChannel?.key ?? "—"}
        logsHref={logsHref}
        hint={topChannel ? `${topChannel.count.toLocaleString("pt-BR")} registros` : undefined}
      />
    </div>
  );
}
