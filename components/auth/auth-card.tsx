import * as React from "react";
import { ShieldCheck } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function AuthCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="auth-card-enter w-full max-w-[30rem] overflow-hidden rounded-xl border-white/80 bg-white/88 text-slate-950 shadow-2xl shadow-slate-900/12 backdrop-blur-xl">
      <CardHeader className="space-y-4 border-b border-slate-200/70 p-6 sm:p-7">
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
            <ShieldCheck className="h-3.5 w-3.5" />
            Accès sécurisé
          </div>
          <div className="h-2 w-16 rounded-full bg-[linear-gradient(90deg,#0f172a,#16a34a,#f59e0b)]" />
        </div>
        <div>
          <CardTitle className="text-3xl font-black tracking-normal text-slate-950">
            {title}
          </CardTitle>
          <CardDescription className="mt-2 text-sm leading-6 text-slate-600">
            {description}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-6 sm:p-7">{children}</CardContent>
    </Card>
  );
}
