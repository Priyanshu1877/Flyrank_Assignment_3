const crypto = require("crypto");
const callGroq = require("./providers/groq");
const callGemini = require("./providers/gemini");
const callOllama = require("./providers/ollama");
const { estimateCost } = require("./pricing");

// --- THE SEAM ---
// This is the one place in the whole app that knows which provider is
// active. Every route calls ai.complete(...) below; nothing else ever
// imports groq.js / gemini.js / ollama.js directly. Switching providers
// is a one-line env var change (AI_PROVIDER=groq|gemini|ollama).
const PROVIDERS = { groq: callGroq, gemini: callGemini, ollama: callOllama };

const TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS || 10000);
const MAX_RETRIES = 1; // "retry once" per the assignment brief
const BACKOFF_MS = 600;

// Simple in-memory cache (stretch goal): identical prompt+provider -> instant, free
const cache = new Map();

function cacheKey({ provider, systemPrompt, userPrompt }) {
  return crypto
    .createHash("sha256")
    .update(`${provider}::${systemPrompt}::${userPrompt}`)
    .digest("hex");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryable(err) {
  // Retry on rate-limit and server errors. Never retry a 400 — that means
  // the request itself was bad, and resending it just fails the same way.
  return err.status === 429 || (err.status >= 500 && err.status < 600);
}

async function callWithTimeout(fn, args) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fn({ ...args, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * complete({ feature, systemPrompt, userPrompt })
 * -> { text, provider, model, usage, costUsd, cached }
 *
 * `feature` is just a label for logging (e.g. "summarize") so cost logs
 * are attributable to whichever endpoint made the call.
 */
async function complete({ feature, systemPrompt, userPrompt }) {
  const provider = process.env.AI_PROVIDER || "groq";
  const callProvider = PROVIDERS[provider];
  if (!callProvider) {
    throw new Error(`Unknown AI_PROVIDER "${provider}" — expected groq | gemini | ollama`);
  }

  const key = cacheKey({ provider, systemPrompt, userPrompt });
  if (cache.has(key)) {
    console.log(`[ai] feature=${feature} provider=${provider} cache=HIT cost=$0.000000`);
    return { ...cache.get(key), cached: true };
  }

  let attempt = 0;
  while (true) {
    try {
      const result = await callWithTimeout(callProvider, { systemPrompt, userPrompt });
      const costUsd = estimateCost({
        provider: result.provider,
        model: result.model,
        inputTokens: result.usage.inputTokens,
        outputTokens: result.usage.outputTokens,
      });

      console.log(
        `[ai] feature=${feature} provider=${result.provider} model=${result.model} ` +
          `inputTokens=${result.usage.inputTokens} outputTokens=${result.usage.outputTokens} ` +
          `estCostUsd=${costUsd ?? "unknown"}`
      );

      const output = { ...result, costUsd, cached: false };
      cache.set(key, output);
      return output;
    } catch (err) {
      const isTimeout = err.name === "AbortError";
      const retryable = isTimeout || isRetryable(err);

      console.log(
        `[ai] feature=${feature} provider=${provider} attempt=${attempt + 1} ` +
          `error="${err.message}" status=${err.status || (isTimeout ? "timeout" : "n/a")} ` +
          `retryable=${retryable}`
      );

      if (!retryable || attempt >= MAX_RETRIES) throw err;
      attempt += 1;
      await sleep(BACKOFF_MS * attempt); // short backoff, grows on 2nd try
    }
  }
}

module.exports = { complete };
