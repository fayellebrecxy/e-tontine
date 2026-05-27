import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { JoinInvitationForm } from "@/components/invitations/join-invitation-form";
import { QuickJoinInvitationCard } from "@/components/invitations/quick-join-invitation-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function InvitationJoinPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const invitation = await prisma.invitationGroupe.findFirst({
    where: { code, date_revocation: null },
    include: {
      groupe: {
        select: { nom: true, description: true },
      },
    },
  });

  const fallbackGroup = invitation
    ? null
    : await prisma.groupes.findUnique({
        where: { lien_invitation: code },
        select: { nom: true, description: true },
      });

  const groupe = invitation?.groupe ?? fallbackGroup;

  if (!groupe) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardHeader>
          <CardTitle>Invitation invalide</CardTitle>
          <CardDescription>
            Ce lien d&apos;invitation est invalide ou a été révoqué.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/dashboard">Retour au tableau de bord</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const supabase = await createSupabaseServerClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  if (!user) {
    const next = `/invitations/${encodeURIComponent(code)}`;
    const nextParam = encodeURIComponent(next);

    return (
      <Card className="mx-auto max-w-lg">
        <CardHeader>
          <CardTitle>Rejoindre le groupe {groupe.nom}</CardTitle>
          <CardDescription>
            {groupe.description ? (
              <span className="block mb-2 italic">&ldquo;{groupe.description}&rdquo;</span>
            ) : null}
            Vous avez reçu une invitation. Connectez-vous ou créez un compte pour continuer.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href={`/auth/login?next=${nextParam}`}>Se connecter</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/auth/register?next=${nextParam}`}>Créer un compte</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const dbUser = await prisma.user.findUnique({
    where: { id_user: user.id },
    select: { nom: true, prenom: true, telephone: true },
  });
  const profileComplete = Boolean(
    dbUser?.nom.trim() && dbUser?.prenom.trim() && dbUser?.telephone.trim(),
  );

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
          Invitation au groupe {groupe.nom}
        </h1>
        {groupe.description && (
          <p className="mt-1 text-sm text-muted-foreground italic">
            &ldquo;{groupe.description}&rdquo;
          </p>
        )}
        <p className="mt-2 text-sm text-muted-foreground">
          {profileComplete
            ? "Votre profil est complet. Vous pouvez rejoindre le groupe."
            : "Complétez votre profil pour finaliser votre adhésion."}
        </p>
      </div>

      {profileComplete ? (
        <QuickJoinInvitationCard code={code} />
      ) : (
        <JoinInvitationForm code={code} />
      )}
    </div>
  );
}
