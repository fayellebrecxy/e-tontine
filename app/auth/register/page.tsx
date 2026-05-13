import { Suspense } from "react";

import { AuthCard } from "@/components/auth/auth-card";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <div className="flex justify-center">
      <AuthCard
        title="Créer un compte"
        description="Ton compte donne accès à tes groupes de tontine."
      >
        <Suspense fallback={null}>
          <RegisterForm />
        </Suspense>
      </AuthCard>
    </div>
  );
}
