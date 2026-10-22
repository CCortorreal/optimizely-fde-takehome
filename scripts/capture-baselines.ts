// Run by hand, rarely:
//   node scripts/capture-baselines.ts 20250301000000 zapier-pricing ...   page as it was on that date (Wayback Machine)
//   node scripts/capture-baselines.ts live megastack-home ...             page as it is right now
// No ids means every watched page. Results are merged into baselines.json; other entries are kept.
// The scheduled run never calls this (Wayback takes ~5 s); it only compares live pages against baselines.json.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fetchPage } from "../src/fetch.ts";
import { extractSurface } from "../src/surface.ts";
import { classify } from "../src/classify.ts";

const [when = "20250301000000", ...ids] = process.argv.slice(2);
const watchlist: { id: string; url: string }[] = JSON.parse(readFileSync("watchlist.json", "utf8"));
const out: Record<string, unknown> = existsSync("baselines.json") ? JSON.parse(readFileSync("baselines.json", "utf8")) : {};
for (const { id, url } of watchlist.filter((e) => !ids.length || ids.includes(e.id))) {
  // "id_" asks Wayback for the original page, without its toolbar; it redirects to the nearest snapshot.
  const source = when === "live" ? url : `https://web.archive.org/web/${when}id_/${url}`;
  const page = await fetchPage(source, { timeoutMs: 30_000 });
  const surface = extractSurface(page.html, url, id);
  const status = classify(page.status, page.html, surface);
  if (status !== "ok") throw new Error(`${id}: ${status} (HTTP ${page.status}); not saving a bad baseline`);
  out[id] = { captured_from: when === "live" ? `${page.url} @ ${new Date().toISOString()}` : page.url, surface };
  console.log(id, "<-", out[id] && (out[id] as { captured_from: string }).captured_from);
}
writeFileSync("baselines.json", JSON.stringify(out, null, 2) + "\n");
