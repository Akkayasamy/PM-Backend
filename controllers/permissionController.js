const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const ErrorHandler = require("../utils/errorHandler");
const Permission = require("../models/permission");
const Counter = require("../models/counter");

async function getNextPermissionSequence(name) {
  const result = await Counter.findOneAndUpdate(
    { name: name },
    { $inc: { sequence_value: 1 } },
    { returnDocument: "after", upsert: true, setDefaultsOnInsert: true }
  );

  return "PERM-NJT-" + result.sequence_value.toString().padStart(3, "0");
}

exports.newPermission = catchAsyncErrors(async (req, res, next) => {
  req.body.permissionId = await getNextPermissionSequence("permission");

  const permission = await Permission.create(req.body);

  res.status(201).json({
    success: true,
    permission,
  });
});

exports.getAllPermissions = catchAsyncErrors(async (req, res, next) => {
  const permissions = await Permission.find();

  res.status(200).json({
    success: true,
    permissions,
  });
});

exports.getPermission = catchAsyncErrors(async (req, res, next) => {
  const permission = await Permission.findById(req.params.id);

  if (!permission) {
    return next(new ErrorHandler("Permission not found", 404));
  }

  res.status(200).json({
    success: true,
    permission,
  });
});

exports.updatePermission = catchAsyncErrors(async (req, res, next) => {
  let permission = await Permission.findOne({
    permissionId: req.body.permissionId,
  });

  if (!permission) {
    return next(new ErrorHandler("Permission not found", 404));
  }

  permission = await Permission.findOneAndUpdate(
    { permissionId: req.body.permissionId },
    req.body,
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  );

  res.status(200).json({
    success: true,
    permission,
  });
});

exports.removePermission = catchAsyncErrors(async (req, res, next) => {
  const permission = await Permission.findOneAndDelete({
    permissionId: req.params.id,
  });

  if (!permission) {
    return next(new ErrorHandler("Permission not found", 404));
  }

  res.status(200).json({
    success: true,
    permission,
  });
});
