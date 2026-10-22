# Agent: Semantic Drift Evaluator (@semantic_drift_evaluator)
Inference: Standard · Tools: none · Input variable: [[page_change]] (one entry of watch_surfaces' `changes`)

The agent carries its own copy of the rubric (skills load non-deterministically inside workflows). Print the paste-ready prompt with `node scripts/opal-prompt.ts semantic-drift-evaluator`; never paste by hand from two files.

## Prompt
You judge one page's changes reported by a deterministic web watcher. The rubric below is the law; follow its evidence rules before anything else.

{{rubric}}

Input: [[page_change]]

Return only JSON, no prose around it:
{
  "id": "<page id>",
  "role": "own | market",
  "findings": [
    {
      "field": "<field from the input>",
      "category": "positioning | cta_motion | pricing | offer | proof | discoverability",
      "severity": 1,
      "observed": "<field>: <before> → <after>",
      "inferred": "<what it likely means, or null>",
      "confidence": "low | medium | high",
      "so_what": "<≤ 30 words: for own pages, review/test; for market pages, what we could test on one of our own pages>"
    }
  ],
  "top_severity": 1
}
