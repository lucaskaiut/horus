import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import SidebarNav from "@/app/(protected)/_components/SidebarNav";

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

describe("SidebarNav (UI)", () => {
  it("deve renderizar os itens de menu", () => {
    render(<SidebarNav currentPath="/logs" />);
    expect(screen.getByRole("navigation", { name: "Menu lateral" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Logs" })).toBeInTheDocument();
  });

  it("deve refletir o estado ativo para a rota atual", () => {
    render(<SidebarNav currentPath="/logs" />);
    const dashboard = screen.getByRole("link", { name: "Dashboard" });
    const logs = screen.getByRole("link", { name: "Logs" });

    expect(dashboard).toHaveAttribute("aria-current", "page");
    expect(logs).toHaveAttribute("aria-current", "page");
  });

  it("não deve marcar como ativo quando fora da rota", () => {
    render(<SidebarNav currentPath="/outra" />);
    const dashboard = screen.getByRole("link", { name: "Dashboard" });
    const logs = screen.getByRole("link", { name: "Logs" });

    expect(dashboard).not.toHaveAttribute("aria-current");
    expect(logs).not.toHaveAttribute("aria-current");
  });
});

