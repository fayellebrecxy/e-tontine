export function normalizeNextPath(next?: string | null, fallback = "/dashboard") {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return fallback;
  }

  return next;
}
