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

const updateGroupFormSchema = z.object({
  nom: z.string().trim().min(2, "Le nom doit contenir au moins 2 caracteres.").max(64),
  description: z.string().trim().max(512).optional(),
  devise: z.string().trim().min(1).max(8),
});

type Values = z.infer<typeof updateGroupFormSchema>;

type UpdateGroupFormProps = {
  groupId: string;
  initial: {
    nom: string;
    description: string | null;
    devise: string;
  };
};

export function UpdateGroupForm({ groupId, initial }: UpdateGroupFormProps) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [deletePending, startDeleteTransition] = React.useTransition();

  const form = useForm<Values>({
    resolver: zodResolver(updateGroupFormSchema),
    defaultValues: {
      nom: initial.nom,
      description: initial.description ?? "",
      devise: initial.devise,
    },
    mode: "onSubmit",
  });

  const onSubmit = (values: Values) => {
    startTransition(async () => {
      const payload: Record<string, unknown> = {
        nom: values.nom,
        devise: values.devise,
        description: values.description?.trim() ? values.description.trim() : null,
      };

      const res = await fetch(`/api/groups/${groupId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = (await res.json().catch(() => null)) as
        | null
        | { ok?: boolean; error?: string };

      if (!res.ok) {
        toast.error(body?.error ?? "Erreur lors de la mise a jour du groupe.");
        return;
      }

      toast.success("Groupe mis a jour.");
      router.refresh();
    });
  };

  const onDelete = () => {
    if (!window.confirm("Supprimer ce groupe ? Cette action est definitive.")) {
      return;
    }

    startDeleteTransition(async () => {
      const res = await fetch(`/api/groups/${groupId}`, { method: "DELETE" });
      const body = (await res.json().catch(() => null)) as
        | null
        | { ok?: boolean; error?: string };

      if (!res.ok) {
        toast.error(body?.error ?? "Erreur lors de la suppression du groupe.");
        return;
      }

      toast.success("Groupe supprime.");
      router.push("/dashboard");
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informations du groupe</CardTitle>
          <CardDescription>Modifiez le nom, la description et la devise.</CardDescription>
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
                {pending ? "Mise a jour..." : "Mettre a jour"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Supprimer le groupe</CardTitle>
          <CardDescription>Cette action supprime le groupe et retire tous les membres.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={onDelete} disabled={deletePending}>
            {deletePending ? "Suppression..." : "Supprimer le groupe"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
