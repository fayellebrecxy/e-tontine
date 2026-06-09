"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Mail, LockKeyhole, Phone, UserRound } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { z } from "zod";

import { signUpSchema } from "@/lib/validations";
import { signUpAction } from "@/app/auth/actions";
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

type Values = z.infer<typeof signUpSchema>;

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const nextParam = encodeURIComponent(next);
  const form = useForm<Values>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { nom: "", prenom: "", telephone: "", email: "", password: "" },
  });

  const [pending, startTransition] = React.useTransition();

  const onSubmit = (values: Values) => {
    startTransition(async () => {
      const res = await signUpAction({ ...values, next });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(res.message ?? "Compte créé.");
      router.push(res.redirectTo);
      router.refresh();
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="nom"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-wide text-slate-600">Nom</FormLabel>
                <FormControl>
                  <div className="relative">
                    <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input className="h-12 rounded-lg border-slate-200 bg-slate-50 pl-10 text-sm transition duration-200 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-emerald-600/25" placeholder="Tedom" autoComplete="family-name" {...field} />
                  </div>
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
                <FormLabel className="text-xs font-bold uppercase tracking-wide text-slate-600">Prénom</FormLabel>
                <FormControl>
                  <div className="relative">
                    <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input className="h-12 rounded-lg border-slate-200 bg-slate-50 pl-10 text-sm transition duration-200 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-emerald-600/25" placeholder="Dimitri" autoComplete="given-name" {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="telephone"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-bold uppercase tracking-wide text-slate-600">Téléphone</FormLabel>
              <FormControl>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input className="h-12 rounded-lg border-slate-200 bg-slate-50 pl-10 text-sm transition duration-200 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-emerald-600/25" placeholder="+237 6 00 00 00 00" type="tel" autoComplete="tel" {...field} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-bold uppercase tracking-wide text-slate-600">Email</FormLabel>
              <FormControl>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input className="h-12 rounded-lg border-slate-200 bg-slate-50 pl-10 text-sm transition duration-200 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-emerald-600/25" placeholder="vous@example.com" type="email" autoComplete="email" {...field} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-bold uppercase tracking-wide text-slate-600">Mot de passe</FormLabel>
              <FormControl>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    className="h-12 rounded-lg border-slate-200 bg-slate-50 pl-10 text-sm transition duration-200 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-emerald-600/25"
                    placeholder="Au moins 8 caractères"
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
          {pending ? "Création..." : "Créer le compte"}
          {!pending ? <ArrowRight className="h-4 w-4" /> : null}
        </Button>

        <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
          Déjà un compte ?{" "}
          <Link href={`/auth/login?next=${nextParam}`} className="font-bold text-slate-950 underline underline-offset-4 transition hover:text-emerald-700">
            Se connecter
          </Link>
          .
        </p>
      </form>
    </Form>
  );
}
