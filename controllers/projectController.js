const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const ErrorHandler = require("../utils/errorHandler");
const Project = require("../models/project");
const Counter = require("../models/counter");
const OAuth = require("oauth-1.0a");
const crypto = require("crypto");
const AWS = require("aws-sdk");

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
