import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";

export async function SiteHeader() {
  const supabase = await createSupabaseServerClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  const t = await getTranslations("nav");

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-outline-variant/30 bg-surface-container-lowest/90 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-container-max items-center justify-between px-4 md:px-8">
        {/* Brand */}
        <Link href="/" className="transition-opacity hover:opacity-90">
          <Logo size={30} />
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center space-x-1 md:flex">
          <Link
            href="#fonctionnalites"
            className="rounded-lg px-3 py-2 font-sans text-sm font-medium text-on-surface-variant transition-all duration-200 hover:bg-surface-container-low hover:text-primary"
          >
            {t("features")}
          </Link>
          <Link
            href="#comment-ca-marche"
            className="rounded-lg px-3 py-2 font-sans text-sm font-medium text-on-surface-variant transition-all duration-200 hover:bg-surface-container-low hover:text-primary"
          >
            {t("howItWorks")}
          </Link>
          <Link
            href="#faq"
            className="rounded-lg px-3 py-2 font-sans text-sm font-medium text-on-surface-variant transition-all duration-200 hover:bg-surface-container-low hover:text-primary"
          >
            {t("faq")}
          </Link>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <LanguageSwitcher />
          {user ? (
            <Button
              asChild
              size="sm"
              className="bg-primary font-sans font-medium text-on-primary shadow-sm transition-all duration-200 hover:bg-primary/90 active:scale-95"
            >
              <Link href="/dashboard">{t("dashboard")}</Link>
            </Button>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="hidden font-sans text-sm font-medium text-secondary transition-colors hover:text-primary md:block"
              >
                {t("login")}
              </Link>
              <Button
                asChild
                size="sm"
                className="bg-primary px-5 font-sans font-medium text-on-primary shadow-sm transition-all duration-200 hover:bg-primary/90 active:scale-95"
              >
                <Link href="/auth/register">{t("register")}</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
