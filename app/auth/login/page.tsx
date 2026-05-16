import { Suspense } from "react";
import { redirect } from "next/navigation";

import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";
import { normalizeNextPath } from "@/lib/auth/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function LoginPage({
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
      <AuthCard title="Connexion" description="Connecte-toi avec ton email et ton mot de passe.">
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </AuthCard>
    </div>
  );
}
