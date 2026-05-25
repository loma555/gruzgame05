/**
 * Resolves public site URL without manual Vercel env (same pattern as gruzgame02 / gamegruz1).
 * Vercel injects VERCEL_PROJECT_PRODUCTION_URL (prod) and VERCEL_URL (preview) automatically.
 */
export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_URL) {
    return process.env.NEXT_PUBLIC_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

export function getSiteHost(): string {
  return new URL(getSiteUrl()).host;
}
