const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const ErrorHandler = require("../utils/errorHandler");
const Project = require("../models/project");
const Counter = require("../models/counter");
const OAuth = require("oauth-1.0a");
const crypto = require("crypto");
const AWS = require("aws-sdk");
const Milestone = require("../models/Milestone");
const Task = require("../models/Task");
const Subtask = require("../models/Subtask");
const Timesheet = require("../models/Timesheet");
const User = require("../models/user");

const s3 = new AWS.S3({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
});

exports.newProject = catchAsyncErrors(async (req, res, next) => {
  // const { file } = req.body;

  // if (file) {
  //   const { fileName, fileContent } = file;
  //   const fileBuffer = Buffer.from(fileContent, "base64");

  //   const params = {
  //     Bucket: "nijatech-app",
  //     Key: fileName,
  //     Body: fileBuffer,
  //   };

  //   try {
  //     await s3.putObject(params).promise();
  //     console.log("File uploaded successfully!");

  //     req.body.attachment = params.Key;
  //   } catch (err) {
  //     console.error("S3 upload error:", err);
  //     return next(new ErrorHandler("Failed to upload file to S3", 500));
  //   }
  // }
  // await Counter.create({ name: "project" });

  async function getNextSequence(name) {
    const result = await Counter.findOneAndUpdate(
      { name: name },
      {
        $inc: { sequence_value: 1 },
      },
      {
        returnDocument: "after",
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    return "PRJ-NJT-" + result.sequence_value.toString().padStart(3, "0");
  }

  req.body.projectId = await getNextSequence("project");

  const project = await Project.create(req.body);
  res.status(201).json({
    success: true,
    project,
  });
});

exports.getProjectAll = catchAsyncErrors(async (req, res, next) => {
  const project = await Project.find();

  res.status(200).json({
    success: true,
    project,
  });
});

exports.getProject = catchAsyncErrors(async (req, res, next) => {
  const project = await Project.findById(req.params.id);

  res.status(200).json({
    success: true,
    project,
  });
});

exports.getProjectByUser = catchAsyncErrors(async (req, res, next) => {
  const project = await Project.find({ requestorId: req.params.id });

  res.status(200).json({
    success: true,
    project,
  });
});

// exports.updateProject = catchAsyncErrors(async (req, res, next) => {
//   let project = await Project.findById(req.params.id);

//   if (!project) {
//     return next(new ErrorHandler("Project not found", 404));
//   }

//   project = await Project.findByIdAndUpdate(req.params.id, req.body, {
//     new: true,
//     runValidators: true,
//     useFindAndModify: false,
//   });

//   res.status(200).json({
//     success: true,
//     project,
//   });
// });

exports.updateProject = catchAsyncErrors(async (req, res, next) => {
  let project = await Project.findOne({
    projectId: req.body.projectId,
  });

  if (!project) {
    return next(new ErrorHandler("Project not found", 404));
  }

  const { file } = req.body;

  if (file) {
    const { fileName, fileContent } = file;
    const fileBuffer = Buffer.from(fileContent, "base64");

    const params = {
      Bucket: "nijatech-app",
      Key: fileName,
      Body: fileBuffer,
    };

    try {
      await s3.putObject(params).promise();
      console.log("File uploaded successfully!");

      req.body.attachment = params.Key;
    } catch (err) {
      console.error("S3 upload error:", err);
      return next(new ErrorHandler("Failed to upload file to S3", 500));
    }
  }

  project = await Project.findOneAndUpdate(
    { projectId: req.body.projectId },
    req.body,
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  );

  res.status(200).json({
    success: true,
    project,
  });
});

exports.removeProject = catchAsyncErrors(async (req, res, next) => {
  const project = await Project.findOneAndDelete({
    projectId: req.params.id,
  });

  res.status(200).json({
    success: true,
    project,
  });
});

exports.getAllProjectsTree = catchAsyncErrors(async (req, res, next) => {
  const { search, currentPage = 1 } = req.query;
  const limit = 10;
  const skip = (Number(currentPage) - 1) * limit;

  let queryCond = {};
  if (search) {
    queryCond = {
      $or: [
        { name: { $regex: search, $options: "i" } },
        { projectId: { $regex: search, $options: "i" } }
      ],
    };
  }

  const totalCount = await Project.countDocuments(queryCond);
  const projects = await Project.find(queryCond)
    .limit(limit)
    .skip(skip)
    .sort({ createdAt: -1 })
    .lean();

  const results = await Promise.all(
    projects.map(async (project) => {
      const pIdStr = project._id.toString();

      // 1. Fetch Milestones linked to Project
      const milestones = await Milestone.find({ projectId: pIdStr }).lean();

      const milestonesWithTasks = await Promise.all(
        milestones.map(async (ms) => {
          // 2. Fetch Tasks linked to this Milestone
          const tasks = await Task.find({
            milestoneId: ms._id.toString(),
            status: { $ne: 'Deleted' }
          }).lean();

          const tasksWithDetails = await Promise.all(
            tasks.map(async (task) => {
              // 3. Fetch Timesheets for the main Task
              const taskTimesheets = await Timesheet.find({
                taskId: task._id.toString(),
                subTaskId: ""
              }).lean();

              const userDetails = await User.findById({
                _id: task.technicalConsultant.toString(),
              }).lean();

              // 4. Fetch Subtasks for the Task
              const subtasks = await Subtask.find({
                parentTaskId: task.taskId
              }).lean();

              // 5. Fetch Timesheets for each Subtask
              const subtasksWithData = await Promise.all(
                subtasks.map(async (st) => {
                  const subtaskTs = await Timesheet.find({
                    subTaskId: st._id.toString(),
                  }).lean();
                  const userData = await User.findById({
                    _id: st.createdBy,
                  }).lean();

                  return { ...st, timesheets: subtaskTs, userData: userData };
                })
              );

              // 6. Build Subtask Recursive Tree
              const subTaskMap = {};
              subtasksWithData.forEach(st => {
                st.children = [];
                subTaskMap[st.subTaskId] = st;
              });

              const subtaskTree = [];
              subtasksWithData.forEach(st => {
                if (st.parentSubTaskId && subTaskMap[st.parentSubTaskId]) {
                  subTaskMap[st.parentSubTaskId].children.push(st);
                } else {
                  subtaskTree.push(st);
                }
              });

              return {
                ...task,
                subtasks: subtaskTree,
                timesheets: taskTimesheets,
                userDetails: userDetails
              };
            })
          );

          return { ...ms, tasks: tasksWithDetails };
        })
      );

      return {
        ...project,
        milestones: milestonesWithTasks
      };
    })
  );

  res.status(200).json({
    success: true,
    totalCount,
    results,
  });
});