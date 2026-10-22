// Run once, by hand: node scripts/capture-baselines.ts [wayback-timestamp]
// Reads each watchlist page as it was on that date (Wayback Machine) and saves its surface to baselines.json.
// The scheduled run never calls Wayback (it takes ~5 s); it only compares live pages against this file.
import { readFileSync, writeFileSync } from "node:fs";
import { fetchPage } from "../src/fetch.ts";
import { extractSurface } from "../src/surface.ts";
import { classify } from "../src/classify.ts";

const when = process.argv[2] ?? "20250301000000";
const watchlist: { id: string; url: string }[] = JSON.parse(readFileSync("watchlist.json", "utf8"));
const out: Record<string, unknown> = {};
for (const { id, url } of watchlist) {
  // "id_" asks Wayback for the original page, without its toolbar; it redirects to the nearest snapshot.
  const page = await fetchPage(`https://web.archive.org/web/${when}id_/${url}`, { timeoutMs: 30_000 });
  const surface = extractSurface(page.html, url, id);
  const status = classify(page.status, page.html, surface);
  if (status !== "ok") throw new Error(`${id}: ${status} (HTTP ${page.status}); not saving a bad baseline`);
  out[id] = { captured_from: page.url, surface };
  console.log(id, "<-", page.url);
}
writeFileSync("baselines.json", JSON.stringify(out, null, 2) + "\n");
