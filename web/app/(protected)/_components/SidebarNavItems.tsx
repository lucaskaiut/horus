"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type MenuItem = {
  id: string;
  label: string;
  href: string;
};

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

export default function SidebarNavItems(props: { items: MenuItem[] }) {
  const pathname = usePathname() ?? "/";

  return (
    <nav aria-label="Menu lateral" className="px-2 pb-4">
      <ul className="space-y-1">
        {props.items.map((item) => {
          const active = isActivePath(pathname, item.href);
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
  );
}

