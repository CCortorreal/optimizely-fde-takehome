# Commercial Surface Drift → Experiment

Watches commercial web pages (our own and the market's), reports what materially changed since a saved baseline, and hands the changes to Optimizely Opal agents that judge them and turn them into experiments.

- `src/`, `api/`: the deterministic tool (`watch_surfaces`, `inspect_surface`), an Opal tool registry on Vercel. No LLM: it reads raw HTML, drops noise, scores each change, and reports pages it could not read as unknown, never as unchanged.
- `watchlist.json`, `baselines.json`: which pages to watch, tagged `own` or `market`, and what each looked like at baseline.
- `opal/`: the rubric (the Opal Skill), both agent prompts and their output schemas, and the gold examples for the Quality tab.
- `fixture/`: Megastack, a fictional company's site on Cloudflare, with planted changes that serve as the answer key.

## Onboard a new company
1. Edit `watchlist.json`: their pages (`own`) and the market pages they care about (`market`).
2. Capture baselines: `node scripts/capture-baselines.ts live` (or a Wayback timestamp).
3. In the Opal workflow, set the `company` input: the company's name and its own page URLs.

No prompt changes: the rubric and prompts speak of `own` and `market`, never of a company. A test enforces it.

## Commands
- `npm test`, `npm run typecheck`
- `node scripts/opal-prompt.ts semantic-drift-evaluator | clip`: copy the paste-ready Opal prompt (rubric included)
- Deploy: push to `main` (Vercel). Fixture: `npx wrangler deploy`.
- Env: `WATCH_TOKEN` (bearer for the tool endpoints; the tools refuse every call when it is unset).
