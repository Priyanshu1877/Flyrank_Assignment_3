const { z } = require("zod");

// Exactly 3 bullets, each a non-empty string. Model output must match
// this shape or we treat it as malformed and retry/error — never crash.
const summarySchema = z.object({
  bullets: z.tuple([z.string().min(1), z.string().min(1), z.string().min(1)]),
});

module.exports = summarySchema;
