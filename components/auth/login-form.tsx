"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("auth");

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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="block font-sans font-medium text-sm text-on-surface mb-1.5">
                {t("email")}
              </FormLabel>
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

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="flex justify-between items-center mb-1.5">
                <FormLabel className="block font-sans font-medium text-sm text-on-surface">
                  {t("password")}
                </FormLabel>
                <Link
                  className="font-sans text-sm font-medium text-primary hover:underline transition-all"
                  href="/auth/reset-password"
                >
                  {t("forgotPassword")}
                </Link>
              </div>
              <FormControl>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" />
                  <Input
                    className="w-full h-11 pl-10 pr-4 rounded-lg border border-outline-variant bg-surface focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary transition-colors font-sans text-sm text-on-surface"
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
          <input
            className="h-4 w-4 text-primary focus:ring-primary border-outline-variant rounded cursor-pointer"
            id="remember"
            name="remember"
            type="checkbox"
          />
          <label className="ml-2 block font-sans text-sm text-on-surface-variant cursor-pointer" htmlFor="remember">
            {t("rememberMe")}
          </label>
        </div>

        <Button
          type="submit"
          disabled={pending}
          className="w-full h-11 bg-primary text-on-primary hover:bg-primary/90 font-sans font-medium text-sm rounded-lg transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95"
        >
          {pending ? t("loginPending") : t("loginButton")}
          {!pending && <LogIn className="h-4 w-4" />}
        </Button>

        <p className="text-center font-sans text-sm text-on-surface-variant">
          {t("noAccount")}{" "}
          <Link className="font-medium text-primary hover:underline transition-all" href="/auth/register">
            {t("createAccount")}
          </Link>
        </p>
      </form>
    </Form>
  );
}
