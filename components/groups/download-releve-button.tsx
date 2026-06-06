"use client";

import * as React from "react";
import { FileDown } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

type Props = {
  groupId: string;
  membreId: string;
  membreNom: string;
  variant?: "icon" | "full";
};

export function DownloadReleveButton({
  groupId,
  membreId,
  membreNom,
  variant = "full",
}: Props) {
  const [loading, setLoading] = React.useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/groups/${groupId}/membres/${membreId}/releve-pdf`,
      );

      if (!res.ok) {
        const err = await res.json().catch(() => null) as null | { error?: string };
        toast.error(err?.error ?? "Impossible de générer le relevé.");
        return;
      }

      // Déclencher le téléchargement
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        res.headers.get("Content-Disposition")?.split('filename="')[1]?.replace('"', "") ??
        `releve-${membreNom.toLowerCase().replace(/\s+/g, "-")}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`📄 Relevé de ${membreNom} téléchargé !`);
    } catch {
      toast.error("Erreur lors du téléchargement.");
    } finally {
      setLoading(false);
    }
  };

  if (variant === "icon") {
    return (
      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={handleDownload}
        disabled={loading}
        title={`Télécharger le relevé de ${membreNom}`}
        aria-label={`Télécharger le relevé de ${membreNom}`}
      >
        {loading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
        ) : (
          <FileDown className="h-4 w-4" />
        )}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleDownload}
      disabled={loading}
      className="gap-1.5"
    >
      {loading ? (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
      ) : (
        <FileDown className="h-3.5 w-3.5" />
      )}
      {loading ? "Génération…" : "Mon relevé PDF"}
    </Button>
  );
}
