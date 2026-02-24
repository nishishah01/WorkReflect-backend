const mongoose = require("mongoose");
const OrganizationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  inviteCode: { type: String, required: true }, // simple invite system
}, { timestamps: true });
module.exports = mongoose.model("Organization", OrganizationSchema);
