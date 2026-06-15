import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  FileDown,
  ShieldCheck,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { SectionReveal } from "@/components/landing/section-reveal";
import { FeatureMarquee, type MarqueeCard } from "@/components/landing/feature-marquee";
import { BeforeAfter } from "@/components/landing/before-after";
import { MoneyFlow } from "@/components/landing/money-flow";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { JoinGroupDialog } from "@/components/invitations/join-group-dialog";

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  if (user) {
    redirect("/dashboard");
  }

  const t = await getTranslations("landing");

  const featureCards: MarqueeCard[] = [
    { title: t("feature1Title"), text: t("feature1Text"), image: "/images/feature-groupes.png" },
    { title: t("feature2Title"), text: t("feature2Text"), image: "/images/feature-cotisations.png" },
    { title: t("feature3Title"), text: t("feature3Text"), image: "/images/feature-reunions.png" },
    { title: t("feature4Title"), text: t("feature4Text"), image: "/images/feature-documents.png" },
  ];

  const steps = [
    { icon: Users, title: t("step1Title"), text: t("step1Text") },
    { icon: CircleDollarSign, title: t("step2Title"), text: t("step2Text") },
    { icon: CalendarDays, title: t("step3Title"), text: t("step3Text") },
  ];

  return (
    <div className="overflow-hidden bg-surface">
      {/* Hero */}
      <section className="relative overflow-hidden bg-surface-container-lowest pt-12 pb-16 sm:pt-16 md:pt-20 md:pb-24">
        <div className="pointer-events-none absolute -right-32 -top-32 h-[480px] w-[480px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="relative z-10 mx-auto grid max-w-container-max grid-cols-1 items-center gap-10 px-4 md:px-8 lg:grid-cols-2 lg:gap-12">
          <SectionReveal className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-surface-container-low px-3 py-1.5">
              <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
              <span className="font-sans text-xs font-medium text-primary sm:text-sm">{t("heroBadge")}</span>
            </div>

            <h1 className="font-heading text-3xl font-bold leading-[1.15] tracking-tight text-on-background sm:text-4xl md:text-5xl">
              {t("heroTitlePrefix")}{" "}
              <span className="relative inline-block text-primary">
                {t("heroTitleHighlight")}
                <svg
                  className="absolute -bottom-1 left-0 z-[-1] h-3 w-full text-primary/30"
                  preserveAspectRatio="none"
                  viewBox="0 0 100 10"
                >
                  <path d="M0 5 Q 50 10 100 5" fill="transparent" stroke="currentColor" strokeWidth="4" />
                </svg>
              </span>
            </h1>

            <p className="max-w-md font-sans text-base leading-relaxed text-on-surface-variant sm:text-lg">
              {t("heroSubtitle")}
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                asChild
                size="lg"
                className="h-12 gap-2 rounded-xl bg-primary px-7 font-sans font-medium text-on-primary shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/90 active:scale-95"
              >
                <Link href="/auth/register">
                  {t("ctaCreate")}
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <JoinGroupDialog
                variant="outline"
                className="h-12 rounded-xl border border-border-light bg-surface-container-lowest px-7 font-sans font-medium text-secondary transition-all duration-200 hover:-translate-y-0.5 hover:bg-surface-container-low active:scale-95"
              />
            </div>

            <div className="flex items-center gap-4 pt-2">
              <div className="flex -space-x-3">
                {["#006b2c", "#4059aa", "#a72d51"].map((c, i) => (
                  <span
                    key={i}
                    className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-surface-container-lowest text-xs font-bold text-white"
                    style={{ backgroundColor: c }}
                  >
                    {["A", "B", "C"][i]}
                  </span>
                ))}
                <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-surface-container-lowest bg-surface-container-high text-xs font-medium text-on-surface-variant">
                  +5k
                </span>
              </div>
              <p className="font-sans text-sm text-on-surface-variant">{t("membersSatisfied")}</p>
            </div>
          </SectionReveal>

          {/* Hero image */}
          <SectionReveal delay={0.15} className="relative">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-border-light shadow-ambient">
              <Image
                src="/images/tontine-hero.png"
                alt="Groupe de tontine camerounais réuni"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 600px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
            <div className="glass-card absolute -bottom-5 -left-3 flex items-center gap-3 rounded-2xl p-3 shadow-xl sm:-left-5 sm:p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-sans text-xs font-semibold text-on-surface">{t("tourValidated")}</p>
                <p className="font-sans text-[11px] text-on-surface-variant">+150 000 FCFA</p>
              </div>
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* Money circulates */}
      <section className="bg-surface py-16 md:py-20">
        <div className="mx-auto grid max-w-container-max items-center gap-10 px-4 md:px-8 lg:grid-cols-2">
          <SectionReveal>
            <p className="mb-3 font-sans text-sm font-semibold uppercase tracking-wider text-warning">
              {t("moneyEyebrow")}
            </p>
            <h2 className="font-heading text-2xl font-bold tracking-tight text-on-background sm:text-3xl md:text-4xl">
              {t("moneyTitle")}
            </h2>
            <p className="mt-4 max-w-md font-sans text-base leading-relaxed text-on-surface-variant">
              {t("moneySubtitle")}
            </p>
          </SectionReveal>
          <SectionReveal delay={0.1}>
            <MoneyFlow potLabel={t("potCommun")} />
          </SectionReveal>
        </div>
      </section>

      {/* Features carousel */}
      <section className="bg-surface-container-lowest py-16 md:py-20" id="fonctionnalites">
        <div className="mx-auto mb-8 max-w-container-max px-4 md:px-8">
          <SectionReveal className="max-w-xl">
            <p className="mb-3 font-sans text-sm font-semibold uppercase tracking-wider text-warning">
              {t("featuresEyebrow")}
            </p>
            <h2 className="font-heading text-2xl font-bold tracking-tight text-on-background sm:text-3xl md:text-4xl">
              {t("featuresTitle")}
            </h2>
          </SectionReveal>
        </div>
        <FeatureMarquee cards={featureCards} />
      </section>

      {/* Before / After */}
      <section className="bg-surface py-16 md:py-20" id="comment-ca-marche">
        <div className="mx-auto grid max-w-container-max items-center gap-12 px-4 md:px-8 lg:grid-cols-2">
          <SectionReveal>
            <p className="mb-3 font-sans text-sm font-semibold uppercase tracking-wider text-warning">
              {t("beforeAfterEyebrow")}
            </p>
            <h2 className="font-heading text-2xl font-bold tracking-tight text-on-background sm:text-3xl md:text-4xl">
              {t("beforeAfterTitle")}
            </h2>
            <p className="mt-4 max-w-md font-sans text-base leading-relaxed text-on-surface-variant">
              {t("beforeAfterSubtitle")}
            </p>
            <div className="mt-6 space-y-3">
              {[t("benefit1"), t("benefit2"), t("benefit3")].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                  <span className="font-sans text-sm text-on-surface-variant">{item}</span>
                </div>
              ))}
            </div>
          </SectionReveal>
          <SectionReveal delay={0.1}>
            <BeforeAfter
              labels={{
                before: t("before"),
                beforeCaption: t("beforeCaption"),
                after: t("after"),
                afterCaption: t("afterCaption"),
              }}
            />
          </SectionReveal>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-[#00164e] py-16 text-white md:py-20">
        <div className="mx-auto max-w-container-max px-4 md:px-8">
          <SectionReveal className="mb-10 max-w-xl">
            <p className="mb-3 font-sans text-sm font-semibold uppercase tracking-wider text-[#62df7d]">
              {t("stepsEyebrow")}
            </p>
            <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
              {t("stepsTitle")}
            </h2>
          </SectionReveal>
          <div className="grid gap-4 sm:grid-cols-3">
            {steps.map((step, index) => (
              <SectionReveal key={step.title} delay={index * 0.1}>
                <div className="h-full rounded-2xl border border-white/10 bg-white/5 p-6">
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-[#62df7d]/15 text-[#62df7d]">
                    <step.icon className="h-5 w-5" />
                  </div>
                  <span className="font-heading text-sm font-bold text-[#62df7d]">0{index + 1}</span>
                  <h3 className="mt-1 font-heading text-lg font-semibold">{step.title}</h3>
                  <p className="mt-1 font-sans text-sm leading-relaxed text-blue-200">{step.text}</p>
                </div>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Trust banner */}
      <section className="bg-surface-container-lowest py-16 md:py-20" id="faq">
        <div className="mx-auto grid max-w-container-max items-center gap-10 px-4 md:px-8 lg:grid-cols-[1fr_1.1fr]">
          <SectionReveal className="relative">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-border-light shadow-ambient">
              <Image
                src="/images/feature-documents.png"
                alt="Suivi financier clair et sécurisé"
                fill
                sizes="(max-width: 1024px) 100vw, 560px"
                className="object-cover"
              />
            </div>
          </SectionReveal>
          <SectionReveal delay={0.1}>
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <h2 className="font-heading text-2xl font-bold tracking-tight text-on-background sm:text-3xl md:text-4xl">
              {t("trustTitle")}
            </h2>
            <p className="mt-4 max-w-md font-sans text-base leading-relaxed text-on-surface-variant">
              {t("trustSubtitle")}
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                { icon: Users, label: t("trustBadge1") },
                { icon: CircleDollarSign, label: t("trustBadge2") },
                { icon: FileDown, label: t("trustBadge3") },
              ].map((b) => (
                <div key={b.label} className="rounded-xl border border-border-light bg-surface p-4">
                  <b.icon className="h-5 w-5 text-primary" />
                  <p className="mt-2 font-sans text-sm font-medium text-on-surface">{b.label}</p>
                </div>
              ))}
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-14 md:py-16">
        <div className="mx-auto max-w-container-max px-4 text-center md:px-8">
          <SectionReveal>
            <h2 className="font-heading text-2xl font-bold text-on-primary sm:text-3xl md:text-4xl">
              {t("ctaTitle")}
            </h2>
            <p className="mx-auto mt-3 max-w-md font-sans text-base text-green-100 sm:text-lg">
              {t("ctaSubtitle")}
            </p>
            <div className="mt-7 flex justify-center">
              <Button
                asChild
                size="lg"
                className="h-12 gap-2 bg-white px-8 font-sans font-semibold text-primary shadow-lg transition-all hover:-translate-y-0.5 hover:bg-green-50 active:scale-95"
              >
                <Link href="/auth/register">
                  {t("ctaCreate")}
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-outline-variant bg-surface-container-lowest py-10">
        <div className="mx-auto flex max-w-container-max flex-col gap-6 px-4 md:flex-row md:items-center md:justify-between md:px-8">
          <div className="space-y-2">
            <Logo size={28} />
            <p className="max-w-xs font-sans text-sm text-on-surface-variant">{t("trustSubtitle")}</p>
          </div>
          <div className="flex flex-wrap items-center gap-4 font-sans text-sm text-on-surface-variant">
            <Link href="/auth/register" className="hover:text-primary">{t("ctaCreate")}</Link>
            <span className="text-outline">© 2025 E-Tontine</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
