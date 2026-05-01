"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import type { RegisterFormValues } from "@/lib/auth/register-validation";
import { validateRegisterForm } from "@/lib/auth/register-validation";
import { verifyAuthentication } from "@/lib/auth/session";

type FormState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

const inputBase =
  "h-11 w-full rounded-xl border bg-white px-3 text-sm text-zinc-950 outline-none ring-0 transition focus:outline-none focus:ring-4 dark:bg-slate-900 dark:text-zinc-50";

function inputClass(ok: boolean): string {
  if (ok) {
    return `${inputBase} border-zinc-200 focus:border-zinc-300 focus:ring-zinc-200/40 dark:border-white/10 dark:focus:ring-white/10`;
  }
  return `${inputBase} border-red-300 focus:border-red-400 focus:ring-red-200/35 dark:border-red-500/40 dark:focus:ring-red-950/40`;
}

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<RegisterFormValues>({
    name: "",
    email: "",
    password: "",
    passwordConfirmation: "",
  });
  const [touched, setTouched] = useState<Partial<Record<keyof RegisterFormValues, boolean>>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [state, setState] = useState<FormState>({ status: "idle" });

  const fieldErrors = useMemo(() => validateRegisterForm(form), [form]);

  const showErrors = useMemo(() => {
    const afterSubmit = submitAttempted;
    const confirmTyped = form.passwordConfirmation.length > 0;
    return {
      name: !!fieldErrors.name && ((touched.name ?? false) || afterSubmit),
      email: !!fieldErrors.email && ((touched.email ?? false) || afterSubmit),
      password: !!fieldErrors.password && ((touched.password ?? false) || afterSubmit),
      passwordConfirmation:
        !!fieldErrors.passwordConfirmation &&
        (confirmTyped || (touched.passwordConfirmation ?? false) || afterSubmit),
    };
  }, [
    fieldErrors,
    touched,
    submitAttempted,
    form.passwordConfirmation.length,
  ]);

  const formValid = useMemo(() => Object.keys(fieldErrors).length === 0, [fieldErrors]);

  useEffect(() => {
    if (state.status !== "success") {
      return;
    }
    const timer = window.setTimeout(() => {
      router.replace("/login?registered=1");
      router.refresh();
    }, 1400);

    return () => window.clearTimeout(timer);
  }, [router, state.status]);

  useEffect(() => {
    let cancelled = false;
    async function run(): Promise<void> {
      const auth = await verifyAuthentication();
      if (cancelled || auth.status !== "authenticated") {
        return;
      }
      router.replace("/");
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [router]);

  function markTouch(field: keyof RegisterFormValues): void {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setSubmitAttempted(true);
    const nextErrors = validateRegisterForm(form);
    if (Object.keys(nextErrors).length > 0) {
      setState({ status: "idle" });
      return;
    }

    setState({ status: "submitting" });
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          password_confirmation: form.passwordConfirmation,
        }),
      });
      if (!response.ok) {
        setState({
          status: "error",
          message: "Não foi possível concluir o cadastro. Tente novamente.",
        });
        return;
      }
      setState({
        status: "success",
        message:
          "Cadastro concluído com sucesso. Você será redirecionado para entrar.",
      });
    } catch {
      setState({
        status: "error",
        message: "Não foi possível concluir o cadastro. Tente novamente.",
      });
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-slate-100 px-6 py-16 font-sans dark:bg-slate-950">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm dark:bg-slate-800">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Criar conta
          </h1>
          <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Preencha os dados para se cadastrar.
          </p>
        </div>

        {state.status === "success" ? (
          <div
            role="status"
            className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-500/25 dark:bg-emerald-950/35 dark:text-emerald-100"
          >
            {state.message}
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="mt-8 space-y-5" noValidate>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100" htmlFor="register-name">
              Nome
            </label>
            <input
              id="register-name"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              onBlur={() => markTouch("name")}
              disabled={state.status === "submitting" || state.status === "success"}
              autoComplete="name"
              className={inputClass(!showErrors.name)}
              placeholder="Seu nome"
            />
            {showErrors.name && fieldErrors.name ? (
              <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                {fieldErrors.name}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100" htmlFor="register-email">
              E-mail
            </label>
            <input
              id="register-email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              onBlur={() => markTouch("email")}
              disabled={state.status === "submitting" || state.status === "success"}
              autoComplete="email"
              inputMode="email"
              className={inputClass(!showErrors.email)}
              placeholder="seu@email.com"
            />
            {showErrors.email && fieldErrors.email ? (
              <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                {fieldErrors.email}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100" htmlFor="register-password">
              Senha
            </label>
            <input
              id="register-password"
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              onBlur={() => markTouch("password")}
              disabled={state.status === "submitting" || state.status === "success"}
              type="password"
              autoComplete="new-password"
              className={inputClass(!showErrors.password)}
              placeholder="Mínimo 8 caracteres"
            />
            {showErrors.password && fieldErrors.password ? (
              <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                {fieldErrors.password}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-medium text-zinc-900 dark:text-zinc-100"
              htmlFor="register-password-confirmation"
            >
              Confirmar senha
            </label>
            <input
              id="register-password-confirmation"
              value={form.passwordConfirmation}
              onChange={(e) => setForm((p) => ({ ...p, passwordConfirmation: e.target.value }))}
              onBlur={() => markTouch("passwordConfirmation")}
              disabled={state.status === "submitting" || state.status === "success"}
              type="password"
              autoComplete="new-password"
              className={inputClass(!showErrors.passwordConfirmation)}
              placeholder="Repita a senha"
            />
            {showErrors.passwordConfirmation && fieldErrors.passwordConfirmation ? (
              <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                {fieldErrors.passwordConfirmation}
              </p>
            ) : null}
          </div>

          {state.status === "error" ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-500/20 dark:bg-red-950/40 dark:text-red-200">
              {state.message}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={!formValid || state.status === "submitting" || state.status === "success"}
            className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-900 dark:hover:bg-slate-800"
          >
            {state.status === "submitting"
              ? "Cadastrando…"
              : state.status === "success"
                ? "Cadastro enviado"
                : "Cadastrar"}
          </button>

          <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
            Já tem uma conta?{" "}
            <Link
              href="/login"
              className="font-medium text-slate-950 underline disabled:pointer-events-none dark:text-zinc-100"
              aria-disabled={state.status === "submitting" || state.status === "success"}
              tabIndex={
                state.status === "submitting" || state.status === "success" ? -1 : undefined
              }
              onClick={(e) => {
                if (state.status === "submitting" || state.status === "success") {
                  e.preventDefault();
                }
              }}
            >
              Entrar
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
