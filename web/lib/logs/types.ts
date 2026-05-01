export type LogLevel =
  | "debug"
  | "info"
  | "notice"
  | "warning"
  | "error"
  | "critical"
  | "alert"
  | "emergency";

export type LogItem = {
  tracking_id: string;
  level: LogLevel | string | null;
  message: string | null;
  context: unknown;
  entity_name: string | null;
  entity_id: string | null;
  source: string | null;
  environment: string | null;
  channel: string | null;
  request_id: string | null;
  trace_id: string | null;
  user_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  exception: unknown;
  received_at: string | null;
  processed_at: string | null;
  created_at: string | null;
};

export type ListLogsResponse = {
  data: LogItem[];
  meta: { total: number; page: number; per_page: number };
};

export type LogsFilters = {
  message?: string;
  level?: LogLevel | "";
  channel?: string;
  source?: string;
  environment?: string;
  entity_name?: string;
  entity_id?: string;
  request_id?: string;
  trace_id?: string;
  user_id?: string;
  tracking_id?: string;
  has_exception?: boolean;
  exception_class?: string;
  received_at_from?: string;
  received_at_to?: string;
};

