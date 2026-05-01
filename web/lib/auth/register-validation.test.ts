import { describe, expect, it } from "vitest";

import { validateRegisterForm } from "@/lib/auth/register-validation";

describe("validateRegisterForm", () => {
  it("exige nome, email, senha mínima e confirmação", () => {
    const err = validateRegisterForm({
      name: "",
      email: "",
      password: "",
      passwordConfirmation: "",
    });
    expect(err.name).toBeDefined();
    expect(err.email).toBeDefined();
    expect(err.password).toBeDefined();
    expect(err.passwordConfirmation).toBeUndefined();
  });

  it("exige que as senhas coincidam", () => {
    const err = validateRegisterForm({
      name: "A",
      email: "a@b.co",
      password: "secret12",
      passwordConfirmation: "other12",
    });
    expect(err.passwordConfirmation).toBe("As senhas não coincidem.");
  });
});
