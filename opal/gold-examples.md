# Gold examples (Quality tab, Semantic Drift Evaluator)
Each comes from a real run (10/22). "Must" items fail the case when missed.

1. **megastack-pricing (own):** cta_self_serve removed + cta_sales added → `cta_motion`, severity 5. Must say self-serve → sales-led and ask whether it was reviewed. Team $49 → $59 → `pricing` 4; promo removed → `offer` 4.
2. **megastack-home (own):** h1 changed → `positioning`, severity 3. Must not invent a strategy beyond the headline.
3. **zapier-pricing (market):** "Try it free" (main) → "Join Zapier Early Access" (nav). Must NOT call it a sales-motion change (rule 3); severity ≤ 2. H1 "Scalable automation…" → "AI orchestration plans…" → `positioning` 4.
4. **diligent-home (market):** "Start an ERM program" → /products/ai-risk-essentials, where `other`. Must NOT call it a trial or self-serve tier (rule 4). Title + H1 + headings → `positioning` 4.
5. **figma-pricing (market):** prices changed. Must NOT count tiers or seats (rule 5); promo removed → `offer` 4.
