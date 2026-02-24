const express = require("express");
const router = express.Router();
const Organization = require("../models/Organization");
const crypto = require("crypto");
const authMiddleware = require("../middleware/authMiddleware");

// Admin-only guard
const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

// ─── GET /api/org/my ────────────────────────────────────────────────────
// Returns the current user's organisation info (including invite code for admins)
router.get("/my", authMiddleware, async (req, res) => {
  try {
    const org = await Organization.findById(req.user.organization);
    if (!org) return res.status(404).json({ error: "Organisation not found" });

    // Only reveal invite code to admins
    const data = {
      _id: org._id,
      name: org.name,
      createdAt: org.createdAt,
      ...(req.user.role === "admin" ? { inviteCode: org.inviteCode } : {}),
    };

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch organisation", details: err.message });
  }
});

// ─── POST /api/org/regenerate-invite ────────────────────────────────────
// Admin regenerates the invite code (invalidates old one)
router.post("/regenerate-invite", authMiddleware, adminOnly, async (req, res) => {
  try {
    const newCode = crypto.randomBytes(4).toString("hex").toUpperCase();
    const org = await Organization.findByIdAndUpdate(
      req.user.organization,
      { inviteCode: newCode },
      { new: true }
    );
    res.json({ inviteCode: org.inviteCode });
  } catch (err) {
    res.status(500).json({ error: "Failed to regenerate code", details: err.message });
  }
});

// ─── GET /api/org/lookup/:code ──────────────────────────────────────────
// Public — validate an invite code and return the org name (for register UX)
router.get("/lookup/:code", async (req, res) => {
  try {
    const org = await Organization.findOne({
      inviteCode: req.params.code.trim().toUpperCase(),
    }).select("name");

    if (!org) return res.status(404).json({ error: "Invalid invite code" });
    res.json({ name: org.name });
  } catch (err) {
    res.status(500).json({ error: "Lookup failed", details: err.message });
  }
});

// ─── Legacy create (kept for org creation via API if needed) ────────────
router.post("/create", authMiddleware, adminOnly, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });
  const inviteCode = crypto.randomBytes(4).toString("hex").toUpperCase();
  const org = new Organization({ name, inviteCode });
  await org.save();
  res.json(org);
});

module.exports = router;
