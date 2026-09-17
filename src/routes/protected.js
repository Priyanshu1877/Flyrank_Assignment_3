const express = require("express");
const supabase = require("../supabase");

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
 * Stage 3: Supabase JWT token verification
 */
router.get("/protected/profile", async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || typeof authHeader !== "string") {
    return res.status(401).json({ error: "Access token required" });
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer" || !parts[1].trim()) {
    return res.status(401).json({ error: "Access token required" });
  }

  const token = parts[1].trim();

  try {
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data || !data.user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    return res.json({
      user: {
        id: data.user.id,
        email: data.user.email,
        created_at: data.user.created_at,
      },
    });
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
});

module.exports = router;
