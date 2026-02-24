const express = require("express");
const router = express.Router();
const Post = require("../models/Post");
const { generateFeedback } = require("../services/aiService");
const authMiddleware = require("../middleware/authMiddleware");


router.post("/create", authMiddleware, async (req, res) => {
  try {
    console.log("REQ.USER:", req.user);
    const { title, content, tags, audioUrl } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required" });
    }

    const aiResponse = await generateFeedback(content);

    const post = new Post({
      title,
      content,
      tags,
      audioUrl,
      organization: req.user.organization,
      createdBy: req.user._id,
      aiFeedback: {
        summary: aiResponse
      }
    });

    await post.save();
    res.status(201).json({ success: true, post });

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to create post", details: error.message });
  }
});
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { tag } = req.query;

    let query = {
      organization: req.user.organization, // 🔐 isolation
    };
    if (tag) {
      query.tags = { $regex: new RegExp(`^${tag}$`, "i") };
    }
    const posts = await Post.find(query)
      .populate("createdBy", "name role")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to fetch posts", details: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate("createdBy", "name role");
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch post" });
  }
});

router.post("/react/:id", authMiddleware, async (req, res) => {
  try {
    const { type } = req.body;
    if (!type || !["agree", "insightful", "idea"].includes(type)) {
      return res.status(400).json({ error: "Invalid reaction type" });
    }
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });
    post.reactions[type] += 1;
    await post.save();
    res.json(post.reactions);
  } catch (error) {
    res.status(500).json({ error: "Failed to add reaction" });
  }
});


//audio upload
const multer = require("multer");
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });
router.post("/upload-audio", upload.single("audio"), (req, res) => {
  res.json({
    audioUrl: `/uploads/${req.file.filename}`,
  });
});

module.exports = router;
