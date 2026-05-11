const mongoose = require("mongoose");

const ResourceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    type: {
      type: String,
      enum: ["document", "image", "video", "other"],
      default: "document",
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Resource", ResourceSchema);
