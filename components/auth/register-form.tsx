"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Mail, LockKeyhole, Phone, UserRound } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
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

const inputClass =
  "w-full h-11 pl-10 pr-4 rounded-lg border border-outline-variant bg-surface focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary transition-colors font-sans text-sm text-on-surface";

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
      router.push(res.redirectTo);
      router.refresh();
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="nom"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="block font-sans font-medium text-sm text-on-surface mb-1.5">
                  Nom
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" />
                    <Input
                      className={inputClass}
                      placeholder="Tedom"
                      autoComplete="family-name"
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
            name="prenom"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="block font-sans font-medium text-sm text-on-surface mb-1.5">
                  Prénom
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" />
                    <Input
                      className={inputClass}
                      placeholder="Dimitri"
                      autoComplete="given-name"
                      {...field}
                    />
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
              <FormLabel className="block font-sans font-medium text-sm text-on-surface mb-1.5">
                Téléphone
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" />
                  <Input
                    className={inputClass}
                    placeholder="+237 6 00 00 00 00"
                    type="tel"
                    autoComplete="tel"
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
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="block font-sans font-medium text-sm text-on-surface mb-1.5">
                Email
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" />
                  <Input
                    className={inputClass}
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

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="block font-sans font-medium text-sm text-on-surface mb-1.5">
                Mot de passe
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" />
                  <Input
                    className={inputClass}
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

        <div className="flex items-start gap-2 pt-1">
          <input
            className="mt-0.5 h-4 w-4 text-primary border-outline-variant rounded focus:ring-primary cursor-pointer shrink-0"
            id="terms"
            type="checkbox"
            required
          />
          <label className="font-sans text-sm text-on-surface-variant cursor-pointer" htmlFor="terms">
            J&apos;accepte les{" "}
            <Link className="text-primary hover:underline" href="#">
              Conditions d&apos;utilisation
            </Link>{" "}
            et la{" "}
            <Link className="text-primary hover:underline" href="#">
              Politique de confidentialité
            </Link>
            .
          </label>
        </div>

        <Button
          type="submit"
          disabled={pending}
          className="w-full h-11 bg-primary text-on-primary hover:bg-primary/90 font-sans font-medium text-sm rounded-lg transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95 mt-2"
        >
          {pending ? "Création en cours..." : "S'inscrire"}
          {!pending && <ArrowRight className="h-4 w-4" />}
        </Button>

        <p className="text-center font-sans text-sm text-on-surface-variant">
          Déjà un compte ?{" "}
          <Link
            href={`/auth/login?next=${nextParam}`}
            className="font-medium text-primary hover:underline transition-all"
          >
            Se connecter
          </Link>
        </p>
      </form>
    </Form>
  );
}
