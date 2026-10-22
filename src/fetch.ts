import { gunzipSync } from "node:zlib";

// An honest name: sites can see who we are and block us in robots.txt if they want to.
export const USER_AGENT = "SurfaceWatch/0.1 (+https://github.com/CCortorreal/optimizely-fde-takehome)";

// Never throws. A page we couldn't get comes back as status 0 with no HTML, and classify() reports it.
export async function fetchPage(url: string, opts: { timeoutMs?: number } = {}): Promise<{ status: number; html: string }> {
  try {
    const res = await fetch(url, {
      headers: { "user-agent": USER_AGENT },
      signal: AbortSignal.timeout(opts.timeoutMs ?? 4000), // 4 s per page keeps a whole watchlist under Opal's ~25 s budget
    });
    const bytes = Buffer.from(await res.arrayBuffer());
    // fetch unzips only when the server says "gzip"; Wayback sometimes sends gzip without saying so.
    // Every gzip file starts with the same two bytes (1f 8b), so we check for them.
    const body = bytes[0] === 0x1f && bytes[1] === 0x8b ? gunzipSync(bytes) : bytes;
    return { status: res.status, html: body.toString("utf8") };
  } catch {
    return { status: 0, html: "" };
  }
}
