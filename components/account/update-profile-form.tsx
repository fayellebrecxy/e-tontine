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

const profileFormSchema = z.object({
  nom: z.string().trim().min(2, "Le nom doit contenir au moins 2 caractères.").max(64),
  prenom: z.string().trim().min(2, "Le prénom doit contenir au moins 2 caractères.").max(64),
  telephone: z
    .string()
    .trim()
    .min(8, "Le numéro de téléphone doit contenir au moins 8 caractères.")
    .max(24, "Le numéro de téléphone est trop long."),
  photo_de_profil: z.string().trim().max(1024).optional(),
});

type Values = z.infer<typeof profileFormSchema>;

type Props = {
  initial: {
    nom: string;
    prenom: string;
    telephone: string;
    photo_de_profil: string | null;
    email: string;
  };
};

export function UpdateProfileForm({ initial }: Props) {
  const router = useRouter();
  const form = useForm<Values>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      nom: initial.nom,
      prenom: initial.prenom,
      telephone: initial.telephone,
      photo_de_profil: initial.photo_de_profil ?? "",
    },
    mode: "onSubmit",
  });

  const [pending, startTransition] = React.useTransition();

  const onSubmit = (values: Values) => {
    startTransition(async () => {
      const payload: Record<string, unknown> = {};

      if (values.nom !== initial.nom) payload.nom = values.nom;
      if (values.prenom !== initial.prenom) payload.prenom = values.prenom;
      if (values.telephone !== initial.telephone) payload.telephone = values.telephone;

      const nextPhoto = values.photo_de_profil?.trim() ? values.photo_de_profil.trim() : null;
      if (nextPhoto !== (initial.photo_de_profil ?? null)) payload.photo_de_profil = nextPhoto;

      if (!Object.keys(payload).length) {
        toast.message("Aucun changement détecté.");
        return;
      }

      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = (await res.json().catch(() => null)) as null | { ok?: boolean; error?: string };

      if (!res.ok) {
        toast.error(body?.error ?? "Erreur lors de la mise à jour.");
        return;
      }

      toast.success("Profil mis à jour.");
      router.refresh();
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profil</CardTitle>
        <CardDescription>Mettre à jour vos informations personnelles.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 text-sm text-muted-foreground">Email: {initial.email}</div>

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
                  <FormLabel>Photo de profil (URL)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://..."
                      autoComplete="url"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={pending}>
              {pending ? "Mise à jour..." : "Enregistrer"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
