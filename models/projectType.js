const mongoose = require("mongoose");

const projectTypeSchema = new mongoose.Schema(
    {
        projectTypeId: {
            type: String,
            required: true,
            unique: true,
        },
        typeName: {
            type: String,
            required: true,
            enum: [
                "SAP",
                "OrcelNearSuite",
                "Web Development",
                "Mobile App Development",
                "Nijan Internal Projects",
                "E-Invoice",
            ],
        },
        description: {
            type: String,
        },
        active: {
            type: Boolean,
            default: true,
        },
        createdBy: {
            type: String,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.models.ProjectType || mongoose.model("ProjectType", projectTypeSchema);