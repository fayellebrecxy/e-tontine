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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="nom"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="block font-medium text-sm text-slate-900">Nom</FormLabel>
                <FormControl>
                  <div className="relative">
                    <UserRound className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <Input className="w-full h-12 pl-10 pr-4 rounded-md border-slate-200 bg-slate-50 focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:border-green-600 transition-colors text-base text-slate-900" placeholder="Tedom" autoComplete="family-name" {...field} />
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
                <FormLabel className="block font-medium text-sm text-slate-900">Prénom</FormLabel>
                <FormControl>
                  <div className="relative">
                    <UserRound className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <Input className="w-full h-12 pl-10 pr-4 rounded-md border-slate-200 bg-slate-50 focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:border-green-600 transition-colors text-base text-slate-900" placeholder="Dimitri" autoComplete="given-name" {...field} />
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
              <FormLabel className="block font-medium text-sm text-slate-900">Téléphone</FormLabel>
              <FormControl>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <Input className="w-full h-12 pl-10 pr-4 rounded-md border-slate-200 bg-slate-50 focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:border-green-600 transition-colors text-base text-slate-900" placeholder="+237 6 00 00 00 00" type="tel" autoComplete="tel" {...field} />
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
              <FormLabel className="block font-medium text-sm text-slate-900">Email</FormLabel>
              <FormControl>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <Input className="w-full h-12 pl-10 pr-4 rounded-md border-slate-200 bg-slate-50 focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:border-green-600 transition-colors text-base text-slate-900" placeholder="vous@example.com" type="email" autoComplete="email" {...field} />
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
              <FormLabel className="block font-medium text-sm text-slate-900">Mot de passe</FormLabel>
              <FormControl>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <Input
                    className="w-full h-12 pl-10 pr-4 rounded-md border-slate-200 bg-slate-50 focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:border-green-600 transition-colors text-base text-slate-900"
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

        <Button 
          type="submit" 
          disabled={pending}
          className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-medium text-base rounded-md transition-all shadow-sm flex items-center justify-center gap-2"
        >
          {pending ? "Création..." : "Créer le compte"}
          {!pending && <ArrowRight className="h-5 w-5" />}
        </Button>

        <p className="mt-8 text-center text-sm text-slate-600">
          Déjà un compte ?{" "}
          <Link href={`/auth/login?next=${nextParam}`} className="font-medium text-green-600 hover:underline transition-all">
            Se connecter
          </Link>
        </p>
      </form>
    </Form>
  );
}
