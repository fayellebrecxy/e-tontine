import { Suspense } from "react";

import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="flex justify-center">
      <AuthCard title="Connexion" description="Connecte-toi avec ton email et ton mot de passe.">
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </AuthCard>
    </div>
  );
}
