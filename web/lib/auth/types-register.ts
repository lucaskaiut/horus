/** Corpo para POST /api/auth/register → repasse para Laravel POST /register */

export type RegisterRequestBody = {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
};

export type RegisterSuccessBody = {
  data: {
    id: string;
    name: string;
    email: string;
  };
};
