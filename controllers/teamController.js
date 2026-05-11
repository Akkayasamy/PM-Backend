const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const ErrorHandler = require("../utils/errorHandler");
const Team = require("../models/team");
const Counter = require("../models/counter");

async function getNextTeamSequence(name) {
  const result = await Counter.findOneAndUpdate(
    { name: name },
    { $inc: { sequence_value: 1 } },
    { returnDocument: "after", upsert: true, setDefaultsOnInsert: true }
  );

  return "TEAM-NJT-" + result.sequence_value.toString().padStart(3, "0");
}

exports.newTeam = catchAsyncErrors(async (req, res, next) => {
  req.body.teamId = await getNextTeamSequence("team");

  const team = await Team.create(req.body);

  res.status(201).json({
    success: true,
    team,
  });
});

exports.getAllTeams = catchAsyncErrors(async (req, res, next) => {
  const teams = await Team.find();

  res.status(200).json({
    success: true,
    teams,
  });
});

exports.getTeam = catchAsyncErrors(async (req, res, next) => {
  const team = await Team.findById(req.params.id);

  if (!team) {
    return next(new ErrorHandler("Team not found", 404));
  }

  res.status(200).json({
    success: true,
    team,
  });
});

exports.getTeamsByLead = catchAsyncErrors(async (req, res, next) => {
  const teams = await Team.find({ leadId: req.params.id });

  res.status(200).json({
    success: true,
    teams,
  });
});

exports.updateTeam = catchAsyncErrors(async (req, res, next) => {
  let team = await Team.findOne({ teamId: req.body.teamId });

  if (!team) {
    return next(new ErrorHandler("Team not found", 404));
  }

  team = await Team.findOneAndUpdate({ teamId: req.body.teamId }, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
    team,
  });
});

exports.removeTeam = catchAsyncErrors(async (req, res, next) => {
  const team = await Team.findOneAndDelete({
    teamId: req.params.id,
  });

  if (!team) {
    return next(new ErrorHandler("Team not found", 404));
  }

  res.status(200).json({
    success: true,
    team,
  });
});
