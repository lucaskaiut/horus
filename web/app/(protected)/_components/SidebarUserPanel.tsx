"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { verifyAuthentication, performLogout } from "@/lib/auth/session";
import type { AuthState } from "@/lib/auth/session";

type AuthenticatedAuth = Extract<AuthState, { status: "authenticated" }>;

type UiState =
  | { status: "loading" }
  | { status: "ready"; auth: AuthenticatedAuth };

export default function SidebarUserPanel() {
  const router = useRouter();
  const [ui, setUi] = useState<UiState>({ status: "loading" });
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run(): Promise<void> {
      const auth = await verifyAuthentication();
      if (cancelled) {
        return;
      }

      if (auth.status === "authenticated") {
        setUi({ status: "ready", auth });
        return;
      }

      router.replace("/login");
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleLogout(): Promise<void> {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);
    try {
      await performLogout();
      router.replace("/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  if (ui.status === "loading") {
    return (
      <div className="px-4 py-4 text-xs text-zinc-500 dark:text-zinc-400">
        Carregando usuário…
      </div>
    );
  }

  const auth = ui.auth;

  return (
    <section
      aria-label="Conta do usuário"
      className="border-t border-zinc-200 px-4 py-4 dark:border-white/10"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
          {auth.user.name || "Usuário"}
        </p>
        <p className="truncate text-xs leading-5 text-zinc-600 dark:text-zinc-400">
          {auth.user.email || "—"}
        </p>
      </div>

      <button
        type="button"
        onClick={() => {
          void handleLogout();
        }}
        disabled={loggingOut}
        className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/15 dark:bg-slate-900 dark:text-zinc-100 dark:hover:bg-white/5"
      >
        {loggingOut ? "Saindo…" : "Sair"}
      </button>
    </section>
  );
}
