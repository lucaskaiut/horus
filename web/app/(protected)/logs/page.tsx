"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { fetchJsonOrThrow } from "@/lib/auth/http";
import type { ListLogsResponse, LogLevel, LogsFilters } from "@/lib/logs/types";
import { buildLogsSearchParams, parseLogsFiltersFromSearchParams } from "@/lib/logs/query";

type PageState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; data: ListLogsResponse }
  | { status: "error"; message: string };

const LEVELS: { value: LogLevel | ""; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "debug", label: "debug" },
  { value: "info", label: "info" },
  { value: "notice", label: "notice" },
  { value: "warning", label: "warning" },
  { value: "error", label: "error" },
  { value: "critical", label: "critical" },
  { value: "alert", label: "alert" },
  { value: "emergency", label: "emergency" },
];

function safeInt(value: string | null, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : fallback;
}

function LogsFiltersDrawer(props: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!props.open) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={props.title}
      className="fixed inset-0 z-50"
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          props.onClose();
        }
      }}
    >
      <button
        type="button"
        aria-label="Fechar filtros"
        className="absolute inset-0 cursor-default bg-black/30"
        onClick={props.onClose}
      />

      <div className="absolute right-0 top-0 h-dvh w-full max-w-md border-l border-zinc-200 bg-white shadow-xl dark:border-white/10 dark:bg-slate-950">
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-white/10">
          <div className="text-sm font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            {props.title}
          </div>
          <button
            type="button"
            onClick={props.onClose}
            className="inline-flex h-9 items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 dark:border-white/10 dark:bg-slate-900 dark:text-zinc-50 dark:hover:bg-slate-800"
          >
            Fechar
          </button>
        </div>

        <div className="h-[calc(100dvh-57px)] overflow-auto p-4">{props.children}</div>
      </div>
    </div>
  );
}

function LogsFiltersForm(props: {
  value: LogsFilters;
  onChange: (next: LogsFilters) => void;
  onApply: () => void;
  onClear: () => void;
  loading: boolean;
}) {
  const v = props.value;

  return (
    <section className="space-y-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={props.onClear}
          className="inline-flex h-10 flex-1 items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-slate-900 dark:text-zinc-50 dark:hover:bg-slate-800"
          disabled={props.loading}
        >
          Limpar
        </button>
        <button
          type="button"
          onClick={props.onApply}
          className="inline-flex h-10 flex-1 items-center justify-center rounded-xl bg-slate-950 px-3 text-sm font-medium text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-900 dark:hover:bg-slate-800"
          disabled={props.loading}
        >
          {props.loading ? "Carregando…" : "Aplicar"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <div className="space-y-1">
          <label
            htmlFor="logs-filter-message"
            className="text-sm font-medium text-zinc-900 dark:text-zinc-100"
          >
            Mensagem
          </label>
          <input
            id="logs-filter-message"
            value={v.message ?? ""}
            onChange={(e) => props.onChange({ ...v, message: e.target.value })}
            placeholder="Ex: timeout, exception…"
            className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-950 outline-none ring-0 transition focus:border-zinc-300 focus:ring-4 focus:ring-zinc-200/40 dark:border-white/10 dark:bg-slate-900 dark:text-zinc-50 dark:focus:ring-white/10"
          />
        </div>

        <div className="space-y-1">
          <label
            htmlFor="logs-filter-level"
            className="text-sm font-medium text-zinc-900 dark:text-zinc-100"
          >
            Nível
          </label>
          <select
            id="logs-filter-level"
            value={v.level ?? ""}
            onChange={(e) => props.onChange({ ...v, level: e.target.value as LogLevel | "" })}
            className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-950 outline-none ring-0 transition focus:border-zinc-300 focus:ring-4 focus:ring-zinc-200/40 dark:border-white/10 dark:bg-slate-900 dark:text-zinc-50 dark:focus:ring-white/10"
          >
            {LEVELS.map((opt) => (
              <option key={opt.value || "all"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label
            htmlFor="logs-filter-channel"
            className="text-sm font-medium text-zinc-900 dark:text-zinc-100"
          >
            Canal
          </label>
          <input
            id="logs-filter-channel"
            value={v.channel ?? ""}
            onChange={(e) => props.onChange({ ...v, channel: e.target.value })}
            placeholder="Ex: http"
            className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-950 outline-none ring-0 transition focus:border-zinc-300 focus:ring-4 focus:ring-zinc-200/40 dark:border-white/10 dark:bg-slate-900 dark:text-zinc-50 dark:focus:ring-white/10"
          />
        </div>

        <div className="space-y-1">
          <label
            htmlFor="logs-filter-entity-id"
            className="text-sm font-medium text-zinc-900 dark:text-zinc-100"
          >
            Entity ID
          </label>
          <input
            id="logs-filter-entity-id"
            value={v.entity_id ?? ""}
            onChange={(e) => props.onChange({ ...v, entity_id: e.target.value })}
            placeholder='Ex: "123"'
            className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-950 outline-none ring-0 transition focus:border-zinc-300 focus:ring-4 focus:ring-zinc-200/40 dark:border-white/10 dark:bg-slate-900 dark:text-zinc-50 dark:focus:ring-white/10"
          />
        </div>

        <div className="space-y-1">
          <label
            htmlFor="logs-filter-entity-name"
            className="text-sm font-medium text-zinc-900 dark:text-zinc-100"
          >
            Entity name
          </label>
          <input
            id="logs-filter-entity-name"
            value={v.entity_name ?? ""}
            onChange={(e) => props.onChange({ ...v, entity_name: e.target.value })}
            placeholder="Ex: order"
            className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-950 outline-none ring-0 transition focus:border-zinc-300 focus:ring-4 focus:ring-zinc-200/40 dark:border-white/10 dark:bg-slate-900 dark:text-zinc-50 dark:focus:ring-white/10"
          />
        </div>

        <div className="space-y-1">
          <label
            htmlFor="logs-filter-source"
            className="text-sm font-medium text-zinc-900 dark:text-zinc-100"
          >
            Source
          </label>
          <input
            id="logs-filter-source"
            value={v.source ?? ""}
            onChange={(e) => props.onChange({ ...v, source: e.target.value })}
            placeholder="Ex: billing-api"
            className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-950 outline-none ring-0 transition focus:border-zinc-300 focus:ring-4 focus:ring-zinc-200/40 dark:border-white/10 dark:bg-slate-900 dark:text-zinc-50 dark:focus:ring-white/10"
          />
        </div>

        <div className="space-y-1">
          <label
            htmlFor="logs-filter-from"
            className="text-sm font-medium text-zinc-900 dark:text-zinc-100"
          >
            Data (de)
          </label>
          <input
            type="date"
            id="logs-filter-from"
            value={v.received_at_from ?? ""}
            onChange={(e) => props.onChange({ ...v, received_at_from: e.target.value })}
            className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-950 outline-none ring-0 transition focus:border-zinc-300 focus:ring-4 focus:ring-zinc-200/40 dark:border-white/10 dark:bg-slate-900 dark:text-zinc-50 dark:focus:ring-white/10"
          />
        </div>

        <div className="space-y-1">
          <label
            htmlFor="logs-filter-to"
            className="text-sm font-medium text-zinc-900 dark:text-zinc-100"
          >
            Data (até)
          </label>
          <input
            type="date"
            id="logs-filter-to"
            value={v.received_at_to ?? ""}
            onChange={(e) => props.onChange({ ...v, received_at_to: e.target.value })}
            className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-950 outline-none ring-0 transition focus:border-zinc-300 focus:ring-4 focus:ring-zinc-200/40 dark:border-white/10 dark:bg-slate-900 dark:text-zinc-50 dark:focus:ring-white/10"
          />
        </div>

        <label className="mt-2 inline-flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
          <input
            type="checkbox"
            checked={v.has_exception ?? false}
            onChange={(e) => props.onChange({ ...v, has_exception: e.target.checked })}
            className="h-4 w-4 rounded border-zinc-300 text-slate-900 dark:border-white/20"
          />
          Somente com exceção
        </label>
      </div>
    </section>
  );
}

function LogsTable(props: { data: ListLogsResponse }) {
  return (
    <section className="mt-4 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-950">
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 text-sm dark:border-white/10">
        <div className="font-medium text-zinc-900 dark:text-zinc-50">Resultados</div>
        <div className="text-zinc-600 dark:text-zinc-400">
          Total: <span className="font-medium text-zinc-900 dark:text-zinc-50">{props.data.meta.total}</span>
        </div>
      </div>

      <div className="overflow-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-zinc-50 text-xs text-zinc-600 dark:bg-slate-900 dark:text-zinc-300">
            <tr>
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Nível</th>
              <th className="px-4 py-3 font-medium">Canal</th>
              <th className="px-4 py-3 font-medium">Mensagem</th>
              <th className="px-4 py-3 font-medium">Entidade</th>
              <th className="px-4 py-3 font-medium">Tracking</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-white/10">
            {props.data.data.map((log) => (
              <tr key={log.tracking_id} className="text-zinc-900 dark:text-zinc-50">
                <td className="px-4 py-3 whitespace-nowrap text-zinc-700 dark:text-zinc-200">
                  {log.received_at ?? "—"}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">{log.level ?? "—"}</td>
                <td className="px-4 py-3 whitespace-nowrap text-zinc-700 dark:text-zinc-200">
                  {log.channel ?? "—"}
                </td>
                <td className="px-4 py-3 min-w-88">
                  <div className="line-clamp-2">{log.message ?? "—"}</div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-zinc-700 dark:text-zinc-200">
                  {log.entity_name && log.entity_id ? `${log.entity_name}:${log.entity_id}` : "—"}
                </td>
                <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-zinc-600 dark:text-zinc-300">
                  {log.tracking_id}
                </td>
              </tr>
            ))}

            {props.data.data.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-zinc-600 dark:text-zinc-400">
                  Nenhum log encontrado.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function LogsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialFilters = useMemo(() => {
    return parseLogsFiltersFromSearchParams(new URLSearchParams(searchParams?.toString() ?? ""));
  }, [searchParams]);

  const [filtersDraft, setFiltersDraft] = useState<LogsFilters>(initialFilters);
  const [state, setState] = useState<PageState>({ status: "idle" });
  const [filtersOpen, setFiltersOpen] = useState(false);

  const page = safeInt(searchParams?.get("page") ?? null, 1);
  const per_page = safeInt(searchParams?.get("per_page") ?? null, 50);
  const sort = (searchParams?.get("sort") ?? "received_at") as "received_at" | "processed_at" | "created_at";
  const order = (searchParams?.get("order") ?? "desc") as "asc" | "desc";

  useEffect(() => {
    let cancelled = false;

    async function run(): Promise<void> {
      setState({ status: "loading" });
      try {
        const params = buildLogsSearchParams({
          page,
          per_page,
          sort,
          order,
          filters: initialFilters,
        });

        const data = await fetchJsonOrThrow<ListLogsResponse>(`/api/logs?${params.toString()}`, {
          method: "GET",
          headers: { accept: "application/json" },
        });
        if (!cancelled) {
          setState({ status: "ready", data });
        }
      } catch {
        if (!cancelled) {
          setState({ status: "error", message: "Não foi possível carregar os logs." });
        }
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [initialFilters, order, page, per_page, sort]);

  function applyFilters(): void {
    const params = buildLogsSearchParams({
      page: 1,
      per_page,
      sort,
      order,
      filters: filtersDraft,
    });
    router.replace(`/logs?${params.toString()}`);
    setFiltersOpen(false);
  }

  function clearFilters(): void {
    setFiltersDraft({});
    const params = buildLogsSearchParams({
      page: 1,
      per_page,
      sort,
      order,
      filters: {},
    });
    router.replace(`/logs?${params.toString()}`);
  }

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 px-6 py-6 font-sans dark:bg-slate-900">
      <div className="mx-auto w-full max-w-6xl">
        <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-950">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                Logs
              </h1>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Pesquise por mensagem, nível, canal, entidade e período.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFiltersOpen(true)}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 dark:border-white/10 dark:bg-slate-900 dark:text-zinc-50 dark:hover:bg-slate-800"
              >
                Filtros
              </button>
            </div>
          </div>
        </section>

        <LogsFiltersDrawer
          open={filtersOpen}
          title="Filtros"
          onClose={() => setFiltersOpen(false)}
        >
          <LogsFiltersForm
            value={filtersDraft}
            onChange={setFiltersDraft}
            onApply={applyFilters}
            onClear={clearFilters}
            loading={state.status === "loading"}
          />
        </LogsFiltersDrawer>

        {state.status === "error" ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-500/20 dark:bg-red-950/40 dark:text-red-200">
            {state.message}
          </div>
        ) : null}

        {state.status === "ready" ? <LogsTable data={state.data} /> : null}

        {state.status === "loading" || state.status === "idle" ? (
          <div className="mt-4 rounded-2xl border border-zinc-200 bg-white px-4 py-10 text-center text-sm text-zinc-600 shadow-sm dark:border-white/10 dark:bg-slate-950 dark:text-zinc-400">
            Carregando…
          </div>
        ) : null}
      </div>
    </div>
  );
}

