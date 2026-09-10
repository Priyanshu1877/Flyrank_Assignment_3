# AI Summarize Feature

`POST /summarize` — takes free text, returns exactly 3 bullet points as
schema-validated JSON, using a swappable LLM provider.

## The seam

`src/ai/index.js` is the **only** file in the app that knows which
provider is active. Everything else — the route, the schema, the
validation — calls `ai.complete({ feature, systemPrompt, userPrompt })`
and gets back `{ text, provider, model, usage, costUsd, cached }`
regardless of backend.

Switching providers is one line in `.env`:
```
AI_PROVIDER=groq     # or gemini, or ollama
```
No route or schema code changes when you switch.

## Running it

```bash
npm install
cp .env.example .env
# put your real GROQ_API_KEY (or GEMINI_API_KEY) in .env
npm start   # or: node src/app.js
```

Get a free key:
- Groq: https://console.groq.com (no card required)
- Gemini: https://aistudio.google.com/apikey (no card required)
- Ollama: no key — run `ollama pull llama3.1` and set `AI_PROVIDER=ollama`

## Try it

```bash
curl -X POST http://localhost:6000/summarize \
  -H "Content-Type: application/json" \
  -d '{"text":"Paste any paragraph of text here to summarize."}'
```

Response:
```json
{
  "bullets": ["...", "...", "..."],
  "meta": {
    "provider": "groq",
    "model": "llama-3.1-8b-instant",
    "inputTokens": 142,
    "outputTokens": 38,
    "estCostUsd": 0.000010,
    "cached": false
  }
}
```

## What's handled, and how

**Structured output.** The system prompt demands JSON matching
`{"bullets": ["...", "...", "..."]}`. The response is parsed and validated
against a Zod schema (`src/schemas/summarySchema.js`) requiring exactly
3 non-empty strings.

**Malformed output → retry once, then clean error.** If the model's
response isn't valid JSON or doesn't match the schema, the route retries
with a stricter follow-up prompt. If it fails again, the API returns
`502` with a reason — it never crashes the process.

**Reliability.** Every provider call runs through `callWithTimeout`
(`AI_TIMEOUT_MS`, default 10s, via `AbortController`). Network-level
failures retry once with backoff **only** for `429` (rate limit) or `5xx`
(server error). A `400` is never retried — it means the request itself
was malformed, and resending it fails the same way every time.

**Cost logging.** Every call logs token counts and an estimated cost to
the console, tagged with the feature name:
```
[ai] feature=summarize provider=groq model=llama-3.1-8b-instant inputTokens=142 outputTokens=38 estCostUsd=0.00001
```
Prices come from `src/ai/pricing.js`, a small hardcoded table sourced from
each provider's public pricing page. **Verify current prices before
relying on this beyond the assignment** — providers change pricing
without much notice. Ollama always logs token counts too, even though the
cost is $0 — the assignment's point is building the measurement habit,
not just the invoice.

**Caching (stretch).** Identical `(provider, systemPrompt, userPrompt)`
triples are cached in memory. A repeated call logs `cache=HIT cost=$0`
and returns instantly, no network call made. This is deliberately a
simple `Map` — no eviction, resets on restart — since the goal is proving
the seam design, not building a production cache.

## Swapping providers (proof for the stretch goal)

```bash
AI_PROVIDER=groq node src/app.js
# ...call /summarize...
AI_PROVIDER=gemini node src/app.js
# ...call /summarize again, same request shape, same response shape...
```
Only the env var changes. `routes/summarize.js` and `schemas/summarySchema.js`
are untouched.

## Privacy note

Groq and Gemini free tiers may use inputs for training/improvement per
their terms — don't send sensitive text through them. Use `AI_PROVIDER=ollama`
for anything private; it runs entirely on your machine.
