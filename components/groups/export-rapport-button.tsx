"use client";

import * as React from "react";
import { FileDown, FileText, Sheet } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

type Props = {
  groupId: string;
  groupeNom: string;
};

type Format = "pdf" | "excel";

export function ExportRapportButton({ groupId, groupeNom }: Props) {
  const [loading, setLoading] = React.useState<Format | null>(null);

  const handleExport = async (format: Format) => {
    if (loading) return;
    setLoading(format);

    try {
      const res = await fetch(`/api/groups/${groupId}/rapport?format=${format}`);

      if (!res.ok) {
        const err = await res.json().catch(() => null) as null | { error?: string };
        toast.error(err?.error ?? "Impossible de générer le rapport.");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const slugNom = groupeNom.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      a.download = format === "pdf" ? `rapport-${slugNom}.pdf` : `rapport-${slugNom}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(
        format === "pdf"
          ? "📄 Rapport PDF téléchargé !"
          : "📊 Rapport Excel téléchargé !",
      );
    } catch {
      toast.error("Erreur lors du téléchargement.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => handleExport("pdf")}
        disabled={!!loading}
        className="gap-2"
      >
        {loading === "pdf" ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
        ) : (
          <FileText className="h-4 w-4 text-red-500" />
        )}
        {loading === "pdf" ? "Génération PDF…" : "Exporter PDF"}
      </Button>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => handleExport("excel")}
        disabled={!!loading}
        className="gap-2"
      >
        {loading === "excel" ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
        ) : (
          <Sheet className="h-4 w-4 text-green-600" />
        )}
        {loading === "excel" ? "Génération Excel…" : "Exporter Excel"}
      </Button>
    </div>
  );
}

// Bouton compact avec dropdown (icône seule)
export function ExportRapportIconButton({ groupId, groupeNom }: Props) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState<Format | null>(null);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleExport = async (format: Format) => {
    setOpen(false);
    if (loading) return;
    setLoading(format);

    try {
      const res = await fetch(`/api/groups/${groupId}/rapport?format=${format}`);
      if (!res.ok) {
        const err = await res.json().catch(() => null) as null | { error?: string };
        toast.error(err?.error ?? "Impossible de générer le rapport.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const slugNom = groupeNom.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      a.download = format === "pdf" ? `rapport-${slugNom}.pdf` : `rapport-${slugNom}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(format === "pdf" ? "📄 Rapport PDF téléchargé !" : "📊 Rapport Excel téléchargé !");
    } catch {
      toast.error("Erreur lors du téléchargement.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div ref={ref} className="relative">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen((v) => !v)}
        disabled={!!loading}
        className="gap-1.5"
      >
        {loading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
        ) : (
          <FileDown className="h-4 w-4" />
        )}
        {loading ? "Génération…" : "Rapport financier"}
      </Button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900">
          <button
            type="button"
            onClick={() => handleExport("pdf")}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <FileText className="h-4 w-4 text-red-500" />
            Télécharger PDF
          </button>
          <button
            type="button"
            onClick={() => handleExport("excel")}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <Sheet className="h-4 w-4 text-green-600" />
            Télécharger Excel
          </button>
        </div>
      )}
    </div>
  );
}
