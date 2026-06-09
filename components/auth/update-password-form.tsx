"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";

import { z } from "zod";

import { updatePasswordAction } from "@/app/auth/actions";
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
import { updatePasswordSchema } from "@/lib/validations";

type Values = z.infer<typeof updatePasswordSchema>;

export function UpdatePasswordForm() {
  const router = useRouter();
  const form = useForm<Values>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const [pending, startTransition] = React.useTransition();

  const onSubmit = (values: Values) => {
    startTransition(async () => {
      const res = await updatePasswordAction(values);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }

      toast.success(res.message ?? "Mot de passe mis à jour.");
      router.push(res.redirectTo);
      router.refresh();
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-bold uppercase tracking-wide text-slate-600">Nouveau mot de passe</FormLabel>
              <FormControl>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    className="h-12 rounded-lg border-slate-200 bg-slate-50 pl-10 text-sm transition duration-200 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-emerald-600/25"
                    type="password"
                    autoComplete="new-password"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-bold uppercase tracking-wide text-slate-600">Confirmer le mot de passe</FormLabel>
              <FormControl>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    className="h-12 rounded-lg border-slate-200 bg-slate-50 pl-10 text-sm transition duration-200 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-emerald-600/25"
                    type="password"
                    autoComplete="new-password"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button className="h-12 w-full rounded-lg bg-slate-950 text-sm font-bold text-white shadow-lg shadow-slate-900/15 transition duration-200 hover:-translate-y-0.5 hover:bg-emerald-700" type="submit" disabled={pending}>
          {pending ? "Mise à jour..." : "Mettre à jour"}
          {!pending ? <ArrowRight className="h-4 w-4" /> : null}
        </Button>
      </form>
    </Form>
  );
}
