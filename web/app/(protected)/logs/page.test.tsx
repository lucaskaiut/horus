import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import LogsPage from "@/app/(protected)/logs/page";

const replaceMock = vi.fn();
const useSearchParamsMock = vi.fn<[], URLSearchParams>();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
  useSearchParams: () => useSearchParamsMock(),
}));

describe("LogsPage (UI)", () => {
  beforeEach(() => {
    replaceMock.mockReset();
    useSearchParamsMock.mockReset();
    useSearchParamsMock.mockReturnValue(new URLSearchParams("page=1&per_page=50&sort=received_at&order=desc"));
  });

  it("deve renderizar o título e carregar dados", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: [
              {
                tracking_id: "t1",
                level: "error",
                message: "boom",
                context: null,
                entity_name: "order",
                entity_id: "123",
                source: "billing",
                environment: "production",
                channel: "http",
                request_id: null,
                trace_id: null,
                user_id: null,
                ip_address: null,
                user_agent: null,
                exception: { class: "RuntimeException", message: "x" },
                received_at: "2026-04-29T09:00:00+00:00",
                processed_at: null,
                created_at: "2026-04-29T09:00:00+00:00",
              },
            ],
            meta: { total: 1, page: 1, per_page: 50 },
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      ),
    );

    render(<LogsPage />);
    expect(screen.getByRole("heading", { name: "Logs" })).toBeInTheDocument();
    expect(await screen.findByText("boom")).toBeInTheDocument();
    expect(screen.getByText("order:123")).toBeInTheDocument();
  });

  it("deve aplicar filtros e atualizar a URL", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: [], meta: { total: 0, page: 1, per_page: 50 } }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      ),
    );

    render(<LogsPage />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Filtros" }));
    expect(screen.getByRole("dialog", { name: "Filtros" })).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("Ex: timeout, exception…"), "timeout");
    await user.selectOptions(screen.getByLabelText("Nível"), "error");
    await user.click(screen.getByRole("button", { name: "Aplicar" }));

    expect(replaceMock).toHaveBeenCalledTimes(1);
    const url = replaceMock.mock.calls[0]?.[0] as string;
    expect(url).toContain("/logs?");
    expect(url).toContain("filters%5Bmessage%5D=timeout");
    expect(url).toContain("filters%5Blevel%5D=error");
  });

  it("deve navegar para próxima página", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: [],
            meta: { total: 120, page: 1, per_page: 50 },
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      ),
    );

    render(<LogsPage />);
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "Próxima" }));

    expect(replaceMock).toHaveBeenCalledTimes(1);
    const url = replaceMock.mock.calls[0]?.[0] as string;
    expect(url).toContain("page=2");
    expect(url).toContain("per_page=50");
  });

  it("deve navegar ao clicar no número da página", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: [],
            meta: { total: 260, page: 1, per_page: 50 },
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      ),
    );

    render(<LogsPage />);
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "3" }));

    expect(replaceMock).toHaveBeenCalledTimes(1);
    const url = replaceMock.mock.calls[0]?.[0] as string;
    expect(url).toContain("page=3");
  });

  it("deve alterar itens por página e resetar página para 1", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({
              data: [],
              meta: { total: 120, page: 3, per_page: 50 },
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          ),
        ),
      ),
    );

    useSearchParamsMock.mockReturnValue(new URLSearchParams("page=3&per_page=50&sort=received_at&order=desc"));

    render(<LogsPage />);
    const select = await screen.findByRole("combobox", { name: "Itens por página" });
    fireEvent.change(select, { target: { value: "20" } });

    await waitFor(() => expect(replaceMock).toHaveBeenCalledTimes(1));
    const url = replaceMock.mock.calls[0]?.[0] as string;
    expect(url).toContain("page=1");
    expect(url).toContain("per_page=20");
  });
});

