const Timesheet = require("../models/timesheet");
const Counter = require("../models/counter");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");

// Create Timesheet
exports.newTimesheet = catchAsyncErrors(async (req, res) => {
  const result = await Counter.findOneAndUpdate(
    { name: "timesheet" },
    { $inc: { sequence_value: 1 } },
    { upsert: true, new: true }
  );
  
  req.body.timesheetId = "TS-NJT-" + result.sequence_value.toString().padStart(3, "0");
  const timesheet = await Timesheet.create(req.body);

  res.status(201).json({ success: true, timesheet });
});

// Get ALL Timesheets (For Admin/Manager)
exports.getAllTimesheets = catchAsyncErrors(async (req, res) => {
  const timesheets = await Timesheet.find()
    .populate("userId", "name email")
    .populate("projectId", "name")
    .sort({ date: -1 });
    
  res.status(200).json({ success: true, timesheets });
});

// Get User's Timesheets
exports.getMyTimesheets = catchAsyncErrors(async (req, res) => {
  const timesheets = await Timesheet.find({ userId: req.params.userId })
    .populate("projectId", "name")
    .sort({ date: -1 });
    
  res.status(200).json({ success: true, timesheets });
});

// Get Single Timesheet Details
exports.getTimesheetDetails = catchAsyncErrors(async (req, res) => {
  const timesheet = await Timesheet.findById(req.params.id)
    .populate("projectId", "name")
    .populate("userId", "name");

  if (!timesheet) return res.status(404).json({ message: "Timesheet not found" });

  res.status(200).json({ success: true, timesheet });
});

// Get Timesheets by Project
exports.getTimesheetsByProject = catchAsyncErrors(async (req, res) => {
  const timesheets = await Timesheet.find({ projectId: req.params.projectId })
    .populate("userId", "name")
    .sort({ date: -1 });

  res.status(200).json({ success: true, timesheets });
});

// Update Timesheet
exports.updateTimesheet = catchAsyncErrors(async (req, res) => {
  let timesheet = await Timesheet.findById(req.params.id);
  if (!timesheet) return res.status(404).json({ message: "Not Found" });

  timesheet = await Timesheet.findByIdAndUpdate(req.params.id, req.body, { 
    new: true,
    runValidators: true 
  });
  res.status(200).json({ success: true, timesheet });
});

// Delete Timesheet
exports.deleteTimesheet = catchAsyncErrors(async (req, res) => {
  const timesheet = await Timesheet.findById(req.params.id);
  if (!timesheet) return res.status(404).json({ message: "Not Found" });

  await timesheet.deleteOne();
  res.status(200).json({ success: true, message: "Deleted" });
});