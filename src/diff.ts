import type { Surface } from "./surface.ts";
import type { Status } from "./classify.ts";

// How much each kind of change matters (Carlos, 10/22). word_count is not here on purpose:
// it decides whether a page could be read at all (classify), and is never reported as a change.
export const WEIGHTS = {
  cta: 3, // the sales motion changed
  prices: 3, // the offer changed
  h1: 2, // the main message
  promo: 2, // the deal changed
  title: 1,
  headings: 1, // includes a reorder: reordering value props is a signal marketers watch
  schema_org: 1,
  social_proof: 1,
  cta_moved: 1, // same words, new place on the page (a new link alone scores 0: real links churn tracking tags and language codes)
};
const FULL_SCORE = 8; // a CTA change plus a price change plus a bit more = as material as it gets

type Field = "title" | "h1" | "cta_self_serve" | "cta_sales" | "headings" | "promo" | "prices" | "schema_org" | "social_proof";
export type Change = { field: Field; kind: "changed" | "added" | "removed"; before: unknown; after: unknown; weight: number };

// Only an "ok" page is compared. Anything else reports its status and materiality null ("unknown"), never 0 ("no change").
export function compare(baseline: Surface, current: Surface, status: Status) {
  if (status !== "ok") return { status, changes: [] as Change[], materiality: null };
  const changes = diffSurface(baseline, current);
  return { status, changes, materiality: materiality(changes) };
}

export function diffSurface(a: Surface, b: Surface): Change[] {
  const out: Change[] = [];
  const add = (field: Field, before: unknown, after: unknown, weight: number) =>
    out.push({ field, kind: before == null ? "added" : after == null ? "removed" : "changed", before, after, weight });

  if (norm(a.title) !== norm(b.title)) add("title", a.title, b.title, WEIGHTS.title);
  if (norm(a.h1) !== norm(b.h1)) add("h1", a.h1, b.h1, WEIGHTS.h1);
  for (const motion of ["self_serve", "sales"] as const) {
    const [x, y] = [a.ctas[motion], b.ctas[motion]];
    const weight = ctaWeight(x, y);
    if (weight > 0) add(`cta_${motion}`, x, y, weight);
  }
  if (a.headings.map(norm).join("|") !== b.headings.map(norm).join("|")) add("headings", a.headings, b.headings, WEIGHTS.headings);
  if (norm(a.promo) !== norm(b.promo)) add("promo", a.promo, b.promo, WEIGHTS.promo);
  // Prices compared as a set: the same prices in a new order is not a new offer.
  if ([...a.prices].sort().join() !== [...b.prices].sort().join()) add("prices", a.prices, b.prices, WEIGHTS.prices);
  if (a.schema_org !== b.schema_org) add("schema_org", a.schema_org, b.schema_org, WEIGHTS.schema_org);
  if (a.social_proof !== b.social_proof) add("social_proof", a.social_proof, b.social_proof, WEIGHTS.social_proof);
  return out;
}

export function materiality(changes: Change[]): number {
  return Math.min(1, changes.reduce((sum, c) => sum + c.weight, 0) / FULL_SCORE);
}

type Cta = Surface["ctas"]["self_serve"];
function ctaWeight(x: Cta, y: Cta): number {
  if (!x && !y) return 0;
  if (!x || !y || norm(x.text) !== norm(y.text)) return WEIGHTS.cta;
  // "other" means we couldn't tell where it was, so a move to or from "other" is not evidence of a move.
  if (x.where !== y.where && x.where !== "other" && y.where !== "other") return WEIGHTS.cta_moved;
  return 0;
}

// Same words = same text: ignore case, spacing and curly vs straight quotes.
function norm(s: string | null): string | null {
  return s == null ? null : s.toLowerCase().replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, " ").trim();
}
