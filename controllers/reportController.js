const mongoose = require('mongoose');
const Project = require('../models/project');
const catchAsyncErrors = require('../middlewares/catchAsyncErrors');

// 1. Get all projects for the selection list
exports.getReportsList = catchAsyncErrors(async (req, res, next) => {
    const projects = await Project.find().select('name client status projectCode');
    res.status(200).json({ success: true, projects });
});

exports.getProjectReport = catchAsyncErrors(async (req, res, next) => {
    try {


        const projectIdString = req.params.id;

        const report = await Project.aggregate([
            {
                $match: { _id: new mongoose.Types.ObjectId(projectIdString) }
            },
            {
                // LOOKUP MANAGER NAME
                $lookup: {
                    from: "users",
                    let: { mId: { $toObjectId: "$managerId" } },
                    pipeline: [
                        { $match: { $expr: { $eq: ["$_id", "$$mId"] } } },
                        { $project: { name: 1 } }
                    ],
                    as: "managerInfo"
                }
            },
            {
                $lookup: {
                    from: "milestones",
                    let: { pId: { $toString: "$_id" } },
                    pipeline: [
                        { $match: { $expr: { $eq: ["$projectId", "$$pId"] } } }
                    ],
                    as: "milestones"
                }
            },
            {
                $lookup: {
                    from: "tasks",
                    let: { pId: { $toString: "$_id" } },
                    pipeline: [
                        { $match: { $expr: { $eq: ["$projectId", "$$pId"] } } }
                    ],
                    as: "tasks"
                }
            },
            {
                $addFields: {
                    managerName: { $arrayElemAt: ["$managerInfo.name", 0] }, // Extract the name
                    totalTasks: { $size: "$tasks" },
                    completedTasks: {
                        $size: {
                            $filter: {
                                input: "$tasks",
                                as: "task",
                                cond: { $in: ["$$task.status", ["Completed", "Closed", "completed", "closed"]] }
                            }
                        }
                    }
                }
            }
        ]);

        if (!report || report.length === 0) return res.status(404).json({ success: false });

        res.status(200).json({ success: true, report: report[0] });

    } catch (error) {

        return res.status(500).json({ success: false });
    }

});

