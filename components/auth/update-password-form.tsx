"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LockKeyhole } from "lucide-react";
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
import { Input } from "@/components/ui/input";

type Values = z.infer<typeof updatePasswordSchema>;

export function UpdatePasswordForm() {
  const router = useRouter();
  const form = useForm<Values>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: { password: "" },
  });

  const [pending, startTransition] = React.useTransition();

  const onSubmit = (values: Values) => {
    startTransition(async () => {
      const res = await updatePasswordAction(values);
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="block font-medium text-sm text-slate-900">Nouveau mot de passe</FormLabel>
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
          {pending ? "Mise à jour..." : "Mettre à jour"}
          {!pending && <ArrowRight className="h-5 w-5" />}
        </Button>
      </form>
    </Form>
  );
}
