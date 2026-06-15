"use client";

import * as React from "react";
import { useLocale } from "next-intl";
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

const LANGS: { code: Locale; label: string; short: string }[] = [
  { code: "fr", label: "Français", short: "FR" },
  { code: "en", label: "English", short: "EN" },
];

export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  const current = LANGS.find((l) => l.code === locale) ?? LANGS[0];

  const onSelect = (code: Locale) => {
    if (code === locale) return;
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
          aria-label="Changer de langue"
          className={`inline-flex items-center gap-1.5 rounded-lg border border-border-light bg-surface-container-lowest px-2.5 py-1.5 font-sans text-xs font-medium text-on-surface-variant transition-colors hover:bg-surface-container-low ${className ?? ""}`}
        >
          <Globe className="h-4 w-4" />
          <span>{current.short}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[150px]">
        {LANGS.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => onSelect(lang.code)}
            className="flex cursor-pointer items-center justify-between gap-2 font-sans text-sm"
          >
            {lang.label}
            {lang.code === locale && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
