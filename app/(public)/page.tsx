import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  Bell,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  FileDown,
  HandCoins,
  Landmark,
  LockKeyhole,
  MessageCircleQuestion,
  ShieldCheck,
  Sparkles,
  Users,
  WalletCards,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { JoinGroupDialog } from "@/components/invitations/join-group-dialog";

const benefits = [
  {
    icon: Users,
    title: "Des groupes faciles à administrer",
    text: "Créez votre tontine, ajoutez les membres et gardez une vue claire des rôles, statuts et participations.",
  },
  {
    icon: CircleDollarSign,
    title: "Cotisations et tours mieux suivis",
    text: "Suivez les cycles, les montants attendus, les versements et les bénéficiaires sans dépendre de carnets dispersés.",
  },
  {
    icon: CalendarDays,
    title: "Réunions et présences au même endroit",
    text: "Planifiez les rencontres, consultez l’historique et gardez une trace simple des absences ou retards.",
  },
  {
    icon: FileDown,
    title: "Documents prêts à partager",
    text: "Générez des relevés et rapports pour faciliter les bilans, les vérifications et les échanges avec les membres.",
  },
];

const reasons = [
  "Une expérience pensée pour les responsables de tontines, pas pour les techniciens.",
  "Des tableaux de bord qui distinguent clairement les actions administrateur et membre.",
  "Une meilleure traçabilité pour réduire les oublis, les malentendus et les discussions répétitives.",
  "Un espace unique pour les invitations, cycles, rubriques, réunions, notifications et exports.",
];

const steps = [
  {
    title: "Créez le groupe",
    text: "Définissez le nom, la devise et les informations utiles à vos membres.",
  },
  {
    title: "Invitez les participants",
    text: "Partagez un lien d’invitation ou rejoignez directement une tontine existante.",
  },
  {
    title: "Pilotez les activités",
    text: "Suivez les cycles, les paiements, les réunions et les documents depuis le dashboard.",
  },
];

const faqs = [
  {
    question: "À qui s’adresse E-Tontine ?",
    answer:
      "Aux responsables et membres de tontines, associations, familles ou groupes d’épargne qui veulent mieux organiser les contributions et les tours.",
  },
  {
    question: "Un membre peut-il rejoindre un groupe sans tout configurer ?",
    answer:
      "Oui. L’application prévoit un parcours d’invitation pour rejoindre un groupe existant et accéder aux informations qui le concernent.",
  },
  {
    question: "L’application remplace-t-elle les échanges du groupe ?",
    answer:
      "Non. Elle sert de repère commun pour clarifier les montants, les dates, les statuts et les documents, afin que les échanges soient plus simples.",
  },
  {
    question: "Les rapports sont-ils utiles pour les bilans ?",
    answer:
      "Oui. Les exports et relevés disponibles dans l’application aident à préparer les points financiers et à partager une synthèse claire.",
  },
];

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="overflow-hidden">
      <section className="relative border-b border-black/10 bg-[#f7f4ee] dark:border-white/10 dark:bg-slate-950">
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(0deg,rgba(15,23,42,0.04)_1px,transparent_1px)] bg-[size:42px_42px]" />
        <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_0.92fr] lg:px-8 lg:py-20">
          <div className="max-w-3xl">
            <Badge className="border-slate-900/10 bg-white/70 text-slate-800 shadow-sm hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white">
              <Sparkles className="mr-1 h-3.5 w-3.5" />
              Pour les tontines qui veulent gagner en clarté
            </Badge>
            <h1 className="mt-6 text-balance text-5xl font-semibold leading-[0.96] tracking-normal text-slate-950 dark:text-white sm:text-6xl lg:text-7xl">
              Pilotez votre tontine avec moins d’oubli, plus de confiance.
            </h1>
            <p className="mt-6 max-w-2xl text-pretty text-lg leading-8 text-slate-700 dark:text-slate-300">
              E-Tontine aide les groupes d’épargne à organiser les membres, les cycles, les
              cotisations, les réunions et les justificatifs dans un espace clair, accessible aux
              administrateurs comme aux participants.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-12 bg-slate-950 px-6 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-white/90"
              >
                <Link href="/auth/register">
                  Commencer maintenant
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <JoinGroupDialog
                variant="outline"
                className="h-12 border-slate-300 bg-white/70 px-6 hover:bg-white dark:border-white/15 dark:bg-white/10 dark:hover:bg-white/15"
              />
            </div>
            <div className="mt-8 grid max-w-2xl gap-3 text-sm text-slate-700 dark:text-slate-300 sm:grid-cols-3">
              {["Cycles suivis", "Invitations simples", "Relevés partageables"].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-6 top-10 h-32 w-32 rounded-full bg-emerald-300/25 blur-3xl" />
            <div className="absolute -right-6 bottom-10 h-36 w-36 rounded-full bg-amber-300/25 blur-3xl" />
            <div className="relative rounded-[2rem] border border-slate-900/10 bg-slate-950 p-3 shadow-2xl shadow-slate-900/25">
              <div className="rounded-[1.5rem] bg-[#f8fafc] p-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-950 text-white">
                      <Landmark className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-950">Tontine Horizon</p>
                      <p className="text-xs text-slate-500">Tableau de bord du groupe</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                    Actif
                  </span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {[
                    ["Membres", "24", Users],
                    ["Tour en cours", "8/24", HandCoins],
                    ["Réunions", "3", CalendarDays],
                  ].map(([label, value, Icon]) => (
                    <div
                      key={label as string}
                      className="rounded-lg border border-slate-200 bg-white p-3"
                    >
                      <Icon className="h-4 w-4 text-slate-500" />
                      <p className="mt-3 text-xs text-slate-500">{label as string}</p>
                      <p className="text-xl font-semibold text-slate-950">{value as string}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-950">Suivi des cotisations</p>
                    <Badge className="bg-slate-950 text-white hover:bg-slate-950">En cours</Badge>
                  </div>
                  <div className="space-y-3">
                    {[
                      ["Awa Kamga", "À jour", "w-[88%]", "bg-emerald-500"],
                      ["Eric M.", "Reste à payer", "w-[52%]", "bg-amber-500"],
                      ["Nadia T.", "À vérifier", "w-[34%]", "bg-rose-500"],
                    ].map(([name, status, width, color]) => (
                      <div key={name as string}>
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-700">{name as string}</span>
                          <span className="text-slate-500">{status as string}</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100">
                          <div
                            className={`h-2 rounded-full ${width as string} ${color as string}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-slate-100 p-4">
                    <Bell className="h-4 w-4 text-slate-600" />
                    <p className="mt-2 text-sm font-semibold text-slate-950">Rappels et alertes</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Gardez le rythme des échéances importantes.
                    </p>
                  </div>
                  <div className="rounded-xl bg-amber-100 p-4">
                    <WalletCards className="h-4 w-4 text-amber-700" />
                    <p className="mt-2 text-sm font-semibold text-slate-950">Bilans lisibles</p>
                    <p className="mt-1 text-xs leading-5 text-slate-600">
                      Préparez vos points financiers plus vite.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-20 dark:bg-slate-900">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase text-amber-700">Problème / solution</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-normal text-slate-950 dark:text-white sm:text-4xl">
              Quand l’argent circule en groupe, la clarté devient essentielle.
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-[#fbfaf7] p-6 dark:border-white/10 dark:bg-white/5">
              <ClipboardList className="h-6 w-6 text-rose-600" />
              <h3 className="mt-5 text-lg font-semibold text-slate-950 dark:text-white">Avant</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Les paiements, présences, pénalités, invitations et bilans se retrouvent souvent
                répartis entre conversations, notes et feuilles séparées.
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-950 p-6 text-white dark:border-white/10">
              <ShieldCheck className="h-6 w-6 text-emerald-300" />
              <h3 className="mt-5 text-lg font-semibold">Avec E-Tontine</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Le groupe partage un repère commun: qui participe, où en est le cycle, quelles
                actions restent à faire et quels documents peuvent être consultés.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f7f4ee] py-20 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase text-amber-700">Fonctionnalités clés</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-normal text-slate-950 dark:text-white sm:text-4xl">
              Tout ce qu’un groupe doit suivre, présenté simplement.
            </h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {benefits.map((feature) => (
              <div
                key={feature.title}
                className="rounded-lg border border-slate-900/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5"
              >
                <feature.icon className="h-6 w-6 text-slate-950 dark:text-white" />
                <h3 className="mt-5 text-base font-semibold text-slate-950 dark:text-white">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {feature.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-20 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase text-emerald-300">
              Pourquoi choisir E-Tontine ?
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-normal sm:text-4xl">
              Une application pensée pour réduire les frictions du quotidien.
            </h2>
            <p className="mt-5 text-base leading-7 text-slate-300">
              Le but n’est pas d’ajouter de la complexité, mais de rendre chaque décision plus
              visible: qui doit agir, quel cycle avance, quel membre est concerné et quel document
              peut servir de référence.
            </p>
          </div>
          <div className="grid gap-3">
            {reasons.map((reason) => (
              <div
                key={reason}
                className="flex gap-3 rounded-lg border border-white/10 bg-white/5 p-4"
              >
                <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
                <p className="text-sm leading-6 text-slate-200">{reason}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase text-amber-700">Aperçu produit</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-normal text-slate-950 dark:text-white sm:text-4xl">
                Un dashboard lisible pour les admins, utile pour les membres.
              </h2>
              <p className="mt-5 text-base leading-7 text-slate-600 dark:text-slate-300">
                L’interface met en avant les groupes, les cycles, les statuts, les réunions et les
                actions importantes, sans noyer l’utilisateur dans des informations techniques.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-[#f7f4ee] p-4 shadow-xl shadow-slate-900/10 dark:border-white/10 dark:bg-slate-950">
              <div className="rounded-xl bg-white p-4 dark:bg-white/5">
                <div className="grid gap-3 sm:grid-cols-[12rem_1fr]">
                  <div className="rounded-lg bg-slate-950 p-4 text-white">
                    <p className="text-sm font-semibold">E-Tontine</p>
                    <div className="mt-6 space-y-2 text-sm text-slate-300">
                      {["Aperçu", "Membres", "Cycles", "Réunions", "Rapports"].map(
                        (item, index) => (
                          <div
                            key={item}
                            className={`rounded-md px-3 py-2 ${index === 0 ? "bg-white text-slate-950" : "bg-white/5"}`}
                          >
                            {item}
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-3">
                      {["Solde suivi", "À jour", "Actions"].map((item, index) => (
                        <div
                          key={item}
                          className="rounded-lg border border-slate-200 p-4 dark:border-white/10"
                        >
                          <p className="text-xs text-slate-500 dark:text-slate-400">{item}</p>
                          <p className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">
                            {index === 0 ? "Clair" : index === 1 ? "18/24" : "4"}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-lg border border-slate-200 p-4 dark:border-white/10">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-sm font-semibold text-slate-950 dark:text-white">
                          Activité récente
                        </p>
                        <Link
                          href="/auth/register"
                          className="text-xs font-semibold text-amber-700"
                        >
                          Essayer
                        </Link>
                      </div>
                      <div className="space-y-3">
                        {["Versement enregistré", "Réunion planifiée", "Rapport disponible"].map(
                          (item) => (
                            <div
                              key={item}
                              className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm dark:bg-white/5"
                            >
                              <span className="text-slate-700 dark:text-slate-200">{item}</span>
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f7f4ee] py-20 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase text-amber-700">Comment ça marche</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-normal text-slate-950 dark:text-white sm:text-4xl">
              Trois étapes pour rendre votre organisation plus fluide.
            </h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="rounded-lg border border-slate-900/10 bg-white p-6 dark:border-white/10 dark:bg-white/5"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-950 text-sm font-semibold text-white dark:bg-white dark:text-slate-950">
                  {index + 1}
                </span>
                <h3 className="mt-5 text-lg font-semibold text-slate-950 dark:text-white">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20 dark:bg-slate-900">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase text-amber-700">Questions fréquentes</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-normal text-slate-950 dark:text-white sm:text-4xl">
              Avant de lancer votre espace.
            </h2>
            <div className="mt-6 flex items-center gap-3 rounded-lg border border-slate-200 bg-[#f7f4ee] p-4 dark:border-white/10 dark:bg-white/5">
              <LockKeyhole className="h-5 w-5 text-slate-700 dark:text-slate-200" />
              <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                La landing reste volontairement centrée sur l’usage et la valeur pour les membres.
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {faqs.map((item) => (
              <div
                key={item.question}
                className="rounded-lg border border-slate-200 p-5 dark:border-white/10"
              >
                <div className="flex gap-3">
                  <MessageCircleQuestion className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
                  <div>
                    <h3 className="font-semibold text-slate-950 dark:text-white">
                      {item.question}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {item.answer}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-black/10 bg-slate-950 py-10 text-white dark:border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div>
            <div className="flex items-center gap-2 font-semibold">
              <Landmark className="h-5 w-5" />
              E-Tontine
            </div>
            <p className="mt-2 text-sm text-slate-400">
              Gestion simple et lisible des tontines de groupe.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-slate-300">
            <Link href="/auth/login" className="hover:text-white">
              Connexion
            </Link>
            <Link href="/auth/register" className="hover:text-white">
              Créer un compte
            </Link>
            <Link href="/" className="hover:text-white">
              Accueil
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
