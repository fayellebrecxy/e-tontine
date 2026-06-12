import { Suspense } from "react";
import { redirect } from "next/navigation";

import { AuthCard } from "@/components/auth/auth-card";
import { RegisterForm } from "@/components/auth/register-form";
import { normalizeNextPath } from "@/lib/auth/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function RegisterPage({
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
    <AuthCard
      title="Créer un compte"
      description="Ton compte donne accès à tes groupes de tontine."
    >
      <Suspense fallback={null}>
        <RegisterForm />
      </Suspense>
    </AuthCard>
  );
}
