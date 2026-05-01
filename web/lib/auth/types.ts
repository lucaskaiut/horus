export type LoginChannel = "internal";

export type LoginRequestBody = {
  channel: "internal";
  payload: { email: string; password: string };
};

export type AuthenticatedUser = {
  name: string;
  email: string;
};

export type LoginSuccess = {
  user: AuthenticatedUser;
};

export type MeSuccess = {
  user: AuthenticatedUser;
};

export type ApiErrorPayload =
  | { message: string }
  | { errors: Record<string, string[] | string> }
  | { error: string }
  | { [key: string]: unknown };

