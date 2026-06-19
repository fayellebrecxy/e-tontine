"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { updatePasswordSchema } from "@/lib/validations";
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
import { PasswordInput } from "@/components/auth/password-input";

type Values = z.infer<typeof updatePasswordSchema>;

const passwordInputClass =
  "w-full h-12 rounded-md border-slate-200 bg-slate-50 focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:border-green-600 transition-colors text-base text-slate-900";

const passwordIconClass = "h-5 w-5 text-slate-400";
const passwordToggleClass = "text-slate-400 hover:text-slate-700";

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

  const onInvalid = () => {
    const confirmError = form.formState.errors.confirmPassword?.message;
    const passwordError = form.formState.errors.password?.message;
    toast.error(confirmError ?? passwordError ?? "Vérifie les champs du formulaire.");
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-6">
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="block font-medium text-sm text-slate-900">
                Nouveau mot de passe
              </FormLabel>
              <FormControl>
                <PasswordInput
                  className={passwordInputClass}
                  iconClassName={passwordIconClass}
                  toggleClassName={passwordToggleClass}
                  placeholder="Au moins 8 caractères"
                  autoComplete="new-password"
                  {...field}
                />
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
              <FormLabel className="block font-medium text-sm text-slate-900">
                Confirmer le mot de passe
              </FormLabel>
              <FormControl>
                <PasswordInput
                  className={passwordInputClass}
                  iconClassName={passwordIconClass}
                  toggleClassName={passwordToggleClass}
                  placeholder="Répète le mot de passe"
                  autoComplete="new-password"
                  {...field}
                />
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
          {pending ? "Mise à jour..." : "Mettre à jour"}
          {!pending && <ArrowRight className="h-5 w-5" />}
        </Button>
      </form>
    </Form>
  );
}
