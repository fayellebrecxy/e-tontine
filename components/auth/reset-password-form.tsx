"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { resetPasswordAction } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { resetPasswordSchema } from "@/lib/validations";

type Values = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordForm() {
  const router = useRouter();
  const form = useForm<Values>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email: "" },
  });

  const [pending, startTransition] = React.useTransition();

  const onSubmit = (values: Values) => {
    startTransition(async () => {
      const res = await resetPasswordAction(values);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }

      toast.success(res.message ?? "Email envoyé.");
      router.push(res.redirectTo);
      router.refresh();
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="vous@example.com" type="email" autoComplete="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button className="w-full" type="submit" disabled={pending}>
          {pending ? "Envoi..." : "Envoyer le lien"}
        </Button>

        <p className="text-sm text-muted-foreground">
          <Link href="/auth/login" className="text-foreground underline underline-offset-4">
            Retour à la connexion
          </Link>
        </p>
      </form>
    </Form>
  );
}
