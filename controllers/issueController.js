const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const ErrorHandler = require("../utils/errorHandler");
const Issue = require("../models/issue");

// Create new issue
exports.newIssue = catchAsyncErrors(async (req, res, next) => {
  const issue = await Issue.create(req.body);

  res.status(201).json({
    success: true,
    issue,
  });
});

// Get all issues
exports.getAllIssues = catchAsyncErrors(async (req, res, next) => {
  const issues = await Issue.find();

  res.status(200).json({
    success: true,
    issues,
  });
});

// Get single issue by ID
exports.getIssue = catchAsyncErrors(async (req, res, next) => {
  const issue = await Issue.findById(req.params.id);

  if (!issue) {
    return next(new ErrorHandler("Issue not found", 404));
  }

  res.status(200).json({
    success: true,
    issue,
  });
});

// Update issue
exports.updateIssue = catchAsyncErrors(async (req, res, next) => {
  let issue = await Issue.findById(req.body._id);

  if (!issue) {
    return next(new ErrorHandler("Issue not found", 404));
  }

  issue = await Issue.findByIdAndUpdate(req.body._id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
    issue,
  });
});

// Delete issue
exports.removeIssue = catchAsyncErrors(async (req, res, next) => {
  const issue = await Issue.findByIdAndDelete(req.params.id);

  if (!issue) {
    return next(new ErrorHandler("Issue not found", 404));
  }

  res.status(200).json({
    success: true,
    issue,
  });
});
