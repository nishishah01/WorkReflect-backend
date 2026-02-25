const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

const allowedOrigins = [
    "http://localhost:3000",
    "https://workreflect.vercel.app"
];

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (e.g. mobile apps, curl, Render health checks)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        } else {
            return callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
};

// ✅ Handle OPTIONS preflight for ALL routes (must come before any route registration)
app.options("*", cors(corsOptions));
app.use(cors(corsOptions));

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
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/org", require("./routes/orgRoutes"));
app.use("/api/analytics", require("./routes/analyticsRoutes"));

// 💎 New Premium routes
app.use("/api/stripe", require("./routes/stripeRoutes"));
app.use("/api/rooms", require("./routes/roomRoutes"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
