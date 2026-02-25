const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/User");

let stripe;
try {
    stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
} catch (e) {
    console.warn("⚠️  stripe package not installed yet. Run: npm install stripe");
}

// ─── POST /api/stripe/create-checkout ───────────────────────────────────────
// Creates a Stripe Checkout session for the Pro plan subscription
router.post("/create-checkout", authMiddleware, async (req, res) => {
    if (!stripe) return res.status(503).json({ error: "Stripe not configured" });

    try {
        const user = req.user;

        // Create or retrieve Stripe customer
        let customerId = user.stripeCustomerId;
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                name: user.name,
                metadata: { userId: user._id.toString() },
            });
            customerId = customer.id;
            await User.findByIdAndUpdate(user._id, { stripeCustomerId: customerId });
        }

        // returnPath lets each page redirect back to itself after payment
        const { returnPath = "/" } = req.body;
        const base = process.env.FRONTEND_URL || "http://localhost:3000";

        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            payment_method_types: ["card"],
            mode: "subscription",
            line_items: [
                {
                    price_data: {
                        currency: "inr",
                        recurring: { interval: "month" },
                        product_data: {
                            name: "WorkReflect — Pro Plan",
                            description: "Live Rooms, Reflection Streaks & Gamification, AI summaries & more",
                            images: [],
                        },
                        unit_amount: 15000, // ₹150 in paise
                    },
                    quantity: 1,
                },
            ],
            success_url: `${base}${returnPath}?upgraded=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${base}${returnPath}?canceled=true`,
            metadata: { userId: user._id.toString() },
        });

        res.json({ url: session.url });
    } catch (err) {
        console.error("Stripe checkout error:", err);
        res.status(500).json({ error: err.message });
    }
});

// ─── POST /api/stripe/webhook ────────────────────────────────────────────────
// Stripe sends events here — must use raw body
router.post(
    "/webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
        if (!stripe) return res.status(503).send("Stripe not configured");
        if (!process.env.STRIPE_WEBHOOK_SECRET) {
            return res.status(503).send("Webhook secret not set");
        }

        const sig = req.headers["stripe-signature"];
        let event;

        try {
            event = stripe.webhooks.constructEvent(
                req.body,
                sig,
                process.env.STRIPE_WEBHOOK_SECRET
            );
        } catch (err) {
            console.error("Webhook signature error:", err.message);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }

        // Handle events
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object;
                const userId = session.metadata?.userId;
                if (userId) {
                    await User.findByIdAndUpdate(userId, {
                        plan: "pro",
                        subscriptionStatus: "active",
                        stripeSubscriptionId: session.subscription,
                    });
                    console.log(`✅ User ${userId} upgraded to Pro`);
                }
                break;
            }
            case "customer.subscription.deleted":
            case "customer.subscription.updated": {
                const sub = event.data.object;
                const status = sub.status; // active | canceled | past_due
                await User.findOneAndUpdate(
                    { stripeSubscriptionId: sub.id },
                    {
                        plan: status === "active" ? "pro" : "free",
                        subscriptionStatus: status,
                    }
                );
                break;
            }
        }

        res.json({ received: true });
    }
);

// ─── GET /api/stripe/status ───────────────────────────────────────────────────
// Returns the logged-in user's current plan
router.get("/status", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("plan subscriptionStatus stripeCustomerId");
        res.json({
            plan: user.plan || "free",
            subscriptionStatus: user.subscriptionStatus || "inactive",
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── POST /api/stripe/cancel ─────────────────────────────────────────────────
// Cancels the active subscription at period end
router.post("/cancel", authMiddleware, async (req, res) => {
    if (!stripe) return res.status(503).json({ error: "Stripe not configured" });
    try {
        const user = await User.findById(req.user._id);
        if (!user.stripeSubscriptionId) {
            return res.status(400).json({ error: "No active subscription found" });
        }
        await stripe.subscriptions.update(user.stripeSubscriptionId, {
            cancel_at_period_end: true,
        });
        res.json({ message: "Subscription will cancel at period end" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── POST /api/stripe/verify-session ────────────────────────────────────────
// Called by the frontend after returning from Stripe checkout.
// Verifies the session with Stripe and immediately upgrades the user's plan.
router.post("/verify-session", authMiddleware, async (req, res) => {
    if (!stripe) return res.status(503).json({ error: "Stripe not configured" });
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: "Missing sessionId" });

    try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        // Only upgrade if payment was actually completed
        if (session.payment_status !== "paid" && session.status !== "complete") {
            return res.status(400).json({ error: "Payment not completed", status: session.status });
        }

        // Verify this session belongs to this user
        const user = await require("../models/User").findById(req.user._id);
        const sessionUserId = session.metadata?.userId;
        if (sessionUserId && sessionUserId !== user._id.toString()) {
            return res.status(403).json({ error: "Session does not belong to this user" });
        }

        // Upgrade user immediately
        await require("../models/User").findByIdAndUpdate(user._id, {
            plan: "pro",
            subscriptionStatus: "active",
            stripeSubscriptionId: session.subscription || user.stripeSubscriptionId,
        });

        console.log(`✅ User ${user._id} verified and upgraded to Pro via session ${sessionId}`);
        res.json({ success: true, plan: "pro" });
    } catch (err) {
        console.error("Verify session error:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
