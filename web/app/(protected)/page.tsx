import Link from "next/link";
import { ClipboardList } from "lucide-react";

import { DashboardChartsClient } from "@/app/(protected)/_components/dashboard/dashboard-charts-client";
import { DashboardKpiCards } from "@/app/(protected)/_components/dashboard/kpi-cards";
import { DashboardPeriodPicker } from "@/app/(protected)/_components/dashboard/period-picker";
import { fetchLogsSummaryServer } from "@/app/(protected)/_server/fetch-logs-summary";
import { AUTH_SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { clampDashboardDays } from "@/lib/logs/dashboard-days";
import { summarizeSevereTotal } from "@/lib/logs/summary-metrics";

type Props = {
  searchParams?: Promise<{ days?: string }>;
};

export default async function Home(props: Props) {
  const sp = await (props.searchParams ?? Promise.resolve({}));
  const days = clampDashboardDays(sp.days ?? undefined);

  const query = new URLSearchParams({ histogram_days: String(days) });
  const summary = await fetchLogsSummaryServer(query.toString());

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto bg-zinc-50 px-6 py-6 dark:bg-slate-900">
      <div className="mx-auto w-full max-w-6xl space-y-6 pb-10">
        <header className="flex flex-col gap-4 border-b border-zinc-200 pb-6 dark:border-white/10 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">Dashboard</h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Visão consolidada gerada na API via agregações do OpenSearch (dados obtidos no servidor).
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <DashboardPeriodPicker activeDays={days} />
            <Link
              href="/logs"
              prefetch={false}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-900 shadow-sm transition hover:bg-zinc-50 dark:border-white/15 dark:bg-slate-900 dark:text-zinc-50 dark:hover:bg-slate-800"
            >
              <ClipboardList size={18} aria-hidden strokeWidth={1.75} />
              Listagem completa
            </Link>
          </div>
        </header>

        {summary == null ? (
          <section
            className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-100"
            role="status"
          >
            Não foi possível carregar o resumo. Confirme sessão (<span className="font-mono">{AUTH_SESSION_COOKIE_NAME}</span>
            ), variável <span className="font-mono">API_URL</span> e disponibilidade do OpenSearch.
          </section>
        ) : (
          <>
            <DashboardKpiCards summary={summary} severeTotal={summarizeSevereTotal(summary)} />
            <DashboardChartsClient summary={summary} />
          </>
        )}
      </div>
    </div>
  );
}
