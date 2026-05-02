import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import UsersPage from "@/app/(protected)/users/page";

const replaceMock = vi.fn();
const useSearchParamsMock = vi.fn<[], URLSearchParams>();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
  useSearchParams: () => useSearchParamsMock(),
}));

type UserRow = {
  id: number;
  name: string;
  email: string;
  created_at: string | null;
  updated_at: string | null;
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function paginated(
  users: UserRow[],
  meta: Partial<{ current_page: number; last_page: number; per_page: number; total: number }> = {},
) {
  const per_page = meta.per_page ?? 20;
  const total = meta.total ?? users.length;
  const current_page = meta.current_page ?? 1;
  const last_page = meta.last_page ?? 1;
  return {
    data: users,
    links: {},
    meta: { current_page, last_page, per_page, total },
  };
}

function normalizeFetchUrl(input: RequestInfo | URL): string {
  const raw = typeof input === "string" ? input : input instanceof Request ? input.url : String(input);
  const u = new URL(raw, "http://localhost");
  return `${u.pathname}${u.search}`;
}

describe("UsersPage (UI)", () => {
  beforeEach(() => {
    replaceMock.mockReset();
    useSearchParamsMock.mockReset();
    useSearchParamsMock.mockReturnValue(new URLSearchParams("page=1&per_page=20"));
  });

  it("deve renderizar o título e listar usuários", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(
          paginated([
            {
              id: 1,
              name: "Ana Silva",
              email: "ana@example.com",
              created_at: "2026-01-10T12:00:00.000Z",
              updated_at: "2026-01-10T12:00:00.000Z",
            },
          ]),
        ),
      ),
    );

    render(<UsersPage />);
    expect(screen.getByRole("heading", { name: "Usuários" })).toBeInTheDocument();
    expect(await screen.findByText("Ana Silva")).toBeInTheDocument();
    expect(screen.getByText("ana@example.com")).toBeInTheDocument();
  });

  it("deve exibir mensagem quando o carregamento falha", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ message: "Unauthorized" }, 401)));

    render(<UsersPage />);
    expect(await screen.findByText(/Não foi possível carregar os usuários/)).toBeInTheDocument();
  });

  it("deve exibir estado vazio quando não há usuários", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(paginated([], { total: 0, last_page: 1 }))));

    render(<UsersPage />);
    expect(await screen.findByText("Nenhum usuário encontrado.")).toBeInTheDocument();
  });

  it("deve abrir detalhe ao clicar na linha e fechar", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(
          paginated([
            {
              id: 1,
              name: "Ana Silva",
              email: "ana@example.com",
              created_at: "2026-01-10T12:00:00.000Z",
              updated_at: "2026-01-10T12:00:00.000Z",
            },
          ]),
        ),
      ),
    );

    render(<UsersPage />);
    const user = userEvent.setup();
    await screen.findByText("Ana Silva");

    await user.click(screen.getByText("Ana Silva"));

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByRole("heading", { name: "Ana Silva" })).toBeInTheDocument();
    expect(within(dialog).getByText("ana@example.com")).toBeInTheDocument();

    await user.click(within(dialog).getByText("✕"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("deve navegar para a próxima página", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(
          paginated([], {
            total: 80,
            current_page: 1,
            last_page: 4,
            per_page: 20,
          }),
        ),
      ),
    );

    render(<UsersPage />);
    const user = userEvent.setup();
    await screen.findByRole("button", { name: "Próxima" });

    await user.click(screen.getByRole("button", { name: "Próxima" }));

    expect(replaceMock).toHaveBeenCalledTimes(1);
    const url = replaceMock.mock.calls[0]?.[0] as string;
    expect(url).toContain("/users?");
    expect(url).toContain("page=2");
    expect(url).toContain("per_page=20");
  });

  it("deve alterar itens por página e voltar para página 1", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(
          paginated([], {
            total: 100,
            current_page: 3,
            last_page: 5,
            per_page: 20,
          }),
        ),
      ),
    );

    useSearchParamsMock.mockReturnValue(new URLSearchParams("page=3&per_page=20"));

    render(<UsersPage />);
    const select = await screen.findByRole("combobox", { name: "Itens por página" });
    fireEvent.change(select, { target: { value: "10" } });

    await waitFor(() => expect(replaceMock).toHaveBeenCalledTimes(1));
    const url = replaceMock.mock.calls[0]?.[0] as string;
    expect(url).toContain("page=1");
    expect(url).toContain("per_page=10");
  });

  it("deve criar usuário e atualizar a lista", async () => {
    const rows: UserRow[] = [
      {
        id: 1,
        name: "Ana Silva",
        email: "ana@example.com",
        created_at: "2026-01-10T12:00:00.000Z",
        updated_at: "2026-01-10T12:00:00.000Z",
      },
    ];

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const method = (init?.method ?? "GET").toUpperCase();
      const full = normalizeFetchUrl(input);

      if (method === "GET" && full.startsWith("/api/users?")) {
        return jsonResponse(
          paginated(rows, {
            current_page: 1,
            last_page: 1,
            per_page: 20,
            total: rows.length,
          }),
        );
      }

      if (method === "POST" && full === "/api/users") {
        const body = JSON.parse((init?.body as string) ?? "{}") as { name: string; email: string };
        rows.push({
          id: 2,
          name: body.name,
          email: body.email,
          created_at: null,
          updated_at: null,
        });
        return jsonResponse({ data: rows[rows.length - 1] }, 201);
      }

      return jsonResponse({ message: "unexpected" }, 500);
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<UsersPage />);
    const user = userEvent.setup();
    await screen.findByText("Ana Silva");

    await user.click(screen.getByRole("button", { name: "Novo usuário" }));

    const formHeading = await screen.findByRole("heading", { name: "Novo usuário" });
    const dialog = formHeading.closest('[role="dialog"]') as HTMLElement;

    await user.type(within(dialog).getByLabelText("Nome"), "Bob Costa");
    await user.type(within(dialog).getByLabelText("E-mail"), "bob@example.com");
    await user.type(within(dialog).getByLabelText(/^Senha$/), "secret123");
    await user.type(within(dialog).getByLabelText("Confirmar senha"), "secret123");

    await user.click(within(dialog).getByRole("button", { name: "Salvar" }));

    await waitFor(() => expect(screen.queryByRole("heading", { name: "Novo usuário" })).not.toBeInTheDocument());
    expect(await screen.findByText("Bob Costa")).toBeInTheDocument();

    const postCalls = fetchMock.mock.calls.filter((c) => (c[1]?.method ?? "GET").toUpperCase() === "POST");
    expect(postCalls.length).toBeGreaterThanOrEqual(1);
    const postBody = JSON.parse((postCalls[0]?.[1]?.body as string) ?? "{}") as Record<string, string>;
    expect(postBody.name).toBe("Bob Costa");
    expect(postBody.email).toBe("bob@example.com");
    expect(postBody.password).toBe("secret123");
  });

  it("deve validar senha obrigatória ao criar", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(
          paginated([
            {
              id: 1,
              name: "Ana",
              email: "ana@example.com",
              created_at: null,
              updated_at: null,
            },
          ]),
        ),
      ),
    );

    render(<UsersPage />);
    const user = userEvent.setup();
    await screen.findByText("Ana");

    await user.click(screen.getByRole("button", { name: "Novo usuário" }));
    const dialog = (await screen.findByRole("heading", { name: "Novo usuário" })).closest(
      '[role="dialog"]',
    ) as HTMLElement;

    await user.type(within(dialog).getByLabelText("Nome"), "Sem Senha");
    await user.type(within(dialog).getByLabelText("E-mail"), "sem@example.com");
    await user.click(within(dialog).getByRole("button", { name: "Salvar" }));

    expect(await within(dialog).findByText(/Informe a senha para o novo usuário/)).toBeInTheDocument();
  });

  it("deve editar usuário a partir do detalhe", async () => {
    const rows: UserRow[] = [
      {
        id: 1,
        name: "Ana Silva",
        email: "ana@example.com",
        created_at: "2026-01-10T12:00:00.000Z",
        updated_at: "2026-01-10T12:00:00.000Z",
      },
    ];

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const method = (init?.method ?? "GET").toUpperCase();
      const full = normalizeFetchUrl(input);

      if (method === "GET" && full.startsWith("/api/users?")) {
        return jsonResponse(
          paginated(rows, {
            current_page: 1,
            last_page: 1,
            per_page: 20,
            total: rows.length,
          }),
        );
      }

      if (method === "PATCH" && full.startsWith("/api/users/1")) {
        const body = JSON.parse((init?.body as string) ?? "{}") as { name?: string };
        if (body.name) {
          rows[0] = { ...rows[0], name: body.name };
        }
        return jsonResponse({ data: rows[0] }, 200);
      }

      return jsonResponse({ message: "unexpected" }, 500);
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<UsersPage />);
    const user = userEvent.setup();
    await screen.findByText("Ana Silva");
    await user.click(screen.getByText("Ana Silva"));

    const detail = screen.getByRole("dialog");
    await user.click(within(detail).getByRole("button", { name: "Editar" }));

    const editHeading = await screen.findByRole("heading", { name: "Editar usuário" });
    const form = editHeading.closest('[role="dialog"]') as HTMLElement;

    const nameInput = within(form).getByLabelText("Nome");
    await user.clear(nameInput);
    await user.type(nameInput, "Ana Atualizada");
    await user.click(within(form).getByRole("button", { name: "Salvar" }));

    await waitFor(() => expect(screen.queryByRole("heading", { name: "Editar usuário" })).not.toBeInTheDocument());
    expect(await screen.findByText("Ana Atualizada")).toBeInTheDocument();

    const patchCalls = fetchMock.mock.calls.filter((c) => (c[1]?.method ?? "GET").toUpperCase() === "PATCH");
    expect(patchCalls.length).toBeGreaterThanOrEqual(1);
  });

  it("deve excluir usuário com confirmação", async () => {
    const rows: UserRow[] = [
      {
        id: 1,
        name: "Ana Silva",
        email: "ana@example.com",
        created_at: null,
        updated_at: null,
      },
    ];

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const method = (init?.method ?? "GET").toUpperCase();
      const full = normalizeFetchUrl(input);

      if (method === "GET" && full.startsWith("/api/users?")) {
        return jsonResponse(
          paginated(rows, {
            current_page: 1,
            last_page: 1,
            per_page: 20,
            total: rows.length,
          }),
        );
      }

      if (method === "DELETE" && full.startsWith("/api/users/1")) {
        rows.splice(0, 1);
        return jsonResponse({ message: "ok" }, 200);
      }

      return jsonResponse({ message: "unexpected" }, 500);
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<UsersPage />);
    const user = userEvent.setup();
    await screen.findByText("Ana Silva");
    await user.click(screen.getByText("Ana Silva"));

    const detail = screen.getByRole("dialog");
    await user.click(within(detail).getByRole("button", { name: "Excluir" }));

    const confirm = await screen.findByRole("heading", { name: "Remover usuário" });
    const confirmDialog = confirm.closest('[role="dialog"]') as HTMLElement;
    await user.click(within(confirmDialog).getByRole("button", { name: "Remover" }));

    await waitFor(() => expect(screen.queryByText("Ana Silva")).not.toBeInTheDocument());
    expect(await screen.findByText("Nenhum usuário encontrado.")).toBeInTheDocument();

    const deleteCalls = fetchMock.mock.calls.filter((c) => (c[1]?.method ?? "GET").toUpperCase() === "DELETE");
    expect(deleteCalls.length).toBeGreaterThanOrEqual(1);
  });

  it("deve mostrar erro de validação do servidor ao criar", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const method = (init?.method ?? "GET").toUpperCase();
        const full = normalizeFetchUrl(input);

        if (method === "GET" && full.startsWith("/api/users?")) {
          return jsonResponse(
            paginated([
              {
                id: 1,
                name: "Ana",
                email: "ana@example.com",
                created_at: null,
                updated_at: null,
              },
            ]),
          );
        }

        if (method === "POST" && full === "/api/users") {
          return jsonResponse({ errors: { email: ["The email has already been taken."] } }, 422);
        }

        return jsonResponse({ message: "unexpected" }, 500);
      }),
    );

    render(<UsersPage />);
    const user = userEvent.setup();
    await screen.findByText("Ana");

    await user.click(screen.getByRole("button", { name: "Novo usuário" }));
    const dialog = (await screen.findByRole("heading", { name: "Novo usuário" })).closest(
      '[role="dialog"]',
    ) as HTMLElement;

    await user.type(within(dialog).getByLabelText("Nome"), "X");
    await user.type(within(dialog).getByLabelText("E-mail"), "dup@example.com");
    await user.type(within(dialog).getByLabelText(/^Senha$/), "secret123");
    await user.type(within(dialog).getByLabelText("Confirmar senha"), "secret123");
    await user.click(within(dialog).getByRole("button", { name: "Salvar" }));

    expect(await within(dialog).findByText("The email has already been taken.")).toBeInTheDocument();
  });
});
