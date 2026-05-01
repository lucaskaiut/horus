"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from "recharts";

import { resolveLogLevelLabelPt } from "@/lib/logs/log-level-labels";
import type { LogsSummaryPayload } from "@/lib/logs/summary-types";

const AREA_STROKE = "#0ea5e9";
const AREA_FILL = "rgba(14,165,233,0.22)";
const GRID_LIGHT = "#e4e4e7";
const AXIS_TICK = "#71717a";

const LEVEL_COLORS = ["#059669", "#0284c7", "#06b6d4", "#ca8a04", "#dc2626", "#be185d", "#ea580c", "#7c3aed", "#71717a"];

function levelDisplayLabel(raw: string): string {
  if (raw === "(vazio)") {
    return "Sem nível";
  }

  return resolveLogLevelLabelPt(raw.toLowerCase(), raw);
}

function truncateLabel(raw: string, max = 22): string {
  if (raw.length <= max) {
    return raw;
  }

  return `${raw.slice(0, max)}…`;
}

type Props = {
  summary: LogsSummaryPayload;
};

export function DashboardChartsClient(props: Props) {
  const histogramPrepared = useMemo(
    () =>
      props.summary.histogram.map((b) => {
        const parsed = /^(\d{4})-(\d{2})-(\d{2})$/.exec(b.date);
        const labelDay =
          parsed !== null ? `${parsed[3]}/${parsed[2]}` : b.date;

        return {
          label: labelDay,
          registros: b.count,
          rawDate: b.date,
        };
      }),
    [props.summary.histogram],
  );

  const levelPie = useMemo(() => {
    const nonempty = props.summary.by_level.filter((row) => row.count > 0);
    const source = nonempty.length > 0 ? nonempty : props.summary.by_level;

    return source.slice(0, 10).map((row) => ({
      name: row.key === "(vazio)" ? "Sem nível" : levelDisplayLabel(row.key),
      value: row.count,
      key: `${row.key}|${String(row.count)}`,
    }));
  }, [props.summary.by_level]);

  const channelBars = useMemo(
    () =>
      [...props.summary.by_channel]
        .slice(0, 10)
        .map((row) => ({
          nome: truncateLabel(row.key),
          quantidade: row.count,
          raw: row.key,
        }))
        .reverse(),
    [props.summary.by_channel],
  );

  const gridStroke = GRID_LIGHT;

  if (props.summary.total === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-10 text-center text-sm text-zinc-600 dark:border-white/15 dark:bg-slate-950 dark:text-zinc-400">
        Nenhum registro no período selecionado. Ajuste o intervalo ou confira os dados no OpenSearch.
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-950">
        <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Volume por dia
        </h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Contagem pelo campo <span className="font-mono">received_at</span> (UTC, diário).
        </p>
        <div className="mt-6 h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={histogramPrepared} margin={{ top: 10, left: -10, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="label" stroke={AXIS_TICK} fontSize={11} interval="preserveStartEnd" />
              <YAxis stroke={AXIS_TICK} fontSize={11} tickFormatter={(v: number) => v.toLocaleString("pt-BR")} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: `1px solid ${GRID_LIGHT}`,
                  borderRadius: 12,
                  fontSize: 12,
                }}
                formatter={(value: number) => [value.toLocaleString("pt-BR"), "Registros"]}
                labelFormatter={(_, payload) => {
                  const raw = payload?.[0]?.payload?.rawDate;
                  return typeof raw === "string" ? `Data (${raw})` : "Data";
                }}
              />
              <Area type="monotone" dataKey="registros" stroke={AREA_STROKE} fill={AREA_FILL} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-950">
        <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Por nível</h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Distribuição agregada (top até 10 fatias).</p>
        <div className="mt-4 h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={levelPie}
                dataKey="value"
                nameKey="name"
                innerRadius={58}
                outerRadius={94}
                paddingAngle={2}
              >
                {levelPie.map((entry, idx) => (
                  <Cell
                    key={entry.key}
                    fill={LEVEL_COLORS[idx % LEVEL_COLORS.length] ?? LEVEL_COLORS[0]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: `1px solid ${GRID_LIGHT}`,
                  borderRadius: 12,
                  fontSize: 12,
                }}
                formatter={(value: number) => [value.toLocaleString("pt-BR"), "Registros"]}
              />
              <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: "11px" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-950 lg:col-span-2">
        <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Principais canais</h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Barras proporcionais ao volume dentro do período.</p>
        <div className="mt-4 h-[min(360px,50vh)] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={channelBars} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} horizontal={false} />
              <XAxis type="number" stroke={AXIS_TICK} fontSize={11} />
              <YAxis type="category" dataKey="nome" stroke={AXIS_TICK} fontSize={11} width={120} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: `1px solid ${GRID_LIGHT}`,
                  borderRadius: 12,
                  fontSize: 12,
                }}
                formatter={(value: number) => [value.toLocaleString("pt-BR"), "Registros"]}
                labelFormatter={(_, payload) =>
                  typeof payload?.[0]?.payload?.raw === "string"
                    ? `Canal: ${payload[0].payload.raw}`
                    : ""}
              />
              <Bar dataKey="quantidade" fill="#334155" radius={[0, 8, 8, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-950 lg:col-span-2">
        <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Origem e ambiente</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <RankingList titulo="Origem" linhas={props.summary.by_source.slice(0, 8)} />
          <RankingList titulo="Ambiente" linhas={props.summary.by_environment.slice(0, 8)} />
        </div>
      </section>
    </div>
  );
}

function RankingList(props: { titulo: string; linhas: Array<{ key: string; count: number }> }) {
  const max =
    props.linhas.length > 0 ? Math.max(...props.linhas.map((row) => row.count), 1) : 1;

  return (
    <div className="min-w-0">
      <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {props.titulo}
      </div>
      <ul className="mt-2 space-y-2">
        {props.linhas.map((row) => (
          <li key={`${props.titulo}-${row.key}`} className="space-y-1">
            <div className="flex justify-between gap-2 text-xs text-zinc-800 dark:text-zinc-100">
              <span className="truncate font-medium">{truncateLabel(row.key, 36)}</span>
              <span className="shrink-0 tabular-nums text-zinc-500 dark:text-zinc-400">{row.count.toLocaleString("pt-BR")}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-zinc-500 dark:bg-zinc-300"
                style={{ width: `${Math.min(100, (row.count / max) * 100)}%` }}
              />
            </div>
          </li>
        ))}
        {props.linhas.length === 0 ? (
          <li className="text-xs text-zinc-500 dark:text-zinc-400">Sem dados.</li>
        ) : null}
      </ul>
    </div>
  );
}
