import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import SidebarNav from "@/app/(protected)/_components/SidebarNav";

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const token = cookieStore.get("elog_auth_token")?.value ?? "";
  if (!token.trim()) {
    redirect("/login");
  }

  const headerStore = await headers();
  const currentPath = headerStore.get("x-elog-pathname") ?? "/";

  return (
    <div className="flex min-h-dvh bg-zinc-50 font-sans dark:bg-slate-900">
      <SidebarNav currentPath={currentPath} />
      <main className="flex min-w-0 flex-1">{children}</main>
    </div>
  );
}
