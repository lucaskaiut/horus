import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import SidebarNavItems from "@/app/(protected)/_components/SidebarNavItems";

const usePathnameMock = vi.fn<[], string | null>();

vi.mock("next/link", () => ({
  default: ({
    href,
    className,
    children,
    ...rest
  }: {
    href: string;
    className?: string;
    children: React.ReactNode;
  }) => (
    <a href={href} className={className} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => usePathnameMock(),
}));

const ITEMS = [
  { id: "dashboard", label: "Dashboard", href: "/" },
  { id: "logs", label: "Logs", href: "/logs" },
];

describe("SidebarNavItems (UI)", () => {
  it("deve renderizar os itens de menu", () => {
    usePathnameMock.mockReturnValue("/logs");
    render(<SidebarNavItems items={ITEMS} />);
    expect(screen.getByRole("navigation", { name: "Menu lateral" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Logs" })).toBeInTheDocument();
  });

  it("deve refletir o estado ativo para a rota atual", () => {
    usePathnameMock.mockReturnValue("/logs");
    render(<SidebarNavItems items={ITEMS} />);
    const dashboard = screen.getByRole("link", { name: "Dashboard" });
    const logs = screen.getByRole("link", { name: "Logs" });

    expect(logs).toHaveAttribute("aria-current", "page");
    expect(dashboard).not.toHaveAttribute("aria-current");
  });

  it("deve marcar dashboard como ativo apenas na raiz", () => {
    usePathnameMock.mockReturnValue("/");
    render(<SidebarNavItems items={ITEMS} />);
    const dashboard = screen.getByRole("link", { name: "Dashboard" });
    const logs = screen.getByRole("link", { name: "Logs" });

    expect(dashboard).toHaveAttribute("aria-current", "page");
    expect(logs).not.toHaveAttribute("aria-current");
  });

  it("deve tratar barra final como a mesma rota", () => {
    usePathnameMock.mockReturnValue("/logs/");
    render(<SidebarNavItems items={ITEMS} />);
    const dashboard = screen.getByRole("link", { name: "Dashboard" });
    const logs = screen.getByRole("link", { name: "Logs" });

    expect(logs).toHaveAttribute("aria-current", "page");
    expect(dashboard).not.toHaveAttribute("aria-current");
  });

  it("não deve marcar como ativo quando fora da rota", () => {
    usePathnameMock.mockReturnValue("/outra");
    render(<SidebarNavItems items={ITEMS} />);
    const dashboard = screen.getByRole("link", { name: "Dashboard" });
    const logs = screen.getByRole("link", { name: "Logs" });

    expect(dashboard).not.toHaveAttribute("aria-current");
    expect(logs).not.toHaveAttribute("aria-current");
  });
});
