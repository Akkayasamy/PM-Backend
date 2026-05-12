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

  // 1. Build Project Search Query
  let queryCond = {};
  if (search) {
    queryCond = {
      $or: [
        { name: { $regex: search, $options: "i" } },
        { projectId: { $regex: search, $options: "i" } }
      ],
    };
  }

  // 2. Fetch Projects
  const totalCount = await Project.countDocuments(queryCond);
  const projects = await Project.find(queryCond)
    .limit(limit)
    .skip(skip)
    .sort({ createdAt: -1 })
    .lean();

  const results = await Promise.all(
    projects.map(async (project) => {
      // Use the hex string version of the _id for string-based comparisons
      const pIdHexStr = project._id.toString();

      // 3. Fetch Milestones
      // We check for the string ID directly to avoid the ObjectId CastError
      const milestones = await Milestone.find({
        $or: [
          { projectId: pIdHexStr },            // Matches '6a01a835...' string
          // { projectId: project.projectId }     // Matches 'PRJ-NJT-001' string
        ]
      }).lean();

      const milestonesWithTasks = await Promise.all(
        milestones.map(async (ms) => {
          // 4. Fetch Tasks 
          // Tasks are linked to the Project by the hex string in your DB
          const tasks = await Task.find({
            projectId: pIdHexStr,
            status: { $ne: 'Deleted' }
          }).lean();

          const tasksWithDetails = await Promise.all(
            tasks.map(async (task) => {
              // 5. Fetch Subtasks using the custom taskId string (e.g., 'TASK-NJT-331')
              const allSubtasks = await Subtask.find({
                parentTaskId: task.taskId
              }).lean();

              // 6. Fetch Timesheets for each Subtask
              const subtasksWithTimesheets = await Promise.all(
                allSubtasks.map(async (st) => {
                  const ts = await Timesheet.find({
                    $or: [
                      { subTaskId: st.subTaskId },      // String ID
                      { subTaskId: st._id.toString() }  // Hex String
                    ]
                  }).lean();
                  return { ...st, timesheets: ts };
                })
              );

              // 7. Build Subtask Recursive Tree
              const subTaskMap = {};
              subtasksWithTimesheets.forEach(st => {
                st.children = [];
                subTaskMap[st.subTaskId] = st;
              });

              const subtaskTree = [];
              subtasksWithTimesheets.forEach(st => {
                if (st.parentSubTaskId && subTaskMap[st.parentSubTaskId]) {
                  subTaskMap[st.parentSubTaskId].children.push(st);
                } else {
                  subtaskTree.push(st);
                }
              });

              // 8. Fetch Timesheets for the main Task
              const taskTimesheets = await Timesheet.find({
                $or: [
                  { taskId: task._id },          // ObjectId
                  { taskId: task.taskId },       // Custom ID String
                  { taskId: task._id.toString() } // Hex String
                ]
              }).lean();

              return {
                ...task,
                subtasks: subtaskTree,
                timesheets: taskTimesheets
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