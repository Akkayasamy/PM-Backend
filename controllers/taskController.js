const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const ErrorHandler = require("../utils/errorHandler");
const Task = require("../models/task");
const User = require("../models/user");
const Counter = require("../models/counter");
const AWS = require("aws-sdk");

const s3 = new AWS.S3({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
});

exports.newTask = catchAsyncErrors(async (req, res, next) => {
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
    return "TASK-NJT-" + result.sequence_value.toString().padStart(3, "3");
  }

  req.body.taskId = await getNextSequence("task");

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

  const task = await Task.create(req.body);
  res.status(201).json({
    success: true,
    task,
  });
});

exports.uploadAttachment = catchAsyncErrors(async (req, res, next) => {
  const { fileName, fileContent } = req.body;
  const fileBuffer = Buffer.from(fileContent, "base64");

  const params = {
    Bucket: "nijatech-doc",
    Key: fileName,
    Body: fileBuffer,
  };

  try {
    await s3.putObject(params).promise();
    res.status(200).json({
      success: true,
      file: params.Key,
    });
    console.log("File uploaded successfully!");
  } catch (err) {
    console.error("S3 upload error:", err);
    return next(new ErrorHandler("Failed to upload file to S3", 500));
  }
});

exports.getDocument = catchAsyncErrors(async (req, res, next) => {
  const s3 = new AWS.S3({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  });

  const key = req.params.file;

  const params = {
    Bucket: "nijatech-doc",
    Key: key,
    Expires: 60 * 5,
  };

  s3.getSignedUrl("getObject", params, (err, url) => {
    if (err) {
      console.error("Error generating URL", err);
      res.status(500).json({ error: "Error generating URL" });
    } else {
      res.status(200).json({
        success: true,
        url,
      });
    }
  });
});

exports.getAllTasks = catchAsyncErrors(async (req, res, next) => {
  const tasks = await Task.find();
  res.status(200).json({
    success: true,
    tasks,
  });
});

exports.getTask = catchAsyncErrors(async (req, res, next) => {
  const task = await Task.findOne({ taskId: req.params.id });
  if (!task) {
    return next(new ErrorHandler("Task not found", 404));
  }
  res.status(200).json({
    success: true,
    task,
  });
});

exports.getTasksByUser = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (
    user.role === "admin" ||
    user.role === "project_manager" ||
    user.role === "Manager"
  ) {
    const tasks = await Task.find();
    res.status(200).json({
      success: true,
      tasks,
    });
  } else {
    const tasks = await Task.find({
      $or: [
        { functionalConsultant: user._id },
        { technicalConsultant: user._id },
      ],
    });

    res.status(200).json({
      success: true,
      tasks,
    });
  }
});

exports.getTasksByProject = catchAsyncErrors(async (req, res, next) => {
  const tasks = await Task.find({ projectId: req.params.projectId });
  res.status(200).json({
    success: true,
    tasks,
  });
});

exports.updateTask = catchAsyncErrors(async (req, res, next) => {
  let task = await Task.findOne({ taskId: req.body.taskId });

  if (!task) {
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

  task = await Task.findOneAndUpdate({ taskId: req.body.taskId }, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
    task,
  });
});

exports.addComment = catchAsyncErrors(async (req, res, next) => {
  let task = await Task.findOne({ taskId: req.body.taskId });

  if (!task) {
    return next(new ErrorHandler("Task not found", 404));
  }
  task.comments.push(req.body);

  await task.save();

  res.status(200).json({
    success: true,
    task,
  });
});

exports.deleteTask = catchAsyncErrors(async (req, res, next) => {
  const task = await Task.findOneAndDelete({ taskId: req.params.id });
  if (!task) {
    return next(new ErrorHandler("Task not found", 404));
  }
  res.status(200).json({
    success: true,
    task,
  });
});
