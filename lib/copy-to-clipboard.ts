/**
 * Copie un texte dans le presse-papiers avec repli si l'API Clipboard est indisponible
 * (HTTP, permissions refusées, certains navigateurs / contextes embarqués).
 */
export async function copyTextToClipboard(
  text: string,
  sourceElement?: HTMLInputElement | HTMLTextAreaElement | null,
): Promise<boolean> {
  if (typeof window === "undefined" || !text) return false;

  if (window.isSecureContext && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Repli ci-dessous
    }
  }

  if (sourceElement) {
    try {
      sourceElement.focus();
      sourceElement.select();
      sourceElement.setSelectionRange(0, text.length);
      const ok = document.execCommand("copy");
      window.getSelection()?.removeAllRanges();
      if (ok) return true;
    } catch {
      // Repli ci-dessous
    }
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "0";
    textarea.style.left = "0";
    textarea.style.opacity = "0";
    textarea.style.pointerEvents = "none";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, text.length);
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}
