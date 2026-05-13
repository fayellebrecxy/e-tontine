"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const joinInvitationFormSchema = z.object({
  nom: z.string().trim().min(2).max(64),
  prenom: z.string().trim().min(2).max(64),
  telephone: z.string().trim().min(8).max(24),
  photo_de_profil: z.string().trim().max(1024).optional(),
});

type Values = z.infer<typeof joinInvitationFormSchema>;

type Props = {
  code: string;
};

export function JoinInvitationForm({ code }: Props) {
  const router = useRouter();
  const form = useForm<Values>({
    resolver: zodResolver(joinInvitationFormSchema),
    defaultValues: { nom: "", prenom: "", telephone: "", photo_de_profil: "" },
    mode: "onSubmit",
  });

  const [pending, startTransition] = React.useTransition();

  const onSubmit = (values: Values) => {
    startTransition(async () => {
      const payload: Record<string, unknown> = {
        nom: values.nom,
        prenom: values.prenom,
        telephone: values.telephone,
      };

      const photo = values.photo_de_profil?.trim();
      if (photo) payload.photo_de_profil = photo;

      const res = await fetch(`/api/invitations/${encodeURIComponent(code)}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = (await res.json().catch(() => null)) as null | { ok?: boolean; error?: string };

      if (!res.ok) {
        toast.error(body?.error ?? "Erreur lors de l’adhésion au groupe.");
        return;
      }

      toast.success("Vous avez rejoint le groupe.");
      router.push("/dashboard");
      router.refresh();
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rejoindre le groupe</CardTitle>
        <CardDescription>Complétez vos informations pour rejoindre le groupe.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom</FormLabel>
                  <FormControl>
                    <Input autoComplete="family-name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="prenom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prénom</FormLabel>
                  <FormControl>
                    <Input autoComplete="given-name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="telephone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Téléphone</FormLabel>
                  <FormControl>
                    <Input type="tel" autoComplete="tel" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="photo_de_profil"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Photo de profil (URL) (optionnel)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." autoComplete="url" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={pending}>
              {pending ? "Validation..." : "Rejoindre"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
