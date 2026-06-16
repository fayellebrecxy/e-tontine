"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Check, Globe } from "lucide-react";

import { setLocale } from "@/app/actions/locale";
import type { Locale } from "@/i18n/request";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LANGS: { code: Locale; labelKey: "fr" | "en" }[] = [
  { code: "fr", labelKey: "fr" },
  { code: "en", labelKey: "en" },
];

export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale() as Locale;
  const t = useTranslations("language");
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  const current = LANGS.find((l) => l.code === locale) ?? LANGS[0];

  const onSelect = (code: Locale) => {
    if (code === locale || pending) return;

    startTransition(async () => {
      await setLocale(code);
      router.refresh();
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={pending}
          aria-label={t("label")}
          className={`inline-flex items-center gap-1.5 rounded-lg border border-border-light bg-surface-container-lowest px-2.5 py-1.5 font-sans text-xs font-medium text-on-surface-variant transition-colors hover:bg-surface-container-low ${className ?? ""}`}
        >
          <Globe className="h-4 w-4" />
          <span>{current.code.toUpperCase()}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[150px]">
        {LANGS.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onSelect={() => onSelect(lang.code)}
            className="flex cursor-pointer items-center justify-between gap-2 font-sans text-sm"
          >
            {t(lang.labelKey)}
            {lang.code === locale && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
