type MenuItem = {
  id: string;
  label: string;
  href: string;
};

const ITEMS: MenuItem[] = [
  { id: "dashboard", label: "Dashboard", href: "/" },
  { id: "logs", label: "Logs", href: "/logs" },
];

import SidebarNavItems from "@/app/(protected)/_components/SidebarNavItems";

export default function SidebarNav() {
  return (
    <aside className="w-64 shrink-0 border-r border-zinc-200 bg-white font-sans dark:border-white/10 dark:bg-slate-950">
      <div className="px-4 py-4">
        <div className="text-sm font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Elog
        </div>
      </div>

      <SidebarNavItems items={ITEMS} />
    </aside>
  );
}
