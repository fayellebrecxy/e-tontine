import { AuthCard } from "@/components/auth/auth-card";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <div className="flex justify-center">
      <AuthCard
        title="Réinitialiser le mot de passe"
        description="Reçois un lien sécurisé à ton adresse email."
      >
        <ResetPasswordForm />
      </AuthCard>
    </div>
  );
}
