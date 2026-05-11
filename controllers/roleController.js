const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const ErrorHandler = require("../utils/errorHandler");
const Role = require("../models/role");
const Counter = require("../models/counter");

// Generate custom roleId like ROLE-NJT-001
async function getNextRoleSequence(name) {
  const result = await Counter.findOneAndUpdate(
    { name: name },
    { $inc: { sequence_value: 1 } },
    { returnDocument: "after", upsert: true, setDefaultsOnInsert: true }
  );

  return "ROLE-NJT-" + result.sequence_value.toString().padStart(3, "0");
}

// Create new Role
exports.newRole = catchAsyncErrors(async (req, res, next) => {
  req.body.roleId = await getNextRoleSequence("role");

  const role = await Role.create(req.body);

  res.status(201).json({
    success: true,
    role,
  });
});

// Get all Roles
exports.getAllRoles = catchAsyncErrors(async (req, res, next) => {
  const roles = await Role.find();

  res.status(200).json({
    success: true,
    roles,
  });
});

// Get single Role by ID
exports.getRole = catchAsyncErrors(async (req, res, next) => {
  const role = await Role.findById(req.params.id);

  if (!role) {
    return next(new ErrorHandler("Role not found", 404));
  }

  res.status(200).json({
    success: true,
    role,
  });
});

// Update Role by roleId
exports.updateRole = catchAsyncErrors(async (req, res, next) => {
  let role = await Role.findOne({ roleId: req.body.roleId });

  if (!role) {
    return next(new ErrorHandler("Role not found", 404));
  }

  role = await Role.findOneAndUpdate({ roleId: req.body.roleId }, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
    role,
  });
});

// Delete Role by roleId
exports.removeRole = catchAsyncErrors(async (req, res, next) => {
  const role = await Role.findOneAndDelete({
    roleId: req.params.id,
  });

  if (!role) {
    return next(new ErrorHandler("Role not found", 404));
  }

  res.status(200).json({
    success: true,
    role,
  });
});
