const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const ErrorHandler = require("../utils/errorHandler");
const SubTask = require("../models/subtask");
const User = require("../models/user");
const Counter = require("../models/counter");

exports.newSubTask = catchAsyncErrors(async (req, res, next) => {
  async function getNextSequence(name) {
    const result = await Counter.findOneAndUpdate(
      { name: name },
      { $inc: { sequence_value: 1 } },
      {
        returnDocument: "after",
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );
    return "SUBTASK-NJT-" + result.sequence_value.toString().padStart(3, "3");
  }

  req.body.subTaskId = await getNextSequence("task");

  //   const { attachments } = req.body;

  //   if (attachments && attachments.length) {
  //     let uploadedFiles = [];
  //     for (let file of attachments) {
  //       const { fileName, fileContent } = file;
  //       const fileBuffer = Buffer.from(fileContent, "base64");

  //       const params = {
  //         Bucket: "nijatech-doc",
  //         Key: fileName,
  //         Body: fileBuffer,
  //       };

  //       try {
  //         await s3.putObject(params).promise();
  //         uploadedFiles.push(params.Key);
  //       } catch (err) {
  //         console.error("S3 upload error:", err);
  //         return next(new ErrorHandler("Failed to upload file to S3", 500));
  //       }
  //     }
  //     req.body.attachments = uploadedFiles;
  //   }

  const subTask = await SubTask.create(req.body);
  res.status(201).json({
    success: true,
    subTask,
  });
});

exports.getAllSubTasks = catchAsyncErrors(async (req, res, next) => {
  const subTasks = await SubTask.find();
  res.status(200).json({
    success: true,
    subTasks,
  });
});

exports.getSubTask = catchAsyncErrors(async (req, res, next) => {
  const subTask = await SubTask.findOne({ subTaskId: req.params.id });
  if (!task) {
    return next(new ErrorHandler("Task not found", 404));
  }
  res.status(200).json({
    success: true,
    subTask,
  });
});

exports.getSubTasksByUser = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (
    user.role === "admin" ||
    user.role === "project_manager" ||
    user.role === "Manager"
  ) {
    const subTasks = await SubTask.find();
    res.status(200).json({
      success: true,
      subTasks,
    });
  } else {
    const subTasks = await SubTask.find({
      $or: [
        { functionalConsultant: user._id },
        { technicalConsultant: user._id },
      ],
    });

    res.status(200).json({
      success: true,
      subTasks,
    });
  }
});

// exports.getSubTasksByParentTask = catchAsyncErrors(async (req, res, next) => {
//   const subTasks = await SubTask.find({
//     parentTaskId: req.params.id,
//   });
//   res.status(200).json({
//     success: true,
//     subTasks,
//   });
// });
exports.getSubTasksByParentTask = catchAsyncErrors(async (req, res, next) => {
  const subTasks = await SubTask.find({
    parentTaskId: req.params.id,
  }).lean();

  const subTaskMap = {};
  subTasks.forEach((task) => {
    task.children = [];
    subTaskMap[task.subTaskId] = task;
  });

  const rootTasks = [];
  subTasks.forEach((task) => {
    if (task.parentSubTaskId) {
      const parent = subTaskMap[task.parentSubTaskId];
      if (parent) {
        parent.children.push(task);
      }
    } else {
      rootTasks.push(task);
    }
  });

  res.status(200).json({
    success: true,
    subTasks: rootTasks,
  });
});

exports.updateSubTask = catchAsyncErrors(async (req, res, next) => {
  let subTask = await SubTask.findOne({ subTaskId: req.body.subTaskId });

  if (!subTask) {
    return next(new ErrorHandler("Task not found", 404));
  }

  //   const { attachments } = req.body;
  //   if (attachments && attachments.length) {
  //     let uploadedFiles = [];
  //     for (let file of attachments) {
  //       const { fileName, fileContent } = file;
  //       const fileBuffer = Buffer.from(fileContent, "base64");

  //       const params = {
  //         Bucket: "nijatech-app",
  //         Key: fileName,
  //         Body: fileBuffer,
  //       };

  //       try {
  //         await s3.putObject(params).promise();
  //         uploadedFiles.push(params.Key);
  //       } catch (err) {
  //         console.error("S3 upload error:", err);
  //         return next(new ErrorHandler("Failed to upload file to S3", 500));
  //       }
  //     }
  //     req.body.attachments = uploadedFiles;
  //   }

  subTask = await SubTask.findOneAndUpdate(
    { subTaskId: req.body.subTaskId },
    req.body,
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  );

  res.status(200).json({
    success: true,
    subTask,
  });
});

exports.addComment = catchAsyncErrors(async (req, res, next) => {
  let subTask = await SubTask.findOne({ subTaskId: req.body.subTaskId });

  if (!subTask) {
    return next(new ErrorHandler("Subask not found", 404));
  }
  subTask.comments.push(req.body);

  await subTask.save();

  res.status(200).json({
    success: true,
    subTask,
  });
});

exports.deleteSubTask = catchAsyncErrors(async (req, res, next) => {
  const subTask = await SubTask.findOneAndDelete({ subTaskId: req.params.id });
  if (!subTask) {
    return next(new ErrorHandler("Task not found", 404));
  }
  res.status(200).json({
    success: true,
    subTask,
  });
});
