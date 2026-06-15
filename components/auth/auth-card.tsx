import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { ShieldCheck, ArrowLeft } from "lucide-react";

import { Logo } from "@/components/brand/logo";

export async function AuthCard({
  title,
  description,
  children,
  showImage = true,
  variant = "default",
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  showImage?: boolean;
  variant?: "default" | "login";
}) {
  const t = await getTranslations("auth");
  const isLogin = variant === "login";

  return (
    <div
      className={`auth-card-enter w-full ${
        showImage
          ? "grid max-w-[1000px] grid-cols-1 md:grid-cols-2"
          : "max-w-[480px]"
      } overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-lg`}
    >
      {/* Left: image (modern, représente la tontine) */}
      {showImage && (
        <div className="relative hidden min-h-[560px] overflow-hidden md:block">
          <Image
            src="/images/login-3d.png"
            alt="Tontine E-Tontine : pot commun et cotisations en FCFA"
            fill
            sizes="500px"
            priority
            className="object-cover"
          />
          {/* Voile dégradé pour lisibilité */}
          <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/40 to-primary/10" />

          {/* Logo en haut */}
          <div className="absolute left-8 top-8">
            <Logo size={30} variant="light" />
          </div>

          {/* Carte verre dépoli en bas */}
          <div className="absolute inset-x-8 bottom-8">
            <div className="glass-panel rounded-2xl border-white/20 p-6 shadow-lg">
              <ShieldCheck className="mb-3 h-7 w-7 text-primary" />
              <h2 className="mb-1.5 font-heading text-lg font-bold text-on-surface">
                {t("securityTitle")}
              </h2>
              <p className="font-sans text-sm leading-relaxed text-on-surface-variant">
                {t("securityText")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Right: form */}
      <div className="flex flex-col justify-center p-7 sm:p-10 md:p-12">
        <div className="mb-7">
          {/* Logo mobile + retour */}
          <div className="mb-7 flex items-center justify-between md:hidden">
            <Logo size={28} />
            <Link
              href="/"
              className="inline-flex items-center gap-1 font-sans text-xs font-medium text-on-surface-variant hover:text-primary"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {t("homeLink")}
            </Link>
          </div>

          <h1 className="mb-1.5 font-heading text-2xl font-bold text-on-surface">
            {isLogin ? t("welcomeBack") : title}
          </h1>
          <p className="font-sans text-base text-on-surface-variant">
            {isLogin ? t("loginDescription") : description}
          </p>
        </div>

        {children}
      </div>
    </div>
  );
}
