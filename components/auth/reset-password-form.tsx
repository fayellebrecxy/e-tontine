"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { resetPasswordSchema } from "@/lib/validations";
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

type Values = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordForm() {
  const form = useForm<Values>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email: "" },
  });

  const [pending, startTransition] = React.useTransition();
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  const onSubmit = (values: Values) => {
    setSuccessMessage(null);
    startTransition(async () => {
      const res = await resetPasswordAction(values);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setSuccessMessage(res.message ?? "Si un compte existe, un email de réinitialisation a été envoyé.");
      form.reset();
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {successMessage ? (
          <p className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 font-sans text-sm text-on-surface">
            {successMessage}
          </p>
        ) : null}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="block font-sans font-medium text-sm text-on-surface mb-1.5">Email</FormLabel>
              <FormControl>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" />
                  <Input
                    className="w-full h-11 pl-10 pr-4 rounded-lg border border-outline-variant bg-surface focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary transition-colors font-sans text-sm text-on-surface"
                    placeholder="vous@exemple.com"
                    type="email"
                    autoComplete="email"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={pending}
          className="w-full h-11 bg-primary text-on-primary hover:bg-primary/90 font-sans font-medium text-sm rounded-lg transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95"
        >
          {pending ? "Envoi en cours..." : "Réinitialiser le mot de passe"}
          {!pending && <ArrowRight className="h-4 w-4" />}
        </Button>

        <p className="text-center font-sans text-sm text-on-surface-variant">
          Vous vous en souvenez ?{" "}
          <Link href="/auth/login" className="font-medium text-primary hover:underline transition-all">
            Se connecter
          </Link>
        </p>
      </form>
    </Form>
  );
}
