const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors({
    origin: "https://workreflect.vercel.app",
}));

// ⚠️  Stripe webhook needs raw body — register BEFORE express.json()
app.use("/api/stripe/webhook", express.raw({ type: "application/json" }));

app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => {
        console.error("❌ MongoDB connection failed:", err.message);
        console.error("👉 Make sure MongoDB is running locally (mongod) or your Atlas URI is correct in .env");
        process.exit(1);
    });

app.get("/", (req, res) => res.send("Reflect AI Backend Running 🚀"));

// Existing routes
const postRoutes = require("./routes/postRoutes");
app.use("/api/posts", postRoutes);
const commentRoutes = require("./routes/commentRoutes");
app.use("/api/comments", commentRoutes);
app.use("/uploads", express.static("uploads"));
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/org", require("./routes/orgRoutes"));
app.use("/api/analytics", require("./routes/analyticsRoutes"));

// 💎 New Premium routes
app.use("/api/stripe", require("./routes/stripeRoutes"));
app.use("/api/rooms", require("./routes/roomRoutes"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
