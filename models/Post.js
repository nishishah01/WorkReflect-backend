const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema({
  title: String,
  content: String,
  aiFeedback: {
    summary: String,
    suggestions: [String],
    questions: [String]
  },
  tags: {
    type: [String],
    default: [],
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization"
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  audioUrl: {
    type: String,
    default: null,
  },
  audioTitle: {
    type: String,
    default: null,
  },
  reactions: {
    agree: { type: Number, default: 0 },
    insightful: { type: Number, default: 0 },
    idea: { type: Number, default: 0 }
  }
}, { timestamps: true });

module.exports = mongoose.model("Post", PostSchema);
//this will be post model for backend
