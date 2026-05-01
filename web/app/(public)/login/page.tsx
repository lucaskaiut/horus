import { Suspense } from "react";

import LoginForm from "@/app/(public)/login/login-form";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
