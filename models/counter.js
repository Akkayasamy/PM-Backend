const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true,
  },
  sequence_value: {
    type: Number,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Counter", counterSchema);
