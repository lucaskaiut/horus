import type { LogsFilters } from "@/lib/logs/types";

function setIfNonEmpty(params: URLSearchParams, key: string, value: string | undefined): void {
  if (typeof value !== "string") {
    return;
  }
  const v = value.trim();
  if (v.length === 0) {
    return;
  }
  params.set(key, v);
}

export function buildLogsSearchParams(input: {
  page: number;
  per_page: number;
  sort: "received_at" | "processed_at" | "created_at";
  order: "asc" | "desc";
  filters: LogsFilters;
}): URLSearchParams {
  const params = new URLSearchParams();

  params.set("page", String(input.page));
  params.set("per_page", String(input.per_page));
  params.set("sort", input.sort);
  params.set("order", input.order);

  setIfNonEmpty(params, "filters[message]", input.filters.message);
  setIfNonEmpty(params, "filters[level]", input.filters.level);
  setIfNonEmpty(params, "filters[channel]", input.filters.channel);
  setIfNonEmpty(params, "filters[source]", input.filters.source);
  setIfNonEmpty(params, "filters[environment]", input.filters.environment);
  setIfNonEmpty(params, "filters[entity_name]", input.filters.entity_name);
  setIfNonEmpty(params, "filters[entity_id]", input.filters.entity_id);
  setIfNonEmpty(params, "filters[request_id]", input.filters.request_id);
  setIfNonEmpty(params, "filters[trace_id]", input.filters.trace_id);
  setIfNonEmpty(params, "filters[user_id]", input.filters.user_id);
  setIfNonEmpty(params, "filters[tracking_id]", input.filters.tracking_id);
  setIfNonEmpty(params, "filters[exception_class]", input.filters.exception_class);

  if (typeof input.filters.has_exception === "boolean") {
    params.set("filters[has_exception]", input.filters.has_exception ? "1" : "0");
  }

  setIfNonEmpty(params, "filters[received_at][from]", input.filters.received_at_from);
  setIfNonEmpty(params, "filters[received_at][to]", input.filters.received_at_to);

  return params;
}

export function parseLogsFiltersFromSearchParams(params: URLSearchParams): LogsFilters {
  const hasExceptionRaw = params.get("filters[has_exception]");
  const has_exception =
    hasExceptionRaw === null
      ? undefined
      : hasExceptionRaw === "1" || hasExceptionRaw.toLowerCase() === "true";

  return {
    message: params.get("filters[message]") ?? undefined,
    level: (params.get("filters[level]") ?? undefined) as LogsFilters["level"],
    channel: params.get("filters[channel]") ?? undefined,
    source: params.get("filters[source]") ?? undefined,
    environment: params.get("filters[environment]") ?? undefined,
    entity_name: params.get("filters[entity_name]") ?? undefined,
    entity_id: params.get("filters[entity_id]") ?? undefined,
    request_id: params.get("filters[request_id]") ?? undefined,
    trace_id: params.get("filters[trace_id]") ?? undefined,
    user_id: params.get("filters[user_id]") ?? undefined,
    tracking_id: params.get("filters[tracking_id]") ?? undefined,
    has_exception,
    exception_class: params.get("filters[exception_class]") ?? undefined,
    received_at_from: params.get("filters[received_at][from]") ?? undefined,
    received_at_to: params.get("filters[received_at][to]") ?? undefined,
  };
}

