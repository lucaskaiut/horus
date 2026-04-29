"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { performLogin, verifyAuthentication } from "@/lib/auth/session";
import type { LoginRequestBody } from "@/lib/auth/types";

type FormState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "error"; message: string };

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState<LoginRequestBody>({
    login: "",
    password: "",
    google2faValidation: null,
  });
  const [state, setState] = useState<FormState>({ status: "idle" });

  const canSubmit = useMemo(() => {
    const hasLogin = form.login.trim().length > 0;
    const hasPassword = form.password.trim().length > 0;
    return hasLogin && hasPassword && state.status !== "submitting";
  }, [form.login, form.password, state.status]);

  useEffect(() => {
    let cancelled = false;

    async function run(): Promise<void> {
      const auth = await verifyAuthentication(window.localStorage);
      if (cancelled) {
        return;
      }

      if (auth.status === "authenticated") {
        router.replace("/");
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    if (!canSubmit) {
      return;
    }

    setState({ status: "submitting" });
    try {
      await performLogin(window.localStorage, {
        login: form.login.trim(),
        password: form.password,
        google2faValidation: form.google2faValidation?.trim() || null,
      });

      /**
       * Regra: após login, não criamos stack de navegação para a tela de login.
       * Isso evita o usuário “voltar” para um formulário que não faz sentido após autenticado.
       */
      router.replace("/");
    } catch {
      setState({
        status: "error",
        message: "Não foi possível autenticar. Verifique suas credenciais.",
      });
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-slate-100 px-6 py-16 font-sans dark:bg-slate-950">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm dark:bg-slate-800">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Entrar
          </h1>
          <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Faça login para acessar o painel.
          </p>
        </div>

        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Login
            </label>
            <input
              value={form.login}
              onChange={(e) => setForm((p) => ({ ...p, login: e.target.value }))}
              autoComplete="username"
              className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-950 outline-none ring-0 transition focus:border-zinc-300 focus:outline-none focus:ring-4 focus:ring-zinc-200/40 dark:border-white/10 dark:bg-slate-900 dark:text-zinc-50 dark:focus:ring-white/10"
              placeholder="seu@email.com"
              inputMode="email"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Senha
            </label>
            <input
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              type="password"
              autoComplete="current-password"
              className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-950 outline-none ring-0 transition focus:border-zinc-300 focus:outline-none focus:ring-4 focus:ring-zinc-200/40 dark:border-white/10 dark:bg-slate-900 dark:text-zinc-50 dark:focus:ring-white/10"
              placeholder="••••••••"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Código 2FA
            </label>
            <input
              value={form.google2faValidation ?? ""}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  google2faValidation: e.target.value.length ? e.target.value : null,
                }))
              }
              inputMode="numeric"
              className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-950 outline-none ring-0 transition focus:border-zinc-300 focus:outline-none focus:ring-4 focus:ring-zinc-200/40 dark:border-white/10 dark:bg-slate-900 dark:text-zinc-50 dark:focus:ring-white/10"
              placeholder="000000"
            />
          </div>

          {state.status === "error" ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-500/20 dark:bg-red-950/40 dark:text-red-200">
              {state.message}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-900 dark:hover:bg-slate-800"
          >
            {state.status === "submitting" ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}

