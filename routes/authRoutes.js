const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Organization = require("../models/Organization");
const crypto = require("crypto");
const authMiddleware = require("../middleware/authMiddleware");

// ─── Helper: generate JWT ────────────────────────────────────────────────
const signToken = (user) =>
  jwt.sign({ id: user._id, organization: user.organization }, process.env.JWT_SECRET);

// ─── POST /api/auth/register/create-org ─────────────────────────────────
// Bootstraps a brand-new organisation. Caller becomes the admin.
router.post("/register/create-org", async (req, res) => {
  try {
    const { name, email, password, company } = req.body;

    if (!name || !email || !password || !company) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Company name must be unique
    const existing = await Organization.findOne({ name: { $regex: new RegExp(`^${company}$`, "i") } });
    if (existing) {
      return res.status(400).json({ message: "An organisation with that name already exists. Ask your admin for an invite code instead." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const inviteCode = crypto.randomBytes(4).toString("hex").toUpperCase(); // e.g. A3F9B2C1

    const organization = await Organization.create({ name: company, inviteCode });

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name,
      email,
      password: hashedPassword,
      organization: organization._id,
      role: "admin",
    });

    res.status(201).json({ message: "Organisation created. You can now log in." });
  } catch (err) {
    console.error("create-org error:", err);
    if (err.code === 11000) return res.status(400).json({ message: "Email already registered" });
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ─── POST /api/auth/register/join ────────────────────────────────────────
// Join an existing organisation using an invite code.
router.post("/register/join", async (req, res) => {
  try {
    const { name, email, password, inviteCode } = req.body;

    if (!name || !email || !password || !inviteCode) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const organization = await Organization.findOne({ inviteCode: inviteCode.trim().toUpperCase() });
    if (!organization) {
      return res.status(400).json({ message: "Invalid invite code. Please check with your admin." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name,
      email,
      password: hashedPassword,
      organization: organization._id,
      role: "member",
    });

    res.status(201).json({
      message: `Welcome to ${organization.name}! You can now log in.`,
      company: organization.name,
    });
  } catch (err) {
    console.error("join error:", err);
    if (err.code === 11000) return res.status(400).json({ message: "Email already registered" });
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ─── POST /api/auth/login ────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email }).populate("organization", "name inviteCode");
    if (!user) return res.status(400).json({ message: "User not found" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: "Wrong password" });

    const token = signToken(user);
    res.json({ token, user });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
