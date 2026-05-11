const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const ErrorHandler = require("../utils/errorHandler");
const Consultant = require("../models/consultant");
const Counter = require("../models/counter");

async function getNextConsultantSequence(name) {
  const result = await Counter.findOneAndUpdate(
    { name: name },
    { $inc: { sequence_value: 1 } },
    { returnDocument: "after", upsert: true, setDefaultsOnInsert: true }
  );

  return "CONS-NJT-" + result.sequence_value.toString().padStart(3, "0");
}

exports.newConsultant = catchAsyncErrors(async (req, res, next) => {
  req.body.consultantId = await getNextConsultantSequence("consultant");

  const consultant = await Consultant.create(req.body);

  res.status(201).json({
    success: true,
    consultant,
  });
});

exports.getAllConsultants = catchAsyncErrors(async (req, res, next) => {
  const consultants = await Consultant.find();

  res.status(200).json({
    success: true,
    consultants,
  });
});

exports.getConsultant = catchAsyncErrors(async (req, res, next) => {
  const consultant = await Consultant.findById(req.params.id);

  if (!consultant) {
    return next(new ErrorHandler("Consultant not found", 404));
  }

  res.status(200).json({
    success: true,
    consultant,
  });
});

exports.getConsultantsByRole = catchAsyncErrors(async (req, res, next) => {
  const consultants = await Consultant.find({ roleId: req.params.id });

  res.status(200).json({
    success: true,
    consultants,
  });
});

exports.updateConsultant = catchAsyncErrors(async (req, res, next) => {
  let consultant = await Consultant.findOne({
    consultantId: req.body.consultantId,
  });

  if (!consultant) {
    return next(new ErrorHandler("Consultant not found", 404));
  }

  consultant = await Consultant.findOneAndUpdate(
    { consultantId: req.body.consultantId },
    req.body,
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  );

  res.status(200).json({
    success: true,
    consultant,
  });
});

exports.removeConsultant = catchAsyncErrors(async (req, res, next) => {
  const consultant = await Consultant.findOneAndDelete({
    consultantId: req.params.id,
  });

  if (!consultant) {
    return next(new ErrorHandler("Consultant not found", 404));
  }

  res.status(200).json({
    success: true,
    consultant,
  });
});
