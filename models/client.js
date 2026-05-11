const mongoose = require("mongoose");
const validator = require("validator");

const ClientSchema = new mongoose.Schema(
  {
    clientId: {
      type: String,
    },
    name: {
      type: String,
    },
    active: {
      type: Boolean,
      default: true,
    },
    contactName: {
      type: String,
    },
    contactEmail: {
      type: String,
      lowercase: true,
      validate: {
        validator: function (value) {
          return validator.isEmail(value);
        },
        message: "Please enter a valid email address",
      },
    },
    contactPhone: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Client", ClientSchema);
