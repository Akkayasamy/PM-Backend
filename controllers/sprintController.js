const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const ErrorHandler = require("../utils/errorHandler");
const Sprint = require("../models/sprint");
const Counter = require("../models/counter");

async function getNextSprintSequence(name) {
  const result = await Counter.findOneAndUpdate(
    { name: name },
    { $inc: { sequence_value: 1 } },
    { returnDocument: "after", upsert: true, setDefaultsOnInsert: true }
  );

  return "SPR-" + result.sequence_value.toString().padStart(3, "0");
}

exports.newSprint = catchAsyncErrors(async (req, res, next) => {
  req.body.sprint_id = await getNextSprintSequence("sprint");

  const sprint = await Sprint.create(req.body);

  res.status(201).json({
    success: true,
    sprint,
  });
});

exports.getAllSprints = catchAsyncErrors(async (req, res, next) => {
  const sprints = await Sprint.find();

  res.status(200).json({
    success: true,
    sprints,
  });
});

exports.getSprint = catchAsyncErrors(async (req, res, next) => {
  const sprint = await Sprint.findById(req.params.id);

  if (!sprint) {
    return next(new ErrorHandler("Sprint not found", 404));
  }

  res.status(200).json({
    success: true,
    sprint,
  });
});

exports.getSprintBySprintId = catchAsyncErrors(async (req, res, next) => {
  const sprint = await Sprint.findOne({ sprint_id: req.params.sprintId });

  if (!sprint) {
    return next(new ErrorHandler("Sprint not found", 404));
  }

  res.status(200).json({
    success: true,
    sprint,
  });
});

exports.updateSprint = catchAsyncErrors(async (req, res, next) => {
  let sprint = await Sprint.findOne({ sprint_id: req.body.sprint_id });

  if (!sprint) {
    return next(new ErrorHandler("Sprint not found", 404));
  }

  sprint = await Sprint.findOneAndUpdate(
    { sprint_id: req.body.sprint_id },
    req.body,
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  );

  res.status(200).json({
    success: true,
    sprint,
  });
});

exports.addTaskInSprint = catchAsyncErrors(async (req, res, next) => {
  let sprint = await Sprint.findOne({ sprint_id: req.body.sprint_id });

  if (!sprint) {
    return next(new ErrorHandler("Sprint not found", 404));
  }
  sprint.tasks = req.body.tasks;

  await sprint.save();

  res.status(200).json({
    success: true,
    sprint,
  });
});

exports.removeSprint = catchAsyncErrors(async (req, res, next) => {
  const sprint = await Sprint.findOneAndDelete({ sprint_id: req.params.id });

  if (!sprint) {
    return next(new ErrorHandler("Sprint not found", 404));
  }

  res.status(200).json({
    success: true,
    sprint,
  });
});
