/** Validações de registro (espelho do contrato Laravel: min 8, email, nome obrigatório). */

export type RegisterFormValues = {
  name: string;
  email: string;
  password: string;
  passwordConfirmation: string;
};

export type RegisterFieldErrors = Partial<Record<keyof RegisterFormValues, string>>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRegisterForm(values: RegisterFormValues): RegisterFieldErrors {
  const errors: RegisterFieldErrors = {};
  const name = values.name.trim();
  const email = values.email.trim();
  const pwd = values.password;
  const confirm = values.passwordConfirmation;

  if (name.length === 0) {
    errors.name = "Informe seu nome.";
  } else if (name.length > 255) {
    errors.name = "O nome deve ter no máximo 255 caracteres.";
  }

  if (email.length === 0) {
    errors.email = "Informe seu e-mail.";
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = "Digite um e-mail válido.";
  } else if (email.length > 255) {
    errors.email = "O e-mail deve ter no máximo 255 caracteres.";
  }

  if (pwd.length === 0) {
    errors.password = "Informe sua senha.";
  } else if (pwd.length < 8) {
    errors.password = "A senha deve ter pelo menos 8 caracteres.";
  }

  if (confirm.length === 0) {
    if (pwd.length > 0) {
      errors.passwordConfirmation = "Confirme sua senha.";
    }
  } else if (pwd !== confirm) {
    errors.passwordConfirmation = "As senhas não coincidem.";
  }

  return errors;
}
