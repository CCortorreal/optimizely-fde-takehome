import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createServer, type Server } from "node:http";
import { gzipSync } from "node:zlib";
import { fetchPage } from "../src/fetch.ts";
import { classify } from "../src/classify.ts";
import { isAllowed } from "../src/robots.ts";

// A tiny local web server so the fetch tests never touch the internet.
let server: Server;
let base = "";
beforeAll(async () => {
  server = createServer((req, res) => {
    const page = "<html><body><h1>Hello</h1></body></html>";
    if (req.url === "/slow") return void setTimeout(() => res.end(page), 500);
    if (req.url === "/gzip-labelled") { res.setHeader("content-encoding", "gzip"); return void res.end(gzipSync(page)); }
    if (req.url === "/gzip-unlabelled") return void res.end(gzipSync(page)); // what Wayback's id_ pages do
    res.end(page);
  });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
});
afterAll(() => server.close());

describe("fetchPage", () => {
  it("gives up at the time limit and returns 'nothing' instead of crashing", async () => {
    expect(await fetchPage(`${base}/slow`, { timeoutMs: 100 })).toEqual({ status: 0, html: "" });
  });

  it("unzips gzip whether or not the server says it is gzip", async () => {
    for (const path of ["/gzip-labelled", "/gzip-unlabelled"]) {
      const page = await fetchPage(base + path);
      expect(page.status).toBe(200);
      expect(page.html).toContain("<h1>Hello</h1>");
    }
  });
});

describe("classify", () => {
  const real = { h1: "Pricing", word_count: 900 };
  it("ok: a normal page", () => expect(classify(200, "<html>", real)).toBe("ok"));
  it("blocked: the site refused us", () => {
    for (const code of [401, 403, 429, 503]) expect(classify(code, "", real)).toBe("blocked");
    expect(classify(200, "<title>Just a moment...</title><div id=cf-chl-widget>", real)).toBe("blocked");
    expect(classify(200, "<p>Please verify you are human</p>", real)).toBe("blocked");
  });
  it("failed: we never got a page (timeout, network, 404, 500)", () => {
    for (const code of [0, 404, 500]) expect(classify(code, "", real)).toBe("failed");
  });
  it("unrendered: a page came back but there is almost nothing to read", () => {
    expect(classify(200, "<div id=root>", { h1: null, word_count: 12 })).toBe("unrendered");
    expect(classify(200, "<h1>Hi</h1>", { h1: "Hi", word_count: 30 })).toBe("unrendered");
    expect(classify(200, "<h1>Hi</h1>", { h1: "Hi", word_count: 120 })).toBe("ok"); // short but real
  });
});

describe("isAllowed (robots.txt)", () => {
  const UA = "SurfaceWatch/0.1";
  it("no robots.txt means everything is allowed", () => expect(isAllowed("https://x.test/pricing", "", UA)).toBe(true));
  it("Disallow: / for everyone blocks us", () => expect(isAllowed("https://x.test/pricing", "User-agent: *\nDisallow: /", UA)).toBe(false));
  it("a group naming our bot beats the * group", () => {
    const txt = "User-agent: *\nAllow: /\n\nUser-agent: SurfaceWatch\nDisallow: /";
    expect(isAllowed("https://x.test/pricing", txt, UA)).toBe(false);
  });
  it("only the listed paths are off limits", () => {
    const txt = "User-agent: *\nDisallow: /admin\nDisallow: /*?preview=";
    expect(isAllowed("https://x.test/pricing", txt, UA)).toBe(true);
    expect(isAllowed("https://x.test/admin/users", txt, UA)).toBe(false);
    expect(isAllowed("https://x.test/pricing?preview=1", txt, UA)).toBe(false);
  });
  it("the most specific rule wins", () => {
    const txt = "User-agent: *\nDisallow: /p\nAllow: /pricing";
    expect(isAllowed("https://x.test/pricing", txt, UA)).toBe(true);
    expect(isAllowed("https://x.test/partners", txt, UA)).toBe(false);
  });
});
