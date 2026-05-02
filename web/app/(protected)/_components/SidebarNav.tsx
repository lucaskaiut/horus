import SidebarNavItems from "@/app/(protected)/_components/SidebarNavItems";
import SidebarUserPanel from "@/app/(protected)/_components/SidebarUserPanel";

type MenuItem = {
  id: string;
  label: string;
  href: string;
};

const ITEMS: MenuItem[] = [
  { id: "dashboard", label: "Dashboard", href: "/" },
  { id: "logs", label: "Logs", href: "/logs" },
  { id: "users", label: "Usuários", href: "/users" },
];

export default function SidebarNav() {
  return (
    <aside className="flex min-h-0 w-64 shrink-0 flex-col overflow-hidden border-r border-zinc-200 bg-white font-sans dark:border-white/10 dark:bg-slate-950">
      <div className="px-4 py-4">
        <div className="text-sm font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Horus
        </div>
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto">
          <SidebarNavItems items={ITEMS} />
        </div>
        <SidebarUserPanel />
      </div>
    </aside>
  );
}
