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

const createGroupFormSchema = z.object({
  nom: z.string().trim().min(2, "Le nom doit contenir au moins 2 caractères.").max(64),
  description: z.string().trim().max(512).optional(),
  devise: z.string().trim().min(1).max(8),
});

type Values = z.infer<typeof createGroupFormSchema>;

export function CreateGroupForm() {
  const router = useRouter();

  const form = useForm<Values>({
    resolver: zodResolver(createGroupFormSchema),
    defaultValues: {
      nom: "",
      description: "",
      devise: "XAF",
    },
    mode: "onSubmit",
  });

  const [pending, startTransition] = React.useTransition();

  const onSubmit = (values: Values) => {
    startTransition(async () => {
      const payload: Record<string, unknown> = {
        nom: values.nom,
        devise: values.devise,
      };

      const description = values.description?.trim();
      if (description) payload.description = description;

      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = (await res.json().catch(() => null)) as
        | null
        | { ok?: boolean; error?: string; groupe?: { id_groupe?: string } };

      if (!res.ok) {
        toast.error(body?.error ?? "Erreur lors de la création du groupe.");
        return;
      }

      toast.success("Groupe créé.");
      router.push("/dashboard");
      router.refresh();
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Créer un groupe</CardTitle>
        <CardDescription>
          Créez un groupe de tontine. Vous serez automatiquement admin et membre du groupe.
        </CardDescription>
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
                    <Input placeholder="Ex: Tontine Famille" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optionnel)</FormLabel>
                  <FormControl>
                    <Input placeholder="Une courte description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="devise"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Devise</FormLabel>
                  <FormControl>
                    <Input placeholder="XAF" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={pending}>
              {pending ? "Création..." : "Créer"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
