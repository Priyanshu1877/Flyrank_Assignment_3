// Public per-1M-token prices in USD. VERIFY against the provider's current
// pricing page before trusting these for anything beyond this assignment —
// providers change prices without much notice.
//   Groq:   https://groq.com/pricing
//   Gemini: https://ai.google.dev/gemini-api/docs/pricing
const PRICING = {
  groq: {
    "llama-3.1-8b-instant": { input: 0.05, output: 0.08 },
  },
  gemini: {
    "gemini-1.5-flash": { input: 0.075, output: 0.3 },
  },
  ollama: {
    // Local — $0, but we still track tokens (the assignment's point:
    // build the habit of measuring, even when it's free).
    default: { input: 0, output: 0 },
  },
};

function estimateCost({ provider, model, inputTokens, outputTokens }) {
  const table = PRICING[provider]?.[model] || PRICING[provider]?.default;
  if (!table) return null; // unknown model — don't guess, just skip

  const cost =
    (inputTokens / 1_000_000) * table.input +
    (outputTokens / 1_000_000) * table.output;

  return Number(cost.toFixed(6));
}

module.exports = { estimateCost, PRICING };
