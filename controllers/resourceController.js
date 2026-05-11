const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const ErrorHandler = require("../utils/errorHandler");
const Resource = require("../models/resource");

// Create new resource
exports.newResource = catchAsyncErrors(async (req, res, next) => {
  const resource = await Resource.create(req.body);

  res.status(201).json({
    success: true,
    resource,
  });
});

// Get all resources
exports.getAllResources = catchAsyncErrors(async (req, res, next) => {
  const resources = await Resource.find();

  res.status(200).json({
    success: true,
    resources,
  });
});

// Get single resource by ID
exports.getResource = catchAsyncErrors(async (req, res, next) => {
  const resource = await Resource.findById(req.params.id);

  if (!resource) {
    return next(new ErrorHandler("Resource not found", 404));
  }

  res.status(200).json({
    success: true,
    resource,
  });
});

// Update resource
exports.updateResource = catchAsyncErrors(async (req, res, next) => {
  let resource = await Resource.findById(req.body._id);

  if (!resource) {
    return next(new ErrorHandler("Resource not found", 404));
  }

  resource = await Resource.findByIdAndUpdate(req.body._id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
    resource,
  });
});

// Delete resource
exports.removeResource = catchAsyncErrors(async (req, res, next) => {
  const resource = await Resource.findByIdAndDelete(req.params.id);

  if (!resource) {
    return next(new ErrorHandler("Resource not found", 404));
  }

  res.status(200).json({
    success: true,
    resource,
  });
});
