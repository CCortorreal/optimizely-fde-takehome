import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { watchSurfaces } from "../src/watch.ts";
import { extractSurface } from "../src/surface.ts";
import { classify } from "../src/classify.ts";
import api from "../api/index.ts";
import watchlist from "../watchlist.json" with { type: "json" };
import baselines from "../baselines.json" with { type: "json" };

const v1 = readFileSync(new URL("./fixtures/megastack-pricing.html", import.meta.url), "utf8");
const v2 = v1.replace('<p class="promo">Save 20% on annual plans</p>', "").replace("$49", "$59");
const list = [
  { id: "same", url: "https://same.test/", role: "own" },
  { id: "moved", url: "https://moved.test/", role: "market" },
  { id: "walled", url: "https://walled.test/", role: "market" },
  { id: "polite", url: "https://polite.test/", role: "market" },
];
const baseline = { captured_from: "test", surface: extractSurface(v1, "", "") };
const bases = { same: baseline, moved: baseline, walled: baseline, polite: baseline };
// A pretend internet: each site answers the same way every time.
const fakeFetch = async (url: string) => {
  if (url === "https://polite.test/robots.txt") return { status: 200, html: "User-agent: *\nDisallow: /", url };
  if (url.endsWith("/robots.txt")) return { status: 404, html: "", url };
  if (url.startsWith("https://moved.test")) return { status: 200, html: v2, url };
  if (url.startsWith("https://walled.test")) return { status: 403, html: "", url };
  return { status: 200, html: v1, url };
};

describe("watchSurfaces", () => {
  it("returns only material changes, and counts every page in coverage", async () => {
    const r = await watchSurfaces({}, fakeFetch, list, bases);
    expect(r.changes.map((c) => c.id)).toEqual(["moved"]);
    expect(r.changes[0].materiality).toBe(5 / 8);
    expect(r.coverage).toEqual({ total: 4, ok: 2, unrendered: 0, blocked: 2, failed: 0, quiet: 1 });
    expect(r.summary).toContain("Could not read: walled (blocked), polite (blocked); these are unknown, not unchanged.");
  });

  it("keeps the biggest changes when a page has more than the limit", async () => {
    const r = await watchSurfaces({ ids: ["moved"], max_changes_per_page: 1 }, fakeFetch, list, bases);
    expect(r.changes[0].changes).toMatchObject([{ field: "prices", weight: 3 }]);
  });

  it("stays small enough for an agent's context even when every page changed a lot", async () => {
    const huge = `<main><h1>${"New headline ".repeat(50)}</h1>${Array.from({ length: 40 }, (_, i) => `<h2>Section ${i} ${"x".repeat(200)}</h2><p>$${i}</p>`).join("")}</main>`;
    const many = Array.from({ length: 20 }, (_, i) => ({ id: `p${i}`, url: `https://p${i}.test/`, role: "market" }));
    const r = await watchSurfaces({}, async (url) => ({ status: 200, html: url.endsWith("robots.txt") ? "" : huge, url }), many,
      Object.fromEntries(many.map((m) => [m.id, baseline])));
    expect(r.changes).toHaveLength(20);
    expect(JSON.stringify(r).length).toBeLessThan(60_000);
  });

  it("every watched page has a baseline that was read properly", () => {
    for (const { id } of watchlist) {
      const b = (baselines as Record<string, { captured_from: string; surface: { h1: string | null; word_count: number } }>)[id];
      expect(b, id).toBeDefined();
      expect(b.captured_from).toMatch(/^https:\/\/(web\.archive\.org\/web\/\d{14}id_\/|megastack\.cortorreal\.fun\/)/); // Wayback, or our own live site
      expect(classify(200, "", b.surface), id).toBe("ok"); // the same "readable page" rule the tool uses, not a size guess
    }
  });
});

describe("api", () => {
  const call = (path: string, init: RequestInit = {}) => api.fetch(new Request(`https://tool.test${path}`, init));
  beforeEach(() => void (process.env.WATCH_TOKEN = "test-token"));
  afterEach(() => void delete process.env.WATCH_TOKEN);

  it("serves the discovery menu without a token", async () => {
    const menu = await (await call("/discovery")).json();
    expect(menu.functions.map((f: { name: string }) => f.name)).toEqual(["watch_surfaces", "inspect_surface"]);
  });

  it("refuses tool calls without the right token, and refuses everyone when no token is configured", async () => {
    expect((await call("/tools/watch_surfaces", { method: "POST" })).status).toBe(401);
    expect((await call("/tools/watch_surfaces", { method: "POST", headers: { authorization: "Bearer wrong" } })).status).toBe(401);
    delete process.env.WATCH_TOKEN;
    expect((await call("/tools/watch_surfaces", { method: "POST", headers: { authorization: "Bearer test-token" } })).status).toBe(503);
  });

  it("rejects an inspect_surface url that is not http(s)", async () => {
    const res = await call("/tools/inspect_surface", {
      method: "POST",
      headers: { authorization: "Bearer test-token" },
      body: JSON.stringify({ parameters: { url: "file:///etc/passwd" } }),
    });
    expect(res.status).toBe(400);
  });
});
