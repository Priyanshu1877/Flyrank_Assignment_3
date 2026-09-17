const express = require("express");
const supabase = require("../supabase");

const router = express.Router();

/**
 * POST /auth/signup
 * Request body: { email, password }
 */
router.post("/signup", async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || typeof email !== "string" || !password || typeof password !== "string") {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return res.status(error.status || 400).json({ error: error.message || "Signup failed" });
    }

    if (!data || !data.user) {
      return res.status(400).json({ error: "User creation failed" });
    }

    return res.status(201).json({
      user: data.user,
    });
  } catch (err) {
    return res.status(500).json({ error: "An unexpected error occurred during signup" });
  }
});

/**
 * POST /auth/login
 * Request body: { email, password }
 */
router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || typeof email !== "string" || !password || typeof password !== "string") {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data || !data.session) {
      return res.status(401).json({ error: "Invalid login credentials" });
    }

    return res.status(200).json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: data.user,
    });
  } catch (err) {
    return res.status(500).json({ error: "An unexpected error occurred during login" });
  }
});

module.exports = router;
