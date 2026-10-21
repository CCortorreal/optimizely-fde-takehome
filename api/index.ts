// api/index.ts: the one function behind every URL (vercel.json sends all paths here)

const discovery = {
  functions: [
    {
      name: "ping",
      description: "Waits delay_ms milliseconds, then replies. Test tool for connectivity and timeouts.",
      parameters: [
        { name: "delay_ms", type: "integer", description: "How long to wait, in milliseconds (max 120000)", required: true },
      ],
      endpoint: "/tools/ping",
      http_method: "POST",
    },
  ],
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default {
  async fetch(request: Request) {
    const path = new URL(request.url).pathname;

    if (request.method === "GET" && path === "/discovery") {
      return Response.json(discovery);
    }

    if (request.method === "POST" && path === "/tools/ping") {
      const body = await request.json().catch(() => ({}));
      const asked = Number(body?.parameters?.delay_ms ?? 0);
      const delay = Math.min(Math.max(asked, 0), 120_000);
      const started = Date.now();
      await sleep(delay);
      return Response.json({ ok: true, asked, waited_ms: Date.now() - started });
    }

    return Response.json({ error: "not found", path }, { status: 404 });
  },
};
