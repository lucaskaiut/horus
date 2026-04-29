export type LoginRequestBody = {
  login: string;
  password: string;
  google2faValidation: string | null;
};

export type AuthenticatedUser = {
  name: string;
  email: string;
};

export type LoginSuccess = {
  token: string;
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

