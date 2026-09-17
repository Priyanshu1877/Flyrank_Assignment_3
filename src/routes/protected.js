const express = require("express");
const authMiddleware = require("../middleware/auth");

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
 * Protected route - requires valid Supabase JWT via authMiddleware
 */
router.get("/protected/profile", authMiddleware, (req, res) => {
  return res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      created_at: req.user.created_at,
    },
  });
});

/**
 * GET /protected/dashboard
 * Protected route - requires valid Supabase JWT via authMiddleware
 */
router.get("/protected/dashboard", authMiddleware, (req, res) => {
  return res.json({
    message: "Welcome to the protected dashboard",
    user: {
      id: req.user.id,
      email: req.user.email,
    },
  });
});

module.exports = router;
