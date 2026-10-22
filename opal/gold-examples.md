# Gold examples (Quality tab, Semantic Drift Evaluator)
Each comes from a real run (10/22). "Must" items fail the case when missed.

1. **megastack-pricing (own):** cta_self_serve removed + cta_sales added → `cta_motion`, severity 5. Must say self-serve → sales-led and ask whether it was reviewed. the prices shown changed $49 → $59 → `pricing` 4, and must not name a tier or plan (rule 5); promo removed → `offer` 4.
2. **megastack-home (own):** h1 changed → `positioning`, severity 3. Must not invent a strategy beyond the headline.
3. **zapier-pricing (market):** "Try it free" → "Join Zapier Early Access". Both are self-serve signups, so this is a campaign, not a sales-motion change (rule 3); severity 2–3. H1 "Scalable automation…" → "AI orchestration plans…" → `positioning` 4.
4. **diligent-home (market):** a self-serve CTA appears, "Start an ERM program" → /products/ai-risk-essentials, where `other`. At most a *possible* motion change, low confidence, severity ≤ 3 (rule 3); must NOT call it a trial or self-serve tier (rule 4). Title + H1 + headings → `positioning` 4.
5. **figma-pricing (market):** prices changed. Must NOT count tiers or seats (rule 5); promo removed → `offer` 4.
