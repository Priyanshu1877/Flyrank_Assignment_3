const express = require("express");
const ai = require("../ai");
const summarySchema = require("../schemas/summarySchema");

const router = express.Router();

const SYSTEM_PROMPT =
  "You summarize text into exactly 3 bullet points. " +
  'Respond ONLY with JSON matching this exact shape: {"bullets": ["...", "...", "..."]}. ' +
  "No prose, no markdown, no explanation — just the JSON object.";

function buildUserPrompt(text) {
  return `Summarize the following text into exactly 3 bullets:\n\n${text}`;
}

function tryParseAndValidate(rawText) {
  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return { ok: false, reason: "not valid JSON" };
  }
  const result = summarySchema.safeParse(parsed);
  if (!result.success) {
    return { ok: false, reason: "did not match schema", details: result.error.issues };
  }
  return { ok: true, data: result.data };
}

router.post("/summarize", async (req, res) => {
  const { text } = req.body;
  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "Request body must include a non-empty 'text' string" });
  }

  try {
    // First attempt
    let result = await ai.complete({
      feature: "summarize",
      systemPrompt: SYSTEM_PROMPT,
      userPrompt: buildUserPrompt(text),
    });
    let validation = tryParseAndValidate(result.text);

    // Malformed output -> retry ONCE with a stricter follow-up prompt.
    // This is separate from the network-level retry inside ai.complete()
    // (that one handles 429/5xx; this one handles the model just
    // returning something that isn't valid JSON).
    if (!validation.ok) {
      console.log(`[summarize] malformed output (${validation.reason}), retrying once`);
      result = await ai.complete({
        feature: "summarize",
        systemPrompt: SYSTEM_PROMPT,
        userPrompt:
          buildUserPrompt(text) +
          '\n\nIMPORTANT: your previous response was not valid JSON matching {"bullets": ["...", "...", "..."]}. Return ONLY that JSON shape this time.',
      });
      validation = tryParseAndValidate(result.text);
    }

    if (!validation.ok) {
      // Never crash on the model's creativity — return a clean error.
      return res.status(502).json({
        error: "Model did not return valid structured output after retry",
        reason: validation.reason,
      });
    }

    return res.json({
      bullets: validation.data.bullets,
      meta: {
        provider: result.provider,
        model: result.model,
        inputTokens: result.usage.inputTokens,
        outputTokens: result.usage.outputTokens,
        estCostUsd: result.costUsd,
        cached: result.cached,
      },
    });
  } catch (err) {
    // Network/timeout/rate-limit errors that survived retries in ai.complete()
    const status = err.status === 400 ? 400 : 503;
    return res.status(status).json({ error: "AI request failed", detail: err.message });
  }
});

module.exports = router;
