"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { ListPaginationBar } from "@/app/(protected)/_components/data-table/list-pagination-bar";
import { ScrollableDataTable } from "@/app/(protected)/_components/data-table/scrollable-data-table";
import { HttpError, fetchJsonOrThrow } from "@/lib/auth/http";
import { safeInt } from "@/lib/pagination";
import type { PaginatedUsersResponse, UserDetailResponse, UserRow } from "@/lib/users/types";

type ListState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; data: PaginatedUsersResponse }
  | { status: "error"; message: string };

function formatUserDate(iso: string | null): string {
  if (!iso) {
    return "—";
  }
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function errorMessageFromHttp(err: unknown): string {
  if (!(err instanceof HttpError) || err.payload == null) {
    return "Operação falhou. Tente novamente.";
  }

  const p = err.payload;
  if ("message" in p && typeof p.message === "string" && p.message.length > 0) {
    return p.message;
  }
  if ("error" in p && typeof p.error === "string" && p.error.length > 0) {
    return p.error;
  }
  if ("errors" in p && p.errors != null && typeof p.errors === "object") {
    const first = Object.values(p.errors as Record<string, string[] | string>)[0];
    if (Array.isArray(first) && first[0]) {
      return String(first[0]);
    }
    if (typeof first === "string") {
      return first;
    }
  }
  return "Operação falhou. Tente novamente.";
}

function UserFormModal(props: {
  open: boolean;
  mode: "create" | "edit";
  initial: UserRow | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: (body: Record<string, string>) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (props.open) {
      setName(props.mode === "edit" && props.initial ? props.initial.name : "");
      setEmail(props.mode === "edit" && props.initial ? props.initial.email : "");
      setPassword("");
      setPasswordConfirmation("");
      setLocalError(null);
    }
  }, [props.open, props.mode, props.initial]);

  if (!props.open) {
    return null;
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setLocalError(null);
    const body: Record<string, string> = { name: name.trim(), email: email.trim() };
    if (password.trim().length > 0) {
      if (password !== passwordConfirmation) {
        setLocalError("Senha e confirmação não coincidem.");
        return;
      }
      body.password = password;
      body.password_confirmation = passwordConfirmation;
    }
    if (props.mode === "create" && password.trim().length === 0) {
      setLocalError("Informe a senha para o novo usuário.");
      return;
    }
    try {
      await props.onSubmit(body);
    } catch (err) {
      setLocalError(errorMessageFromHttp(err));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Fechar"
        className="absolute inset-0 bg-black/40"
        onClick={props.onClose}
      />
      <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-slate-950">
        <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
          {props.mode === "create" ? "Novo usuário" : "Editar usuário"}
        </h2>
        <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 space-y-4">
          <div className="space-y-1">
            <label htmlFor="user-name" className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Nome
            </label>
            <input
              id="user-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-slate-900 dark:text-zinc-50"
              autoComplete="name"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="user-email" className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              E-mail
            </label>
            <input
              id="user-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-slate-900 dark:text-zinc-50"
              autoComplete="email"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="user-password" className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {props.mode === "create" ? "Senha" : "Nova senha (opcional)"}
            </label>
            <input
              id="user-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-slate-900 dark:text-zinc-50"
              autoComplete={props.mode === "create" ? "new-password" : "new-password"}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="user-password2" className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Confirmar senha
            </label>
            <input
              id="user-password2"
              type="password"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-slate-900 dark:text-zinc-50"
              autoComplete="new-password"
            />
          </div>
          {localError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-500/25 dark:bg-red-950/40 dark:text-red-100">
              {localError}
            </div>
          ) : null}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={props.onClose}
              className="h-10 rounded-xl border border-zinc-200 px-4 text-sm font-medium dark:border-white/10"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={props.loading}
              className="h-10 rounded-xl bg-slate-950 px-4 text-sm font-medium text-white disabled:opacity-60 dark:bg-slate-200 dark:text-slate-950"
            >
              {props.loading ? "Salvando…" : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ConfirmDeleteModal(props: {
  open: boolean;
  user: UserRow | null;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (props.open) {
      setErr(null);
    }
  }, [props.open]);

  if (!props.open || props.user === null) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center" role="dialog" aria-modal="true">
      <button type="button" aria-label="Fechar" className="absolute inset-0 bg-black/40" onClick={props.onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-slate-950">
        <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">Remover usuário</h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Remover <span className="font-medium text-zinc-900 dark:text-zinc-100">{props.user.name}</span> (
          {props.user.email})? Esta ação não pode ser desfeita.
        </p>
        {err ? (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{err}</div>
        ) : null}
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={props.onClose}
            className="h-10 rounded-xl border border-zinc-200 px-4 text-sm font-medium dark:border-white/10"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={props.loading}
            onClick={() => {
              void (async () => {
                try {
                  await props.onConfirm();
                } catch (e) {
                  setErr(errorMessageFromHttp(e));
                }
              })();
            }}
            className="h-10 rounded-xl bg-red-600 px-4 text-sm font-medium text-white disabled:opacity-60"
          >
            {props.loading ? "Removendo…" : "Remover"}
          </button>
        </div>
      </div>
    </div>
  );
}

function UserDetailModal(props: {
  user: UserRow | null;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  if (props.user === null) {
    return null;
  }

  const u = props.user;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center p-4 sm:items-center" role="dialog" aria-modal="true">
      <button type="button" aria-label="Fechar" className="absolute inset-0 bg-black/40" onClick={props.onClose} />
      <div className="relative max-h-[90dvh] w-full max-w-lg overflow-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-slate-950">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">{u.name}</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{u.email}</p>
          </div>
          <button
            type="button"
            onClick={props.onClose}
            className="shrink-0 rounded-lg px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-slate-800"
          >
            ✕
          </button>
        </div>
        <dl className="mt-6 grid gap-3 text-sm">
          <div>
            <dt className="text-zinc-500 dark:text-zinc-400">ID</dt>
            <dd className="font-mono text-zinc-900 dark:text-zinc-100">{u.id}</dd>
          </div>
          <div>
            <dt className="text-zinc-500 dark:text-zinc-400">Criado em</dt>
            <dd className="text-zinc-900 dark:text-zinc-100">{formatUserDate(u.created_at)}</dd>
          </div>
          <div>
            <dt className="text-zinc-500 dark:text-zinc-400">Atualizado em</dt>
            <dd className="text-zinc-900 dark:text-zinc-100">{formatUserDate(u.updated_at)}</dd>
          </div>
        </dl>
        <div className="mt-8 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={props.onEdit}
            className="inline-flex h-10 items-center rounded-xl bg-slate-950 px-4 text-sm font-medium text-white dark:bg-slate-200 dark:text-slate-950"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={props.onDelete}
            className="inline-flex h-10 items-center rounded-xl border border-red-300 px-4 text-sm font-medium text-red-700 dark:border-red-500/40 dark:text-red-200"
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = safeInt(searchParams?.get("page") ?? null, 1);
  const perPage = safeInt(searchParams?.get("per_page") ?? null, 20);

  const [listState, setListState] = useState<ListState>({ status: "idle" });
  const [selected, setSelected] = useState<UserRow | null>(null);
  const [formOpen, setFormOpen] = useState<{ mode: "create" | "edit"; user: UserRow | null } | null>(null);
  const [deleteOpen, setDeleteOpen] = useState<UserRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchUsersPage = useCallback(async (): Promise<PaginatedUsersResponse> => {
    const qs = new URLSearchParams({ page: String(page), per_page: String(perPage) });
    return fetchJsonOrThrow<PaginatedUsersResponse>(`/api/users?${qs.toString()}`, {
      method: "GET",
      headers: { accept: "application/json" },
    });
  }, [page, perPage]);

  useEffect(() => {
    let cancelled = false;

    async function run(): Promise<void> {
      setListState({ status: "loading" });
      try {
        const data = await fetchUsersPage();
        if (!cancelled) {
          setListState({ status: "ready", data });
        }
      } catch {
        if (!cancelled) {
          setListState({ status: "error", message: "Não foi possível carregar os usuários." });
        }
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [fetchUsersPage]);

  const loadList = useCallback(async (): Promise<void> => {
    setListState({ status: "loading" });
    try {
      const data = await fetchUsersPage();
      setListState({ status: "ready", data });
    } catch {
      setListState({ status: "error", message: "Não foi possível carregar os usuários." });
    }
  }, [fetchUsersPage]);

  const lastPage = useMemo(() => {
    if (listState.status !== "ready") {
      return 1;
    }
    return Math.max(1, listState.data.meta.last_page);
  }, [listState]);

  function goToPage(next: number): void {
    const p = new URLSearchParams(searchParams?.toString() ?? "");
    p.set("page", String(next));
    p.set("per_page", String(perPage));
    router.replace(`/users?${p.toString()}`);
  }

  function setPerPage(next: number): void {
    const p = new URLSearchParams(searchParams?.toString() ?? "");
    p.set("page", "1");
    p.set("per_page", String(next));
    router.replace(`/users?${p.toString()}`);
  }

  async function submitCreate(body: Record<string, string>): Promise<void> {
    setSaving(true);
    try {
      await fetchJsonOrThrow("/api/users", {
        method: "POST",
        headers: { accept: "application/json", "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      setFormOpen(null);
      await loadList();
    } finally {
      setSaving(false);
    }
  }

  async function submitEdit(body: Record<string, string>): Promise<void> {
    if (formOpen?.user === null || formOpen?.user === undefined) {
      return;
    }
    setSaving(true);
    try {
      await fetchJsonOrThrow(`/api/users/${formOpen.user.id}`, {
        method: "PATCH",
        headers: { accept: "application/json", "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      setFormOpen(null);
      setSelected(null);
      await loadList();
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete(): Promise<void> {
    if (deleteOpen === null) {
      return;
    }
    setDeleting(true);
    try {
      await fetchJsonOrThrow(`/api/users/${deleteOpen.id}`, {
        method: "DELETE",
        headers: { accept: "application/json" },
      });
      setDeleteOpen(null);
      setSelected(null);
      await loadList();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-zinc-50 px-6 py-6 font-sans dark:bg-slate-900">
      <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col gap-4">
        <section className="shrink-0 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-950">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">Usuários</h1>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Gestão de contas (API autenticada). Crie, edite ou remova usuários.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFormOpen({ mode: "create", user: null })}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-medium text-white dark:bg-slate-200 dark:text-slate-950"
            >
              Novo usuário
            </button>
          </div>
        </section>

        {listState.status === "error" ? (
          <div className="shrink-0 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-500/20 dark:bg-red-950/40 dark:text-red-200">
            {listState.message}
          </div>
        ) : null}

        {listState.status === "ready" ? (
          <ScrollableDataTable
            headerTitle="Resultados"
            headerRight={
              <>
                Total:{" "}
                <span className="font-medium text-zinc-900 dark:text-zinc-50">{listState.data.meta.total}</span>
              </>
            }
          >
            <table className="min-w-full text-left text-sm">
              <thead className="sticky top-0 z-10 bg-zinc-50 text-xs text-zinc-600 shadow-[0_1px_0_0] shadow-zinc-200 dark:bg-slate-900 dark:text-zinc-300 dark:shadow-white/10">
                <tr>
                  <th className="px-4 py-3 font-medium">ID</th>
                  <th className="px-4 py-3 font-medium">Nome</th>
                  <th className="px-4 py-3 font-medium">E-mail</th>
                  <th className="px-4 py-3 font-medium">Criado em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-white/10">
                {listState.data.data.map((row) => (
                  <tr
                    key={row.id}
                    tabIndex={0}
                    className={[
                      "cursor-pointer text-zinc-900 transition-colors outline-none hover:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-inset dark:text-zinc-50 dark:hover:bg-slate-900/70 dark:focus-visible:ring-zinc-500",
                      selected?.id === row.id ? "bg-zinc-100 dark:bg-slate-800/90" : "",
                    ].join(" ")}
                    onClick={() => setSelected(row)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelected(row);
                      }
                    }}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-zinc-600 dark:text-zinc-300">{row.id}</td>
                    <td className="px-4 py-3 font-medium">{row.name}</td>
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-200">{row.email}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-zinc-600 dark:text-zinc-300">
                      {formatUserDate(row.created_at)}
                    </td>
                  </tr>
                ))}
                {listState.data.data.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-sm text-zinc-600 dark:text-zinc-400">
                      Nenhum usuário encontrado.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </ScrollableDataTable>
        ) : null}

        {listState.status === "ready" ? (
          <ListPaginationBar
            currentPage={listState.data.meta.current_page}
            lastPage={lastPage}
            total={listState.data.meta.total}
            perPage={perPage}
            perPageOptions={[10, 15, 20, 50]}
            onGoToPage={goToPage}
            onPerPageChange={setPerPage}
          />
        ) : null}

        {listState.status === "loading" || listState.status === "idle" ? (
          <div className="flex min-h-0 flex-1 items-center justify-center rounded-2xl border border-zinc-200 bg-white px-4 py-10 text-center text-sm text-zinc-600 shadow-sm dark:border-white/10 dark:bg-slate-950 dark:text-zinc-400">
            Carregando…
          </div>
        ) : null}

        <UserDetailModal
          user={selected}
          onClose={() => setSelected(null)}
          onEdit={() => {
            if (selected) {
              setFormOpen({ mode: "edit", user: selected });
            }
          }}
          onDelete={() => {
            if (selected) {
              setDeleteOpen(selected);
            }
          }}
        />

        <UserFormModal
          open={formOpen !== null}
          mode={formOpen?.mode ?? "create"}
          initial={formOpen?.user ?? null}
          loading={saving}
          onClose={() => setFormOpen(null)}
          onSubmit={async (body) => {
            if (formOpen?.mode === "create") {
              await submitCreate(body);
            } else {
              await submitEdit(body);
            }
          }}
        />

        <ConfirmDeleteModal
          open={deleteOpen !== null}
          user={deleteOpen}
          loading={deleting}
          onClose={() => setDeleteOpen(null)}
          onConfirm={confirmDelete}
        />
      </div>
    </div>
  );
}
