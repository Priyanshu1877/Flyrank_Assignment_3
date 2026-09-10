const fetch = require("node-fetch");

// Local Ollama — https://github.com/ollama/ollama/blob/main/docs/api.md
// No API key, nothing leaves your machine. Run `ollama pull llama3.1` first.
const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434/api/chat";
const MODEL = process.env.OLLAMA_MODEL || "llama3.1";

async function callOllama({ systemPrompt, userPrompt, signal }) {
  const res = await fetch(OLLAMA_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      format: "json",
      stream: false,
    }),
    signal,
  });

  const status = res.status;
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data?.error || `Ollama request failed (${status})`);
    err.status = status;
    throw err;
  }

  const text = data.message?.content ?? "";
  // Ollama reports counts, not "cost" — logged anyway per the assignment.
  const usage = {
    inputTokens: data.prompt_eval_count ?? 0,
    outputTokens: data.eval_count ?? 0,
  };

  return { text, usage, model: MODEL, provider: "ollama" };
}

module.exports = callOllama;
