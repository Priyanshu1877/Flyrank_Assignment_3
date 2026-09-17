const express = require("express");

const router = express.Router();

/**
 * GET /public/info
 * Public route - no authentication required
 */
router.get("/public/info", (req, res) => {
  return res.json({
    message: "Welcome stranger! This info is public.",
  });
});

/**
 * GET /protected/profile
 * Token-presence check only for Stage 2 (no Supabase token verification yet)
 */
router.get("/protected/profile", (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || typeof authHeader !== "string") {
    return res.status(401).json({ error: "Access token required" });
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer" || !parts[1].trim()) {
    return res.status(401).json({ error: "Access token required" });
  }

  // Token presence verified (Stage 2 check passed)
  return res.json({
    message: "Protected profile placeholder (token presence verified)",
  });
});

module.exports = router;
