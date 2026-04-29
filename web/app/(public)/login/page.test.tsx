import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import LoginPage from "@/app/(public)/login/page";

const replaceMock = vi.fn();

type LoginBody = { login: string; password: string; google2faValidation: string | null };

const performLoginMock = vi.fn<
  (storage: Storage, body: LoginBody) => Promise<unknown>
>();
const verifyAuthenticationMock = vi.fn<(storage: Storage) => Promise<{ status: string }>>();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
}));

vi.mock("@/lib/auth/session", () => ({
  performLogin: (...args: unknown[]) => performLoginMock(...(args as [Storage, LoginBody])),
  verifyAuthentication: (...args: unknown[]) => verifyAuthenticationMock(...(args as [Storage])),
}));

describe("LoginPage (UI)", () => {
  beforeEach(() => {
    replaceMock.mockReset();
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

    performLoginMock.mockResolvedValue({ token: "t", user: { name: "A", email: "a@a.com" } });

    await user.type(screen.getByPlaceholderText("seu@email.com"), "johndoe@example.com");
    await user.type(screen.getByPlaceholderText("••••••••"), "secret");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(performLoginMock).toHaveBeenCalledTimes(1);
    expect(performLoginMock.mock.calls[0]?.[0]).toBe(window.localStorage);
    expect(performLoginMock.mock.calls[0]?.[1]).toEqual({
      login: "johndoe@example.com",
      password: "secret",
      google2faValidation: null,
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
});

