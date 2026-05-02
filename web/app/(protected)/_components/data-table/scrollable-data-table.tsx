import type { ReactNode } from "react";

type ScrollableDataTableProps = {
  headerTitle: string;
  headerRight?: ReactNode;
  children: ReactNode;
};

/**
 * Cartão com cabeçalho fixo e área de scroll — mesmo padrão visual da listagem de logs.
 */
export function ScrollableDataTable(props: ScrollableDataTableProps) {
  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-950">
      <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-4 py-3 text-sm dark:border-white/10">
        <div className="font-medium text-zinc-900 dark:text-zinc-50">{props.headerTitle}</div>
        {props.headerRight != null ? (
          <div className="text-zinc-600 dark:text-zinc-400">{props.headerRight}</div>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-auto">{props.children}</div>
    </section>
  );
}
