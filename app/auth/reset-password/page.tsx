import { redirect } from "next/navigation";

import { AuthCard } from "@/components/auth/auth-card";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { normalizeNextPath } from "@/lib/auth/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  const { next } = await searchParams;

  if (user) {
    redirect(normalizeNextPath(next));
  }

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
