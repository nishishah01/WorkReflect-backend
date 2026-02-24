const express = require("express");
const router = express.Router();
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

// Middleware: Admin only
const adminOnly = (req, res, next) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
    }
    next();
};

// ─── GET /api/analytics/overview ───────────────────────────────────────────
// Returns core engagement metrics
router.get("/overview", authMiddleware, adminOnly, async (req, res) => {
    try {
        const orgId = req.user.organization;

        const [totalPosts, totalComments, totalMembers] = await Promise.all([
            Post.countDocuments({ organization: orgId }),
            Comment.countDocuments({
                postId: { $in: await Post.find({ organization: orgId }).distinct("_id") }
            }),
            User.countDocuments({ organization: orgId }),
        ]);

        // Posts in last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentPosts = await Post.countDocuments({
            organization: orgId,
            createdAt: { $gte: thirtyDaysAgo },
        });

        // Total reactions
        const posts = await Post.find({ organization: orgId });
        const totalReactions = posts.reduce((sum, p) => {
            return sum + (p.reactions?.agree || 0) + (p.reactions?.insightful || 0) + (p.reactions?.idea || 0);
        }, 0);

        res.json({ totalPosts, totalComments, totalMembers, recentPosts, totalReactions });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch overview", details: err.message });
    }
});

// ─── GET /api/analytics/top-topics ─────────────────────────────────────────
// Most used tags across all posts
router.get("/top-topics", authMiddleware, adminOnly, async (req, res) => {
    try {
        const orgId = req.user.organization;
        const posts = await Post.find({ organization: orgId });

        const tagCount = {};
        posts.forEach((post) => {
            (post.tags || []).forEach((tag) => {
                const normalized = tag.toLowerCase().trim();
                if (normalized) tagCount[normalized] = (tagCount[normalized] || 0) + 1;
            });
        });

        const sorted = Object.entries(tagCount)
            .map(([tag, count]) => ({ tag, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        res.json(sorted);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch top topics", details: err.message });
    }
});

// ─── GET /api/analytics/participation ──────────────────────────────────────
// Per-member post + comment counts
router.get("/participation", authMiddleware, adminOnly, async (req, res) => {
    try {
        const orgId = req.user.organization;

        const members = await User.find({ organization: orgId }).select("name email role");
        const orgPostIds = await Post.find({ organization: orgId }).distinct("_id");

        const participation = await Promise.all(
            members.map(async (member) => {
                const postCount = await Post.countDocuments({
                    organization: orgId,
                    createdBy: member._id,
                });
                const commentCount = await Comment.countDocuments({
                    postId: { $in: orgPostIds },
                    createdBy: member._id,
                });
                return {
                    name: member.name,
                    email: member.email,
                    role: member.role,
                    posts: postCount,
                    comments: commentCount,
                    total: postCount + commentCount,
                };
            })
        );

        participation.sort((a, b) => b.total - a.total);
        res.json(participation);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch participation", details: err.message });
    }
});

// ─── GET /api/analytics/sentiment ──────────────────────────────────────────
// Reaction distribution over time (agree / insightful / idea)
router.get("/sentiment", authMiddleware, adminOnly, async (req, res) => {
    try {
        const orgId = req.user.organization;

        // Group posts by week for last 12 weeks
        const twelveWeeksAgo = new Date();
        twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);

        const posts = await Post.find({
            organization: orgId,
            createdAt: { $gte: twelveWeeksAgo },
        }).sort({ createdAt: 1 });

        // Build weekly buckets
        const weeks = {};
        posts.forEach((post) => {
            const d = new Date(post.createdAt);
            // Week start (Monday)
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1);
            const weekStart = new Date(d.setDate(diff));
            weekStart.setHours(0, 0, 0, 0);
            const key = weekStart.toISOString().split("T")[0];

            if (!weeks[key]) weeks[key] = { week: key, agree: 0, insightful: 0, idea: 0, posts: 0 };
            weeks[key].agree += post.reactions?.agree || 0;
            weeks[key].insightful += post.reactions?.insightful || 0;
            weeks[key].idea += post.reactions?.idea || 0;
            weeks[key].posts += 1;
        });

        const result = Object.values(weeks).sort((a, b) => new Date(a.week) - new Date(b.week));
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch sentiment", details: err.message });
    }
});

// ─── GET /api/analytics/growth ─────────────────────────────────────────────
// Post count grouped by day for last 30 days
router.get("/growth", authMiddleware, adminOnly, async (req, res) => {
    try {
        const orgId = req.user.organization;

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const posts = await Post.find({
            organization: orgId,
            createdAt: { $gte: thirtyDaysAgo },
        }).sort({ createdAt: 1 });

        // Build day buckets
        const days = {};
        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toISOString().split("T")[0];
            days[key] = { date: key, posts: 0, cumulative: 0 };
        }

        posts.forEach((post) => {
            const key = new Date(post.createdAt).toISOString().split("T")[0];
            if (days[key]) days[key].posts += 1;
        });

        // Compute cumulative
        let cumulative = 0;
        // Get total posts before window
        const totalBefore = await Post.countDocuments({
            organization: orgId,
            createdAt: { $lt: thirtyDaysAgo },
        });
        cumulative = totalBefore;

        const result = Object.values(days).map((d) => {
            cumulative += d.posts;
            return { ...d, cumulative };
        });

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch growth", details: err.message });
    }
});

module.exports = router;
