const fetch = require("node-fetch");

// Groq's API is OpenAI-compatible. Docs: https://console.groq.com/docs
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";

// Raw call — no retry/timeout logic here, that lives in the seam (index.js)
// so it's identical no matter which provider is plugged in.
async function callGroq({ systemPrompt, userPrompt, signal }) {
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
    }),
    signal,
  });

  const status = res.status;
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data?.error?.message || `Groq request failed (${status})`);
    err.status = status;
    throw err;
  }

  const text = data.choices?.[0]?.message?.content ?? "";
  const usage = {
    inputTokens: data.usage?.prompt_tokens ?? 0,
    outputTokens: data.usage?.completion_tokens ?? 0,
  };

  return { text, usage, model: MODEL, provider: "groq" };
}

module.exports = callGroq;
