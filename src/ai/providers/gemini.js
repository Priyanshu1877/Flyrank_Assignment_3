const fetch = require("node-fetch");

// Gemini Flash — https://ai.google.dev/gemini-api/docs
const MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

async function callGemini({ systemPrompt, userPrompt, signal }) {
  const res = await fetch(`${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    }),
    signal,
  });

  const status = res.status;
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data?.error?.message || `Gemini request failed (${status})`);
    err.status = status;
    throw err;
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const usage = {
    inputTokens: data.usageMetadata?.promptTokenCount ?? 0,
    outputTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
  };

  return { text, usage, model: MODEL, provider: "gemini" };
}

module.exports = callGemini;
