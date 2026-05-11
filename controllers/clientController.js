const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const ErrorHandler = require("../utils/errorHandler");
const Client = require("../models/client");
const Counter = require("../models/counter");
const User = require("../models/user");

const AWS = require("aws-sdk");

const s3 = new AWS.S3({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
});

exports.newClient = catchAsyncErrors(async (req, res, next) => {
  const isUser = await User.findOne({
    email: req.body.email,
  });

  if (isUser) {
    return next(new ErrorHandler("User already exist", 409));
  }

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

    return "CL-NJT-" + result.sequence_value.toString().padStart(3, "0");
  }

  req.body.clientId = await getNextSequence("client");

  req.body.role = "client";
  req.body.email = req.body.contactEmail;

  await User.create(req.body);

  const client = await Client.create(req.body);
  res.status(201).json({
    success: true,
    client,
  });
});

exports.getClientAll = catchAsyncErrors(async (req, res, next) => {
  const client = await Client.find();

  res.status(200).json({
    success: true,
    client,
  });
});

exports.getClient = catchAsyncErrors(async (req, res, next) => {
  const client = await Client.findById(req.params.id);

  res.status(200).json({
    success: true,
    client,
  });
});

exports.updateClient = catchAsyncErrors(async (req, res, next) => {
  let client = await Client.find({ clientId: req.body.clientId });

  if (!client) {
    return next(new ErrorHandler("Client not found", 404));
  }

  client = await Client.findOneAndUpdate(
    { clientId: req.body.clientId },
    req.body,
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  );

  res.status(200).json({
    success: true,
    client,
  });
});

exports.removeClient = catchAsyncErrors(async (req, res, next) => {
  const client = await Client.findOneAndDelete({
    clientId: req.params.id,
  });

  res.status(200).json({
    success: true,
    client,
  });
});
