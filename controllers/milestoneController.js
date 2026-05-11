const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const ErrorHandler = require("../utils/errorHandler");
const Milestone = require("../models/milestone");
const Counter = require("../models/counter");

exports.newMilestone = catchAsyncErrors(async (req, res, next) => {
  const milestone = await Milestone.create(req.body);

  res.status(201).json({
    success: true,
    milestone,
  });
});

exports.getAllMilestones = catchAsyncErrors(async (req, res, next) => {
  const milestones = await Milestone.find();

  res.status(200).json({
    success: true,
    milestones,
  });
});

exports.getMilestone = catchAsyncErrors(async (req, res, next) => {
  const milestone = await Milestone.findById(req.params.id);

  if (!milestone) {
    return next(new ErrorHandler("Milestone not found", 404));
  }

  res.status(200).json({
    success: true,
    milestone,
  });
});

exports.updateMilestone = catchAsyncErrors(async (req, res, next) => {
  let milestone = await Milestone.findById(req.body._id);

  if (!milestone) {
    return next(new ErrorHandler("Milestone not found", 404));
  }

  milestone = await Milestone.findByIdAndUpdate(req.body._id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
    milestone,
  });
});

exports.removeMilestone = catchAsyncErrors(async (req, res, next) => {
  const milestone = await Milestone.findByIdAndDelete(req.params.id);

  if (!milestone) {
    return next(new ErrorHandler("Milestone not found", 404));
  }

  res.status(200).json({
    success: true,
    milestone,
  });
});
