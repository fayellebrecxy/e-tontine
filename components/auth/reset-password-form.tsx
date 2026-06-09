"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail, Send } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-bold uppercase tracking-wide text-slate-600">Email</FormLabel>
              <FormControl>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    className="h-12 rounded-lg border-slate-200 bg-slate-50 pl-10 text-sm transition duration-200 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-emerald-600/25"
                    placeholder="vous@example.com"
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

        <Button className="h-12 w-full rounded-lg bg-slate-950 text-sm font-bold text-white shadow-lg shadow-slate-900/15 transition duration-200 hover:-translate-y-0.5 hover:bg-emerald-700" type="submit" disabled={pending}>
          {pending ? "Envoi..." : "Envoyer le lien"}
          {!pending ? <Send className="h-4 w-4" /> : null}
        </Button>

        <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
          <Link href="/auth/login" className="inline-flex items-center gap-2 font-bold text-slate-950 underline underline-offset-4 transition hover:text-emerald-700">
            <ArrowLeft className="h-4 w-4" />
            Retour à la connexion
          </Link>
        </p>
      </form>
    </Form>
  );
}
