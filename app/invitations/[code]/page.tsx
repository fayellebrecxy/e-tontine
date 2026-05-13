import Link from "next/link";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { JoinInvitationForm } from "@/components/invitations/join-invitation-form";
import { Button } from "@/components/ui/button";

export default async function InvitationJoinPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const supabase = await createSupabaseServerClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  if (!user) {
    const next = `/invitations/${encodeURIComponent(code)}`;
    const nextParam = encodeURIComponent(next);
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Invitation</h1>
          <p className="text-muted-foreground">
            Connectez-vous ou créez un compte pour rejoindre le groupe.
          </p>
        </div>

        <div className="flex gap-2">
          <Button asChild>
            <Link href={`/auth/login?next=${nextParam}`}>Se connecter</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/auth/register?next=${nextParam}`}>Créer un compte</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Invitation</h1>
        <p className="text-muted-foreground">Vous êtes connecté. Complétez vos informations.</p>
      </div>

      <JoinInvitationForm code={code} />
    </div>
  );
}
