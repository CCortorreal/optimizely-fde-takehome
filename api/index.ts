import { watchSurfaces } from "../src/watch.ts";
import { fetchPage } from "../src/fetch.ts";
import { extractSurface } from "../src/surface.ts";
import { classify } from "../src/classify.ts";

// The menu Opal reads when the tool is registered. Agents choose a tool by these descriptions, so they say when to use it.
const discovery = {
  functions: [
    {
      name: "watch_surfaces",
      description:
        "Checks the watched commercial web pages (Megastack's own and three market pages) against their saved baselines and returns only material changes: headline, calls to action per sales motion (self-serve vs sales), prices, promos, section headings, social proof, structured data. Pages it could not read are reported as unknown, never as unchanged.",
      parameters: [
        { name: "ids", type: "array", description: "Only check these page ids (default: all watched pages)", required: false },
        { name: "min_materiality", type: "number", description: "Only return pages scoring at least this, 0 to 1 (default 0.25)", required: false },
        { name: "max_changes_per_page", type: "integer", description: "At most this many changes per page, biggest first (default 6)", required: false },
      ],
      endpoint: "/tools/watch_surfaces",
      http_method: "POST",
    },
    {
      name: "inspect_surface",
      description:
        "Reads one web page right now and returns its commercial surface (title, headline, calls to action, prices, promo, headings, social proof) plus whether it could be read. Use it to answer 'what does this page say today?'.",
      parameters: [{ name: "url", type: "string", description: "Full http(s) URL of the page", required: true }],
      endpoint: "/tools/inspect_surface",
      http_method: "POST",
    },
  ],
};

export default {
  async fetch(request: Request) {
    const path = new URL(request.url).pathname;
    if (request.method === "GET" && path === "/discovery") return Response.json(discovery);
    if (request.method !== "POST" || !path.startsWith("/tools/")) return Response.json({ error: "not found", path }, { status: 404 });

    // Fail closed: with no token configured, the tools refuse everyone rather than serve anyone.
    const token = process.env.WATCH_TOKEN;
    if (!token) return Response.json({ error: "WATCH_TOKEN is not set on the server" }, { status: 503 });
    if (request.headers.get("authorization") !== `Bearer ${token}`) return Response.json({ error: "unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const params = body?.parameters ?? {}; // Opal wraps arguments in "parameters" (SDK service.js:120)

    if (path === "/tools/watch_surfaces") return Response.json(await watchSurfaces(params));
    if (path === "/tools/inspect_surface") {
      const url = String(params.url ?? "");
      if (!/^https?:\/\//.test(url)) return Response.json({ error: "url must start with http:// or https://" }, { status: 400 });
      const page = await fetchPage(url);
      const surface = extractSurface(page.html, url, url);
      return Response.json({ url, status: classify(page.status, page.html, surface), surface });
    }
    return Response.json({ error: "no such tool", path }, { status: 404 });
  },
};
