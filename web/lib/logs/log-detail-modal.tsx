"use client";

import type { ReactNode } from "react";

import type { LogItem } from "./types";
import { formatReceivedAtForDisplay } from "./format-received-at";
import { LogLevelBadge } from "./log-level-badge";

function prettyJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function ScalarRow(props: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-zinc-100 py-3 last:border-b-0 sm:grid-cols-[minmax(8rem,10rem)_1fr] sm:gap-4 dark:border-white/10">
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {props.label}
      </dt>
      <dd className="min-w-0 text-sm text-zinc-900 dark:text-zinc-50">{props.children}</dd>
    </div>
  );
}

function JsonSection(props: { title: string; value: unknown }) {
  const isEmpty =
    props.value === null ||
    props.value === undefined ||
    (typeof props.value === "object" &&
      props.value !== null &&
      Object.keys(props.value as object).length === 0);

  return (
    <section className="mt-6">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {props.title}
      </h3>
      {isEmpty ? (
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">—</p>
      ) : (
        <pre className="mt-2 max-h-64 overflow-auto rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs leading-relaxed text-zinc-800 dark:border-white/10 dark:bg-slate-900 dark:text-zinc-200">
          {prettyJson(props.value)}
        </pre>
      )}
    </section>
  );
}

export function LogDetailModal(props: { log: LogItem | null; onClose: () => void }) {
  if (props.log == null) {
    return null;
  }

  const log = props.log;

  function str(v: string | null | undefined) {
    if (v == null || v === "") {
      return <span className="text-zinc-500 dark:text-zinc-400">—</span>;
    }
    return <span className="break-all">{v}</span>;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="log-detail-modal-title"
      className="fixed inset-0 z-60"
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          props.onClose();
        }
      }}
    >
      <button
        type="button"
        aria-label="Fechar overlay"
        className="absolute inset-0 cursor-default bg-black/40"
        onClick={props.onClose}
      />

      <div className="absolute inset-x-4 top-[5dvh] z-61 mx-auto flex max-h-[90dvh] max-w-2xl flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-950 md:inset-x-auto md:left-1/2 md:w-full md:-translate-x-1/2">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-zinc-200 px-4 py-4 dark:border-white/10">
          <div className="min-w-0">
            <h2
              id="log-detail-modal-title"
              className="text-base font-semibold tracking-tight text-zinc-950 dark:text-zinc-50"
            >
              Detalhes do log
            </h2>
            <p className="mt-1 truncate font-mono text-xs text-zinc-500 dark:text-zinc-400">
              {log.tracking_id}
            </p>
          </div>
          <button
            type="button"
            onClick={props.onClose}
            className="inline-flex h-9 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 dark:border-white/10 dark:bg-slate-900 dark:text-zinc-50 dark:hover:bg-slate-800"
          >
            Fechar
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <LogLevelBadge level={log.level} />
          </div>

          {log.message != null && log.message !== "" ? (
            <p className="mt-4 text-sm leading-relaxed text-zinc-900 dark:text-zinc-100">{log.message}</p>
          ) : (
            <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">Sem mensagem.</p>
          )}

          <dl className="mt-6">
            <ScalarRow label="Canal">{str(log.channel)}</ScalarRow>
            <ScalarRow label="Origem">{str(log.source)}</ScalarRow>
            <ScalarRow label="Ambiente">{str(log.environment)}</ScalarRow>
            <ScalarRow label="Entidade">{str(log.entity_name)}</ScalarRow>
            <ScalarRow label="Entity ID">{str(log.entity_id)}</ScalarRow>
            <ScalarRow label="Request ID">{str(log.request_id)}</ScalarRow>
            <ScalarRow label="Trace ID">{str(log.trace_id)}</ScalarRow>
            <ScalarRow label="User ID">{str(log.user_id)}</ScalarRow>
            <ScalarRow label="IP">{str(log.ip_address)}</ScalarRow>
            <ScalarRow label="User-Agent">
              {log.user_agent != null && log.user_agent !== "" ? (
                <span className="wrap-break-word">{log.user_agent}</span>
              ) : (
                <span className="text-zinc-500 dark:text-zinc-400">—</span>
              )}
            </ScalarRow>
            <ScalarRow label="Recebido em">
              <span suppressHydrationWarning title={log.received_at ?? undefined}>
                {formatReceivedAtForDisplay(log.received_at)}
              </span>
            </ScalarRow>
            <ScalarRow label="Processado em">
              <span suppressHydrationWarning title={log.processed_at ?? undefined}>
                {formatReceivedAtForDisplay(log.processed_at)}
              </span>
            </ScalarRow>
            <ScalarRow label="Criado em">
              <span suppressHydrationWarning title={log.created_at ?? undefined}>
                {formatReceivedAtForDisplay(log.created_at)}
              </span>
            </ScalarRow>
          </dl>

          <JsonSection title="Context" value={log.context} />
          <JsonSection title="Exception" value={log.exception} />
        </div>
      </div>
    </div>
  );
}
