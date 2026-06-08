import Link from "next/link";
import { Landmark, PlusCircle, Search } from "lucide-react";

import { JoinGroupDialog } from "@/components/invitations/join-group-dialog";
import { Button } from "@/components/ui/button";

export default function GroupsIndexPage() {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm dark:border-white/15 dark:bg-white/5">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-md bg-[#f6f4ef] text-slate-700 dark:bg-white/10 dark:text-white">
        <Landmark className="h-7 w-7" />
      </div>
      <h1 className="mt-5 text-xl font-semibold tracking-normal text-slate-950 dark:text-white">
        Sélectionnez un groupe
      </h1>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
        Choisissez un groupe dans la liste pour consulter ses membres, cycles, réunions et actions
        de gestion.
      </p>
      <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
        <Button asChild>
          <Link href="/dashboard/groups/new">
            <PlusCircle className="h-4 w-4" />
            Créer un groupe
          </Link>
        </Button>
        <JoinGroupDialog variant="outline" />
      </div>
      <div className="mx-auto mt-6 flex max-w-md items-center gap-2 rounded-md bg-[#fbfaf7] px-4 py-3 text-left text-xs text-slate-500 dark:bg-white/5 dark:text-slate-400">
        <Search className="h-4 w-4 shrink-0" />
        La recherche de groupe est disponible dans le panneau latéral sur grand écran.
      </div>
    </div>
  );
}
