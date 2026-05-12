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
        // Find if this user is a lead or manager for any team
        const teams = await Team.find({
            $or: [
                { leadId: userId },
                { deliveryManager: userId }
            ]
        });

        if (teams.length > 0) {
            // If they are a lead, collect all member IDs from their teams
            // We also include the lead's own ID in case they log time too
            const memberIds = teams.flatMap(team => team.members);
            targetUserIds = [...new Set([...memberIds, userId])];
        } else {
            // If they aren't a lead, just filter for that specific user
            targetUserIds = [userId];
        }

        // Convert string IDs to ObjectIds for the aggregation match
        matchQuery.userId = {
            $in: targetUserIds.map(id => new mongoose.Types.ObjectId(id))
        };
    }

    // 2. Project Filter
    if (projectId && projectId !== 'all') {
        matchQuery.projectId = new mongoose.Types.ObjectId(projectId);
    }

    // 3. Date Filter
    if (fromDate && toDate) {
        matchQuery.date = {
            $gte: new Date(fromDate),
            $lte: new Date(toDate)
        };
    }

    const report = await Timesheet.aggregate([
        { $match: matchQuery },
        {
            $lookup: {
                from: "users",
                let: { uId: "$userId" },
                pipeline: [
                    { $match: { $expr: { $eq: ["$_id", "$$uId"] } } },
                    { $project: { name: 1, role: 1 } }
                ],
                as: "userInfo"
            }
        },
        {
            $lookup: {
                from: "projects",
                let: { pId: "$projectId" },
                pipeline: [
                    { $match: { $expr: { $eq: ["$_id", "$$pId"] } } },
                    { $project: { name: 1, projectId: 1 } }
                ],
                as: "projectInfo"
            }
        },
        {
            $addFields: {
                userName: { $arrayElemAt: ["$userInfo.name", 0] },
                userRole: { $arrayElemAt: ["$userInfo.role", 0] },
                projectName: { $arrayElemAt: ["$projectInfo.name", 0] }
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