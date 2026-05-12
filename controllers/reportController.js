const mongoose = require('mongoose');
const Project = require('../models/project');
const User = require('../models/user');
const Task = require('../models/task'); // Assuming Task model exists
const catchAsyncErrors = require('../middlewares/catchAsyncErrors');

// Get all projects for selection
exports.getReportsList = catchAsyncErrors(async (req, res, next) => {
    const projects = await Project.find().select('name client status projectCode');
    res.status(200).json({ success: true, projects });
});

// Project Detail Report
exports.getProjectReport = catchAsyncErrors(async (req, res, next) => {
    const projectIdString = req.params.id;
    const report = await Project.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(projectIdString) } },
        {
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
        // Updated Milestone Lookup to include nested tasks
        {
            $lookup: {
                from: "milestones",
                let: { pId: { $toString: "$_id" } },
                pipeline: [
                    { $match: { $expr: { $eq: ["$projectId", "$$pId"] } } },
                    {
                        $lookup: {
                            from: "tasks",
                            let: { mStoneId: { $toString: "$_id" } },
                            pipeline: [
                                { $match: { $expr: { $eq: ["$milestoneId", "$$mStoneId"] } } }
                            ],
                            as: "milestoneTasks"
                        }
                    }
                ],
                as: "milestones"
            }
        },
        // General tasks lookup (keeps existing functionality for tasks not linked to milestones)
        {
            $lookup: {
                from: "tasks",
                let: { pId: { $toString: "$_id" } },
                pipeline: [{ $match: { $expr: { $eq: ["$projectId", "$$pId"] } } }],
                as: "tasks"
            }
        },
        {
            $addFields: {
                managerName: { $arrayElemAt: ["$managerInfo.name", 0] },
                totalTasks: { $size: "$tasks" },
                completedTasks: {
                    $size: {
                        $filter: {
                            input: "$tasks",
                            as: "task",
                            cond: { $in: ["$$task.status", ["Closed", "completed"]] }
                        }
                    }
                }
            }
        }
    ]);

    if (!report || report.length === 0) return res.status(404).json({ success: false });
    res.status(200).json({ success: true, report: report[0] });
});

// USER PERFORMANCE REPORT (New)
exports.getUserPerformanceReport = catchAsyncErrors(async (req, res, next) => {
    const userIdString = req.params.id;
    const report = await User.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(userIdString) } },
        {
            $lookup: {
                from: "tasks",
                let: { uId: { $toString: "$_id" } },
                pipeline: [
                    { $match: { $expr: { $eq: ["$technicalConsultant", "$$uId"] } } },
                    {
                        $project: {
                            taskId: 1, title: 1,
                            estimatedHours: { $toDouble: { $ifNull: ["$estimatedHours", 0] } },
                            actualHours: { $toDouble: { $ifNull: ["$totalHours", 0] } },
                            status: 1
                        }
                    }
                ],
                as: "tasks"
            }
        },
        {
            $addFields: {
                totalEstimated: { $sum: "$tasks.estimatedHours" },
                totalActual: { $sum: "$tasks.actualHours" },
                efficiency: {
                    $cond: [
                        { $gt: [{ $sum: "$tasks.actualHours" }, 0] },
                        { $round: [{ $multiply: [{ $divide: ["$totalEstimated", "$totalActual"] }, 100] }, 1] },
                        0
                    ]
                }
            }
        }
    ]);
    res.status(200).json({ success: true, report: report[0] });
});