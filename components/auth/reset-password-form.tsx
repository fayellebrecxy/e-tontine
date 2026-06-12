"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
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

  const onSubmit = (values: Values) => {
    startTransition(async () => {
      const res = await resetPasswordAction(values);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(res.message);
      form.reset();
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
              <FormLabel className="block font-medium text-sm text-slate-900">Email</FormLabel>
              <FormControl>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <Input
                    className="w-full h-12 pl-10 pr-4 rounded-md border-slate-200 bg-slate-50 focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:border-green-600 transition-colors text-base text-slate-900"
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

        <Button 
          type="submit" 
          disabled={pending}
          className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-medium text-base rounded-md transition-all shadow-sm flex items-center justify-center gap-2"
        >
          {pending ? "Envoi..." : "Réinitialiser"}
          {!pending && <ArrowRight className="h-5 w-5" />}
        </Button>

        <p className="mt-8 text-center text-sm text-slate-600">
          Tu t'en souviens ?{" "}
          <Link href="/auth/login" className="font-medium text-green-600 hover:underline transition-all">
            Se connecter
          </Link>
        </p>
      </form>
    </Form>
  );
}
