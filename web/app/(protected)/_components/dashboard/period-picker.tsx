import Link from "next/link";

const OPTIONS = [
  { days: 7, label: "7 dias" },
  { days: 14, label: "14 dias" },
  { days: 30, label: "30 dias" },
  { days: 90, label: "90 dias" },
] as const;

export function DashboardPeriodPicker(props: { activeDays: number }) {
  return (
    <nav aria-label="Período do resumo" className="flex flex-wrap gap-2">
      {OPTIONS.map((opt) => {
        const isActive = props.activeDays === opt.days;

        return (
          <Link
            key={opt.days}
            href={`/?days=${opt.days}`}
            prefetch={false}
            aria-current={isActive ? "page" : undefined}
            className={[
              "inline-flex h-9 items-center justify-center rounded-xl px-3 text-sm font-medium transition",
              isActive
                ? "bg-slate-950 text-white dark:bg-zinc-100 dark:text-slate-950"
                : "border border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50 dark:border-white/15 dark:bg-slate-900 dark:text-zinc-100 dark:hover:bg-slate-800",
            ].join(" ")}
          >
            {opt.label}
          </Link>
        );
      })}
    </nav>
  );
}
