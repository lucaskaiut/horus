import Link from "next/link";

type MenuItem = {
  id: string;
  label: string;
  href: string;
};

const ITEMS: MenuItem[] = [
  { id: "dashboard", label: "Dashboard", href: "/" },
  { id: "logs", label: "Logs", href: "/logs" },
];

function normalizePath(path: string): string {
  if (path === "/") {
    return "/";
  }

  return path.endsWith("/") ? path.slice(0, -1) : path;
}

function isActivePath(currentPath: string, href: string): boolean {
  const normalizedCurrentPath = normalizePath(currentPath);
  const normalizedHref = normalizePath(href);

  if (normalizedHref === "/") {
    return normalizedCurrentPath === "/";
  }

  return (
    normalizedCurrentPath === normalizedHref ||
    normalizedCurrentPath.startsWith(`${normalizedHref}/`)
  );
}

export default function SidebarNav(props: { currentPath: string }) {
  return (
    <aside className="w-64 shrink-0 border-r border-zinc-200 bg-white font-sans dark:border-white/10 dark:bg-slate-950">
      <div className="px-4 py-4">
        <div className="text-sm font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Elog
        </div>
      </div>

      <nav aria-label="Menu lateral" className="px-2 pb-4">
        <ul className="space-y-1">
          {ITEMS.map((item) => {
            const active = isActivePath(props.currentPath, item.href);
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "flex h-10 items-center rounded-xl px-3 text-sm font-medium transition",
                    active
                      ? "bg-slate-950 text-white dark:bg-slate-900"
                      : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-white/5",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
