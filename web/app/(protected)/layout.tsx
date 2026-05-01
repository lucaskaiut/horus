import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import SidebarNav from "@/app/(protected)/_components/SidebarNav";
import { AUTH_SESSION_COOKIE_NAME } from "@/lib/auth/constants";

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_SESSION_COOKIE_NAME)?.value ?? "";
  if (!token.trim()) {
    redirect("/login");
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-zinc-50 font-sans dark:bg-slate-900">
      <SidebarNav />
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">{children}</main>
    </div>
  );
}
