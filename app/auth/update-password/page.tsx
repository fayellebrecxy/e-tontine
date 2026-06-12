import { redirect } from "next/navigation";

import { AuthCard } from "@/components/auth/auth-card";
import { UpdatePasswordForm } from "@/components/auth/update-password-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function UpdatePasswordPage() {
  const supabase = await createSupabaseServerClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <AuthCard
      title="Nouveau mot de passe"
      description="Choisis un nouveau mot de passe pour ton compte."
      showImage={false}
    >
      <UpdatePasswordForm />
    </AuthCard>
  );
}
