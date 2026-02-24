const express = require("express");
const router = express.Router();
const Comment = require("../models/Comment");
const authMiddleware = require("../middleware/authMiddleware");

// Create comment
router.post("/create", authMiddleware, async (req, res) => {
  try {
    const { postId, text } = req.body;

    if (!postId || !text || !text.trim()) {
      return res.status(400).json({ error: "postId and text are required" });
    }

    const comment = new Comment({ postId, text, createdBy: req.user._id });
    await comment.save();

    res.status(201).json({ success: true, comment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create comment", details: error.message });
  }
});

// Get comments for a post
router.get("/:postId", async (req, res) => {
  try {
    const comments = await Comment.find({
      postId: req.params.postId,
    })
    .populate("createdBy", "name role")
    .sort({ createdAt: -1 });

    res.json(comments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch comments", details: error.message });
  }
});

module.exports = router;
