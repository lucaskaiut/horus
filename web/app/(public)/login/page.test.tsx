import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import LoginPage from "@/app/(public)/login/page";

const replaceMock = vi.fn();
const refreshMock = vi.fn();

const searchParamsGetMock = vi.fn(() => null);

type LoginBody = { channel: "internal"; payload: { email: string; password: string } };

const performLoginMock = vi.fn<(body: LoginBody) => Promise<unknown>>();
const verifyAuthenticationMock = vi.fn<() => Promise<{ status: string }>>();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock, refresh: refreshMock }),
  useSearchParams: () => ({
    get: searchParamsGetMock,
  }),
}));

vi.mock("@/lib/auth/session", () => ({
  performLogin: (...args: unknown[]) => performLoginMock(...(args as [LoginBody])),
  verifyAuthentication: (...args: unknown[]) => verifyAuthenticationMock(...args),
}));

describe("LoginPage (UI)", () => {
  beforeEach(() => {
    replaceMock.mockReset();
    refreshMock.mockReset();
    searchParamsGetMock.mockReset();
    searchParamsGetMock.mockReturnValue(null);
    performLoginMock.mockReset();
    verifyAuthenticationMock.mockReset();
    verifyAuthenticationMock.mockResolvedValue({ status: "unauthenticated" });
  });

  it("deve renderizar o formulário de login", () => {
    render(<LoginPage />);
    expect(screen.getByRole("heading", { name: "Entrar" })).toBeInTheDocument();
  });

  it("deve exibir campo de e-mail", () => {
    render(<LoginPage />);
    expect(screen.getByPlaceholderText("seu@email.com")).toBeInTheDocument();
  });

  it("deve exibir campo de senha", () => {
    render(<LoginPage />);
    expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();
  });

  it("deve exibir botão de entrar", () => {
    render(<LoginPage />);
    expect(screen.getByRole("button", { name: "Entrar" })).toBeInTheDocument();
  });

  it("deve permitir preencher e-mail e senha", async () => {
    render(<LoginPage />);
    const user = userEvent.setup();

    const email = screen.getByPlaceholderText("seu@email.com");
    const password = screen.getByPlaceholderText("••••••••");

    await user.type(email, "johndoe@example.com");
    await user.type(password, "secret");

    expect(email).toHaveValue("johndoe@example.com");
    expect(password).toHaveValue("secret");
  });

  it("deve chamar a função de login ao submeter o formulário", async () => {
    render(<LoginPage />);
    const user = userEvent.setup();

    performLoginMock.mockResolvedValue({ user: { name: "A", email: "a@a.com" } });

    await user.type(screen.getByPlaceholderText("seu@email.com"), "johndoe@example.com");
    await user.type(screen.getByPlaceholderText("••••••••"), "secret");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(performLoginMock).toHaveBeenCalledTimes(1);
    expect(performLoginMock.mock.calls[0]?.[0]).toEqual({
      channel: "internal",
      payload: {
        email: "johndoe@example.com",
        password: "secret",
      },
    });

    expect(replaceMock).toHaveBeenCalledWith("/");
  });

  it("deve exibir mensagem de erro quando a autenticação falhar", async () => {
    render(<LoginPage />);
    const user = userEvent.setup();

    performLoginMock.mockRejectedValue(new Error("invalid"));

    await user.type(screen.getByPlaceholderText("seu@email.com"), "johndoe@example.com");
    await user.type(screen.getByPlaceholderText("••••••••"), "wrong");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(
      await screen.findByText("Não foi possível autenticar. Verifique suas credenciais."),
    ).toBeInTheDocument();
  });

  it("deve exibir link para criar conta", () => {
    render(<LoginPage />);
    expect(screen.getByRole("link", { name: "Criar conta" })).toHaveAttribute("href", "/register");
  });

  it("deve exibir feedback de cadastro quando query registered estiver definida", () => {
    searchParamsGetMock.mockImplementation((key: string) => (key === "registered" ? "1" : null));
    render(<LoginPage />);
    expect(
      screen.getByText(/Cadastro concluído com sucesso/i),
    ).toBeInTheDocument();
  });
});

