"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface JoinGroupDialogProps {
  variant?: "default" | "outline" | "ghost" | "sm";
  className?: string;
}

export function JoinGroupDialog({ variant = "outline", className }: JoinGroupDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");
  const router = useRouter();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    let code = inputValue.trim();

    // Si c'est un lien complet, on essaie d'extraire le code
    try {
      if (code.includes("/invitations/")) {
        const url = new URL(code);
        const parts = url.pathname.split("/");
        const codeIndex = parts.indexOf("invitations") + 1;
        if (codeIndex < parts.length) {
          code = parts[codeIndex];
        }
      }
    } catch (e) {
      // Pas une URL valide, on considère que c'est le code direct
    }

    setOpen(false);
    setInputValue("");
    router.push(`/invitations/${encodeURIComponent(code)}`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant === "sm" ? "outline" : variant} size={variant === "sm" ? "sm" : "default"} className={className}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Rejoindre un groupe
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleJoin}>
          <DialogHeader>
            <DialogTitle>Rejoindre un groupe</DialogTitle>
            <DialogDescription>
              Entrez le code d&apos;invitation ou collez le lien complet pour rejoindre une tontine.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="code">Lien ou code d&apos;invitation</Label>
              <Input
                id="code"
                placeholder="Ex: https://e-tontine.com/invitations/abc-123"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!inputValue.trim()}>
              Continuer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
