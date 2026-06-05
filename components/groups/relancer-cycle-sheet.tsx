"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { CreateCycleForm } from "@/components/groups/create-cycle-form";

type RelancerCycleSheetProps = {
  groupId: string;
};

export function RelancerCycleSheet({ groupId }: RelancerCycleSheetProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" className="mt-3 gap-1.5">
          <RefreshCw className="h-4 w-4" />
          Relancer un cycle
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Démarrer un nouveau cycle</SheetTitle>
        </SheetHeader>
        <div className="mt-4">
          <CreateCycleForm
            groupId={groupId}
            canManage={true}
            onSuccess={() => {
              setOpen(false);
              router.push(`/dashboard/groups/${groupId}/cycles`);
            }}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
