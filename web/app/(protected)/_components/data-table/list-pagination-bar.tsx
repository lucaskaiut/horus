import { useMemo } from "react";

import { buildPaginationItems } from "@/lib/pagination";

type ListPaginationBarProps = {
  currentPage: number;
  lastPage: number;
  total: number;
  perPage: number;
  perPageOptions: number[];
  onGoToPage: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
};

export function ListPaginationBar(props: ListPaginationBarProps) {
  const pageItems = useMemo(
    () => buildPaginationItems(props.currentPage, props.lastPage),
    [props.currentPage, props.lastPage],
  );

  return (
    <section className="shrink-0 flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-950 md:flex-row md:items-center md:justify-between">
      <div className="text-sm text-zinc-600 dark:text-zinc-400">
        Página{" "}
        <span className="font-medium text-zinc-900 dark:text-zinc-50">{props.currentPage}</span> de{" "}
        <span className="font-medium text-zinc-900 dark:text-zinc-50">{props.lastPage}</span> · Total{" "}
        <span className="font-medium text-zinc-900 dark:text-zinc-50">{props.total}</span>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
          Itens por página
          <select
            aria-label="Itens por página"
            value={props.perPage}
            onChange={(e) => props.onPerPageChange(Number(e.target.value))}
            className="h-9 rounded-xl border border-zinc-200 bg-white px-2 text-sm text-zinc-950 outline-none ring-0 transition focus:border-zinc-300 focus:ring-4 focus:ring-zinc-200/40 dark:border-white/10 dark:bg-slate-900 dark:text-zinc-50 dark:focus:ring-white/10"
          >
            {props.perPageOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>

        <nav aria-label="Paginação" className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => props.onGoToPage(props.currentPage - 1)}
            disabled={props.currentPage <= 1}
            className="inline-flex h-9 items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-slate-900 dark:text-zinc-50 dark:hover:bg-slate-800"
          >
            Anterior
          </button>

          <div className="flex flex-wrap items-center gap-1">
            {pageItems.map((item, idx) => {
              if (item === "…") {
                return (
                  <span key={`ellipsis-${idx}`} className="px-2 text-sm text-zinc-500 dark:text-zinc-400">
                    …
                  </span>
                );
              }

              const isActive = item === props.currentPage;
              return (
                <button
                  key={item}
                  type="button"
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => props.onGoToPage(item)}
                  className={[
                    "inline-flex h-9 min-w-9 items-center justify-center rounded-xl border px-3 text-sm font-medium transition",
                    isActive
                      ? "border-slate-950 bg-slate-950 text-white dark:border-slate-200 dark:bg-slate-200 dark:text-slate-950"
                      : "border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50 dark:border-white/10 dark:bg-slate-900 dark:text-zinc-50 dark:hover:bg-slate-800",
                  ].join(" ")}
                >
                  {item}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => props.onGoToPage(props.currentPage + 1)}
            disabled={props.currentPage >= props.lastPage}
            className="inline-flex h-9 items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-slate-900 dark:text-zinc-50 dark:hover:bg-slate-800"
          >
            Próxima
          </button>
        </nav>
      </div>
    </section>
  );
}
