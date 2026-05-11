const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema(
  {
    roleId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: [true, "Please enter role name"],
      trim: true,
    },
    permissions: {
      type: [String],
      required: true,
      validate: {
        validator: function (arr) {
          return arr.length > 0;
        },
        message: "A role must have at least one permission.",
      },
    },
  },
  { timestamps: true }
);

const Role = mongoose.model("Role", roleSchema);

module.exports = Role;
