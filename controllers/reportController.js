const mongoose = require('mongoose');
const Project = require('../models/project');
const User = require('../models/user');
const Task = require('../models/task');
const Timesheet = require('../models/timesheet');
const Team = require('../models/team');


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


exports.getTimesheetReport = catchAsyncErrors(async (req, res, next) => {
    const { fromDate, toDate, projectId, userId } = req.query;

    let matchQuery = {};
    let targetUserIds = [];

    // 1. Handle Team Lead / Manager Logic
    if (userId && userId !== 'all') {
        const teams = await Team.find({
            $or: [
                { leadId: userId },
                { deliveryManager: userId }
            ]
        });

        if (teams.length > 0) {
            const memberIds = teams.flatMap(team => team.members);
            targetUserIds = [...new Set([...memberIds, userId])];
        } else {
            targetUserIds = [userId];
        }

        matchQuery.userId = {
            $in: targetUserIds.map(id => new mongoose.Types.ObjectId(id))
        };
    }

    // 2. Project & Date Filters
    if (projectId && projectId !== 'all') {
        matchQuery.projectId = new mongoose.Types.ObjectId(projectId);
    }

    if (fromDate && toDate) {
        matchQuery.date = {
            $gte: new Date(fromDate),
            $lte: new Date(toDate)
        };
    }

    const report = await Timesheet.aggregate([
        { $match: matchQuery },

        // 3. CONVERT STRING IDs TO OBJECTIDs
        // This is the "Full Fix": MongoDB cannot lookup if Types don't match (String vs ObjectId)
        {
            $addFields: {
                taskObjId: {
                    $cond: [
                        { $and: [{ $gt: ["$taskId", null] }, { $ne: ["$taskId", ""] }] },
                        { $toObjectId: "$taskId" },
                        null
                    ]
                },
                subTaskObjId: {
                    $cond: [
                        { $and: [{ $gt: ["$subTaskId", null] }, { $ne: ["$subTaskId", ""] }] },
                        { $toObjectId: "$subTaskId" },
                        null
                    ]
                }
            }
        },

        // 4. LOOKUPS
        { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "u" } },
        { $lookup: { from: "projects", localField: "projectId", foreignField: "_id", as: "p" } },
        { $lookup: { from: "milestones", localField: "milestoneId", foreignField: "_id", as: "m" } },
        { $lookup: { from: "tasks", localField: "taskObjId", foreignField: "_id", as: "t" } },
        { $lookup: { from: "subtasks", localField: "subTaskObjId", foreignField: "_id", as: "st" } },

        // 5. MAP FIELDS TO OUTPUT
        {
            $addFields: {
                userName: { $arrayElemAt: ["$u.name", 0] },
                userRole: { $arrayElemAt: ["$u.role", 0] },
                projectName: { $arrayElemAt: ["$p.name", 0] },
                projectCode: { $arrayElemAt: ["$p.projectId", 0] },
                milestoneName: { $arrayElemAt: ["$m.name", 0] },
                taskName: { $arrayElemAt: ["$t.title", 0] },
                subTaskName: { $arrayElemAt: ["$st.title", 0] }
            }
        },

        // 6. FINAL CLEANUP
        {
            $project: {
                u: 0, p: 0, m: 0, t: 0, st: 0,
                taskObjId: 0, subTaskObjId: 0
            }
        },
        { $sort: { date: -1, userName: 1 } }
    ]);

    res.status(200).json({
        success: true,
        count: report.length,
        data: report
    });
});