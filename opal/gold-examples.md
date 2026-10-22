# Quality tab texts (Semantic Drift Evaluator, then Experiment Hypothesis Architect)
## Cases
Each comes from a real run (10/22). "Must" items fail the case when missed.

1. **megastack-pricing (own):** cta_self_serve removed + cta_sales added -> `cta_motion`, severity 5. Must say self-serve -> sales-led and ask whether it was reviewed. the prices shown changed $49 -> $59 -> `pricing` 4, and must not name a tier or plan (rule 5); promo removed -> `offer` 4.
2. **megastack-home (own):** h1 changed -> `positioning`, severity 3. Must not invent a strategy beyond the headline.
3. **zapier-pricing (market):** "Try it free" -> "Join Zapier Early Access". Both are self-serve signups, so this is a campaign, not a sales-motion change (rule 3); severity 2-3. H1 "Scalable automation..." -> "AI orchestration plans..." -> `positioning` 4.
4. **diligent-home (market):** a self-serve CTA appears, "Start an ERM program" -> /products/ai-risk-essentials, where `other`. At most a *possible* motion change, low confidence, severity <= 3 (rule 3); must NOT call it a trial or self-serve tier (rule 4). Title + H1 + headings -> `positioning` 4.
5. **figma-pricing (market):** prices changed. Must NOT count tiers or seats (rule 5); promo removed -> `offer` 4.

## Quality tab: paste-ready
Agent 1's Quality tab takes one-line criteria and examples of (input -> good output). Baseline 80%. Multi-turn samples: not used (the agent is single-turn).

### Criteria (Add Criterion, one per line)
1. Every finding quotes its field's before -> after as given in page_change; there is no finding for a field that is not in page_change.
2. A self-serve or sales CTA that appears or disappears is cta_motion, severity 5 on our own pages; new wording within the same motion is severity 2-3, never 5.
3. On our own pages, a price or promo change is severity 4 and the so_what asks whether it was reviewed; on market pages, the so_what names a test on one of our own pages and never recommends copying.
4. Prices are described as "the prices shown changed from X to Y", never as tiers, plans or seats; a link is not called a trial or free tier unless its text or URL says so.
5. Inferences are kept separate from observations and carry a confidence; nothing the tool cannot see (intent, announcements, approvals, traffic) is stated as fact.

### Examples (Add Example: Name, page_change, Output Example)
Real runs from 10/22, trimmed to the standard: `observed` is written in plain words, and the one overclaim ("an unannounced price increase") is removed.

#### Zapier pricing: a campaign, not a motion change
page_change:
```json
{"id": "zapier-pricing", "url": "https://zapier.com/pricing", "role": "market", "status": "ok", "materiality": 1, "changes": [{"field": "cta_self_serve", "kind": "changed", "before": {"text": "Try it free", "href": "/sign-up?from=logged-out-pricing-page-free", "where": "main"}, "after": {"text": "Join Zapier Early Access", "href": "/early-access", "where": "nav"}, "weight": 3}, {"field": "h1", "kind": "changed", "before": "Scalable automation for businesses of all sizes", "after": "AI orchestration plans that scale with you", "weight": 2}, {"field": "cta_sales", "kind": "changed", "before": {"text": "Contact Sales", "href": "https://zapier.com/l/contact-sales?demo_source=pricing-logged-out_teams", "where": "main"}, "after": {"text": "Contact sales", "href": "/l/contact-sales?demo_source=cs_nav_header", "where": "nav"}, "weight": 1}, {"field": "headings", "kind": "changed", "before": ["Workflow automation plans", "Free", "Professional", "Team", "Enterprise", "What you get with all paid plans"], "after": ["New: Your pricing works the same way everywhere you use Zapier.", "Compare all features", "All paid plans include", "Meet the platform", "Our commitment to flexible, risk-free pricing", "Frequently asked questions"], "weight": 1}, {"field": "social_proof", "kind": "changed", "before": 1, "after": 0, "weight": 1}]}
```
Output Example:
```json
{
  "id": "zapier-pricing",
  "role": "market",
  "findings": [
    {
      "field": "cta_self_serve",
      "category": "cta_motion",
      "severity": 2,
      "observed": "cta_self_serve: 'Try it free' (/sign-up, main) -> 'Join Zapier Early Access' (/early-access, nav)",
      "inferred": "New campaign wording within the self-serve motion: both are signups, so the way Zapier sells did not change.",
      "confidence": "medium",
      "so_what": "Test an early-access style CTA against our standard free-trial CTA on our pricing page."
    },
    {
      "field": "h1",
      "category": "positioning",
      "severity": 4,
      "observed": "h1: 'Scalable automation for businesses of all sizes' -> 'AI orchestration plans that scale with you'",
      "inferred": "Zapier is repositioning from workflow automation to AI orchestration; the headings move the same way ('Meet the platform').",
      "confidence": "high",
      "so_what": "Test an AI-focused headline against our current headline on our pricing page."
    },
    {
      "field": "cta_sales",
      "category": "cta_motion",
      "severity": 2,
      "observed": "cta_sales: 'Contact Sales' (main) -> 'Contact sales' (nav)",
      "inferred": "The sales CTA moved from the page body to the navigation; the motion is unchanged.",
      "confidence": "high",
      "so_what": "Test a sales CTA in our navigation against one in the plan grid on our pricing page."
    },
    {
      "field": "headings",
      "category": "positioning",
      "severity": 3,
      "observed": "headings: 'Workflow automation plans', 'Free', 'Professional', 'Team', 'Enterprise', ... -> 'New: Your pricing works the same way everywhere you use Zapier.', 'Compare all features', 'Meet the platform', ...",
      "inferred": "The page now leads with one platform-wide pricing message instead of a section per plan.",
      "confidence": "medium",
      "so_what": "Test a platform-wide comparison layout against per-plan sections on our pricing page."
    },
    {
      "field": "social_proof",
      "category": "proof",
      "severity": 1,
      "observed": "social_proof: 1 -> 0",
      "inferred": "One social proof element is gone, possibly in a layout cleanup.",
      "confidence": "low",
      "so_what": "No test on its own; watch whether it returns."
    }
  ],
  "top_severity": 4
}
```

#### Megastack pricing: our own page switched to sales
page_change:
```json
{"id": "megastack-pricing", "url": "https://megastack.cortorreal.fun/pricing/", "role": "own", "status": "ok", "materiality": 1, "changes": [{"field": "cta_self_serve", "kind": "removed", "before": {"text": "Start free trial", "href": "/signup/", "where": "header"}, "after": null, "weight": 3}, {"field": "cta_sales", "kind": "added", "before": null, "after": {"text": "Talk to sales", "href": "/contact-sales/", "where": "header"}, "weight": 3}, {"field": "promo", "kind": "removed", "before": "Save 20% on annual plans", "after": null, "weight": 2}, {"field": "prices", "kind": "changed", "before": ["$19", "$49"], "after": ["$19", "$59"], "weight": 3}]}
```
Output Example:
```json
{
  "id": "megastack-pricing",
  "role": "own",
  "findings": [
    {
      "field": "cta_self_serve",
      "category": "cta_motion",
      "severity": 5,
      "observed": "cta_self_serve: 'Start free trial' (/signup/, header) -> none",
      "inferred": "The self-serve signup is gone from the pricing page: the page no longer sells self-serve.",
      "confidence": "high",
      "so_what": "Confirm this was reviewed; if not, restore the trial or test it against the sales-led page before it stays."
    },
    {
      "field": "cta_sales",
      "category": "cta_motion",
      "severity": 5,
      "observed": "cta_sales: none -> 'Talk to sales' (/contact-sales/, header)",
      "inferred": "A sales-led path replaced the trial as the page's main call to action.",
      "confidence": "high",
      "so_what": "Confirm the motion change was reviewed and that sales can handle the inbound volume."
    },
    {
      "field": "promo",
      "category": "offer",
      "severity": 4,
      "observed": "promo: 'Save 20% on annual plans' -> none",
      "inferred": "Removing the annual discount is a 25% price rise for annual buyers, and annual customers churn less.",
      "confidence": "high",
      "so_what": "Confirm the discount removal was reviewed; watch annual plan uptake and churn."
    },
    {
      "field": "prices",
      "category": "pricing",
      "severity": 4,
      "observed": "prices: $19, $49 -> $19, $59",
      "inferred": "The prices shown changed from $19, $49 to $19, $59: a price rose.",
      "confidence": "high",
      "so_what": "Confirm the price change was reviewed; watch conversion from pricing to checkout."
    }
  ],
  "top_severity": 5
}
```

## Quality tab: Experiment Hypothesis Architect
Criteria only, one per rule of its prompt (added 10/22). No examples yet: a good example needs a real run's findings as input.

### Criteria (Add Criterion, one per line)
1. Writes at most 3 experiments, only from findings of severity 3 or higher; every other finding is listed in skipped with its id, field and the reason "severity below 3" or "over the cap of 3".
2. Every experiment runs on one of our own pages; for a market change it tests an idea on our page and never proposes copying the competitor's wording, prices or design.
3. For an own-page change, the control is the page before the change and the variant is the page after; it says the change should be reviewed and never claims it was or was not tested or reviewed.
4. The primary metric is one that both control and variant can move; a metric only one version can produce (sales leads when only the variant has a sales button) fails.
5. Baseline rate, minimum detectable effect and weekly visitors are stated and marked as assumptions; sample size and runtime come from exactly one exp_calculate_sample_size call per experiment, or are null with the reason in notes.
6. Each experiment's evidence copies its source findings' observed lines unchanged, and its hypothesis follows "If we (change) on (our page), then (metric) will (rise or fall), because (observed change)".
