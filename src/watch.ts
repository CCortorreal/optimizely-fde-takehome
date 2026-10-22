import watchlistFile from "../watchlist.json" with { type: "json" };
import baselinesFile from "../baselines.json" with { type: "json" };
import { fetchPage, USER_AGENT } from "./fetch.ts";
import { extractSurface, type Surface } from "./surface.ts";
import { classify, type Status } from "./classify.ts";
import { compare, type Change } from "./diff.ts";
import { isAllowed } from "./robots.ts";

type Entry = { id: string; url: string; role: string };
type Baselines = Record<string, { captured_from: string; surface: Surface }>;
type Params = { ids?: string[]; min_materiality?: number; max_changes_per_page?: number };
type PageResult = { id: string; url: string; role: string; status: Status; materiality: number | null; changes: Change[]; note?: string };

// The whole job: fetch every watched page at once, read it, compare with its baseline, keep what matters.
// The fetcher and the lists can be swapped in tests so they never touch the internet.
export async function watchSurfaces(
  params: Params = {},
  fetcher: typeof fetchPage = fetchPage,
  watchlist: Entry[] = watchlistFile,
  baselines: Baselines = baselinesFile as Baselines,
) {
  const min = params.min_materiality ?? 0.25;
  const max = params.max_changes_per_page ?? 6;
  const entries = watchlist.filter((e) => !params.ids?.length || params.ids.includes(e.id));

  const results: PageResult[] = await Promise.all(
    entries.map(async (e): Promise<PageResult> => {
      const base = { id: e.id, url: e.url, role: e.role };
      const robots = await fetcher(new URL("/robots.txt", e.url).href);
      if (robots.status === 200 && !isAllowed(e.url, robots.html, USER_AGENT)) {
        return { ...base, status: "blocked", materiality: null, changes: [], note: "robots.txt asks bots like us not to read this page" };
      }
      const baseline = baselines[e.id];
      if (!baseline) return { ...base, status: "failed", materiality: null, changes: [], note: "no baseline saved for this page" };
      const page = await fetcher(e.url);
      const surface = extractSurface(page.html, e.url, e.id);
      const result = compare(baseline.surface, surface, classify(page.status, page.html, surface));
      // Biggest changes first, and only a few per page, so one noisy page can't flood the agent's context.
      const changes = [...result.changes].sort((a, b) => b.weight - a.weight).slice(0, max);
      return { ...base, status: result.status, materiality: result.materiality, changes };
    }),
  );

  const material = results.filter((r) => r.materiality !== null && r.materiality >= min);
  const count = (s: Status) => results.filter((r) => r.status === s).length;
  const coverage = {
    total: results.length,
    ok: count("ok"),
    unrendered: count("unrendered"),
    blocked: count("blocked"),
    failed: count("failed"),
    quiet: results.filter((r) => r.status === "ok" && (r.materiality ?? 0) < min).length, // read fine, nothing above the bar
  };
  const unreadable = results.filter((r) => r.status !== "ok").map((r) => `${r.id} (${r.status})`);
  const summary =
    `Read ${coverage.ok} of ${coverage.total} pages. ` +
    (material.length ? `Material changes on ${material.map((r) => `${r.id} (${r.materiality!.toFixed(2)})`).join(", ")}.` : "No material changes.") +
    (unreadable.length ? ` Could not read: ${unreadable.join(", ")}; these are unknown, not unchanged.` : "");
  return { changes: material, coverage, summary };
}
