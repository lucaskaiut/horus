import { buildLogsSearchParams } from "./query";

export function logsHrefForDashboardPeriod(from: string, to: string): string {
  const params = buildLogsSearchParams({
    page: 1,
    per_page: 50,
    sort: "received_at",
    order: "desc",
    filters: {
      received_at_from: from,
      received_at_to: to,
    },
  });

  return `/logs?${params.toString()}`;
}
