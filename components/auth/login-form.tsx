"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn, Mail, LockKeyhole } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { z } from "zod";

import { signInSchema } from "@/lib/validations";
import { signInAction } from "@/app/auth/actions";
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

type Values = z.infer<typeof signInSchema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";

  const form = useForm<Values>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const [pending, startTransition] = React.useTransition();

  const onSubmit = (values: Values) => {
    startTransition(async () => {
      const res = await signInAction({ ...values, next });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Bienvenue !");
      router.push(res.redirectTo);
      router.refresh();
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="block font-medium text-sm text-slate-900 mb-2">Adresse Email</FormLabel>
              <FormControl>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <Input
                    className="w-full h-12 pl-10 pr-4 rounded-md border-slate-200 bg-slate-50 focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:border-green-600 transition-colors text-base text-slate-900"
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
              <div className="flex justify-between items-center mb-2">
                <FormLabel className="block font-medium text-sm text-slate-900">Mot de passe</FormLabel>
                <Link className="text-sm font-medium text-green-600 hover:underline transition-all" href="/auth/reset-password">Mot de passe oublié ?</Link>
              </div>
              <FormControl>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <Input
                    className="w-full h-12 pl-10 pr-4 rounded-md border-slate-200 bg-slate-50 focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:border-green-600 transition-colors text-base text-slate-900"
                    placeholder="••••••••"
                    type="password"
                    autoComplete="current-password"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center">
          <input className="h-4 w-4 text-green-600 focus:ring-green-600 border-slate-300 rounded" id="remember" name="remember" type="checkbox" />
          <label className="ml-2 block text-sm text-slate-600" htmlFor="remember">
            Se souvenir de moi
          </label>
        </div>

        <Button 
          type="submit" 
          disabled={pending}
          className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-medium text-base rounded-md transition-all shadow-sm flex items-center justify-center gap-2"
        >
          {pending ? "Connexion..." : "Connexion"}
          {!pending && <LogIn className="h-5 w-5" />}
        </Button>

        <p className="mt-8 text-center text-sm text-slate-600">
          Nouveau sur E-Tontine ?{" "}
          <Link className="font-medium text-green-600 hover:underline transition-all" href="/auth/register">Créer un compte</Link>
        </p>
      </form>
    </Form>
  );
}

        <Button className="h-12 w-full rounded-lg bg-slate-950 text-sm font-bold text-white shadow-lg shadow-slate-900/15 transition duration-200 hover:-translate-y-0.5 hover:bg-emerald-700" type="submit" disabled={pending}>
          {pending ? "Connexion..." : "Se connecter"}
          {!pending ? <ArrowRight className="h-4 w-4" /> : null}
        </Button>

        <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
          <p>
            Pas encore de compte ?{" "}
          <Link
            href={`/auth/register?next=${nextParam}`}
              className="font-bold text-slate-950 underline underline-offset-4 transition hover:text-emerald-700"
          >
            Créer un compte
          </Link>
          .
          </p>
          <p>
          <Link
            href={`/auth/reset-password?next=${nextParam}`}
              className="font-bold text-slate-950 underline underline-offset-4 transition hover:text-emerald-700"
          >
            Mot de passe oublié ?
          </Link>
          </p>
        </div>
      </form>
    </Form>
  );
}
