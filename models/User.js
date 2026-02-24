const mongoose = require("mongoose");
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization"
  },
  role: {
    type: String,
    enum: ["admin", "manager", "member"],
    default: "member"
  },
  // --- Subscription / billing ---
  plan: {
    type: String,
    enum: ["free", "pro", "enterprise"],
    default: "free"
  },
  stripeCustomerId: { type: String, default: null },
  stripeSubscriptionId: { type: String, default: null },
  subscriptionStatus: { type: String, default: "inactive" } // active | inactive | canceled
}, { timestamps: true });
module.exports = mongoose.model("User", UserSchema);
