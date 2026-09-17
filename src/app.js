require("dotenv").config();
const express = require("express");
const supabase = require("./supabase");
const summarizeRouter = require("./routes/summarize");

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use("/", summarizeRouter);

app.get("/health", (req, res) => {
  res.json({ status: "ok", provider: process.env.AI_PROVIDER || "groq" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`AI feature server running on port ${PORT} (provider: ${process.env.AI_PROVIDER || "groq"})`);
});

