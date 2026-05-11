const dotenv = require("dotenv");

dotenv.config({ path: "config/config.env" });

const User = require("../models/user");

const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const sendToken = require("../utils/jwtToken");
const sendEmail = require("../utils/sendEmail");
const OAuth = require("oauth-1.0a");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

// exports.registerUser = catchAsyncErrors(async (req, res, next) => {
//   const user = await User.create(req.body);
//   res
//     .status(201)
//     .json({ success: true, message: "User created sucessfully", user });
// });

exports.registerUser = catchAsyncErrors(async (req, res, next) => {
  const existUser = await User.findOne({
    email: req.body.email,
  });

  if (existUser) {
    // Object.assign(existUser, req.body);
    // await existUser.save();

    // res.status(200).json({
    //   success: true,
    // });
    return next(new ErrorHandler("User already exist", 409));
  }

  const data = req.body;
  try {
    const user = await User.create(data);
    res.status(201).json({
      success: true,
      user,
    });
  } catch (error) {
    console.log(`Error: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
});

exports.updateUser = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findOne({
    email: req.body.email,
  });

  if (user) {
    // return next(new ErrorHandler("Email already exist", 409));

    try {
      Object.assign(user, req.body);
      await user.save();

      res.status(200).json({
        success: true,
      });
    } catch (error) {
      console.log(`Error: ${error.message}`);
      res.status(500).json({ success: false, message: error.message });
    }
  }
});

exports.loginUser = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;

  // Checks if email and password is entered by user
  if (!email || !password) {
    // return next(new ErrorHandler('Please enter email & password', 400))
    return res.status(400).json({ msg: "Please enter email & password" });
  }

  // Finding user in database
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    // return next(new ErrorHandler('Invalid Email or Password', 401));
    return res.status(401).json({ msg: "Invalid Email or Password" });
  }

  // Checks if password is correct or not
  const isPasswordMatched = await user.comparePassword(password);

  if (!isPasswordMatched) {
    // return next(new ErrorHandler('Invalid Email or Password', 401));
    return res.status(401).json({ msg: "Invalid Email or Password" });
  }
  sendToken(user, 200, res);
  // firstTimeLogin(user.customerId);
});

exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorHandler("User not found with this email", 404));
  }

  const resetToken = user.getResetPasswordToken();

  await user.save({ validateBeforeSave: false });

  // const resetUrl = `${req.protocol}://${req.get(
  //   "host"
  // )}/forgotpassword/${resetToken}`;

  const resetUrl = `https://main.d3s6x5ck7u9orc.amplifyapp.com/forgotpassword/${resetToken}`;

  const message = `Your password reset token is as follow:\n\n${resetUrl}\n\nIf you have not requested this email, then ignore it.`;

  const url =
    "https://td2960798.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=1414&deploy=1";

  const oauth = OAuth({
    realm: process.env.REALM,
    consumer: {
      key: process.env.CONSUMER_KEY,
      secret: process.env.CONSUMER_SECRET,
    },
    signature_method: "HMAC-SHA256",
    hash_function(base_string, key) {
      return crypto
        .createHmac("sha256", key)
        .update(base_string)
        .digest("base64");
    },
  });

  const data = {
    customerId: user.customerId,
    resetUrl: resetUrl,
    type: "resetPassword",
  };

  const requestData = {
    url,
    method: "PUT",
  };

  const authorization = oauth.toHeader(
    oauth.authorize(requestData, {
      key: process.env.ACCESS_TOKEN,
      secret: process.env.TOKEN_SECRET,
    })
  );

  try {
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: authorization["Authorization"],
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    // const responseData = await response.json();
    if (response.status === 200) {
      res.status(200).json({
        success: true,
      });
    }
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    return next(new ErrorHandler(error.message, 500));
  }
});

exports.resetPassword = catchAsyncErrors(async (req, res, next) => {
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(
      new ErrorHandler(
        "Password reset token is invalid or has been expired",
        400
      )
    );
  }

  if (req.body.password !== req.body.confirmPassword) {
    return next(new ErrorHandler("Password does not match", 400));
  }

  user.password = req.body.password;

  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  res.status(200).json({
    success: true,
  });

  // sendToken(user, 200, res);
});

exports.getUserProfile = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  res.status(200).json({
    success: true,
    user,
  });
});

exports.updatePassword = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");

  // Check previous user password
  const isMatched = await user.comparePassword(req.body.oldPassword);
  if (!isMatched) {
    return next(new ErrorHandler("Old password is incorrect"));
  }

  user.password = req.body.password;
  await user.save();

  sendToken(user, 200, res);
});

exports.logout = catchAsyncErrors(async (req, res, next) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: "Logged out",
  });
});

exports.users = catchAsyncErrors(async (req, res, next) => {
  const users = await User.find();
  res.status(200).json({
    success: true,
    users,
  });
});

exports.getUserDetails = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(
      new ErrorHandler(`User does not found with id: ${req.params.id}`)
    );
  }

  res.status(200).json({
    success: true,
    user,
  });
});

// exports.updateUser = catchAsyncErrors(async (req, res, next) => {

//   const user = await User.findByIdAndUpdate(req.params.id, req.body, {
//     new: true,
//     runValidators: true,
//     useFindAndModify: false,
//   });

//   res.status(200).json({
//     success: true,
//     user,
//   });
// });

exports.deleteUser = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(
      new ErrorHandler(`User does not found with id: ${req.params.id}`)
    );
  }

  await User.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
  });
});

exports.verifyEmail = catchAsyncErrors(async (req, res, next) => {
  // const token = crypto.randomBytes(20).toString("hex");

  // // Save the user's email and verification token in the database
  // const user = new User({
  //     email: req.body.email,
  //     verificationToken: token
  // });
  // await user.save();

  // Send a verification email to the user
  const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    auth: {
      user: "sincere.spinka@ethereal.email",
      pass: "GQMnYz9efvUzxGwATM",
    },
  });
  const token = "a2e9a7d712eab26e55740a010dd4c55ee2f38357";
  const mailOptions = {
    from: "Your App <noreply@yourapp.com>",
    to: req.body.email,
    subject: "Verify Your Email",
    text: `Please click the following link to verify your email: http://localhost:3001/verify/${token}`,
  };
  await transporter.sendMail(mailOptions);

  res.send("Verification email sent");
});

exports.generateOtp = catchAsyncErrors(async (req, res, next) => {
  const accountSid = "AC36375c6673425c7bc89ec8240fb19131";
  const authToken = "b5b5e8bd8b3007549f2336a59f7f0803";
  const client = require("twilio")(accountSid, authToken);
  const phone = "+91" + req.body.mobile;

  client.verify.v2
    .services("VAff34df74c1b6d77171686cb48ac177e4")
    .verifications.create({ to: phone, channel: "sms" })
    .then((verification) =>
      res.status(200).json({
        data: verification,
      })
    )
    .catch((err) => {
      res.status(400).json({ msg: err });
    });
});

exports.verifyOtp = catchAsyncErrors(async (req, res, next) => {
  const accountSid = "AC36375c6673425c7bc89ec8240fb19131";
  const authToken = "b5b5e8bd8b3007549f2336a59f7f0803";
  const client = require("twilio")(accountSid, authToken);
  const phone = "+91" + req.body.mobile;
  const otp = req.body.otp;
  client.verify.v2
    .services("VAff34df74c1b6d77171686cb48ac177e4")
    .verificationChecks.create({ to: phone, code: otp })
    .then(async (verification) => {
      const user = await User.findOne({ phone: req.body.mobile });

      if (!user) {
        return res.status(401).json({ msg: "User not found" });
      }
      // res.status(200).json({
      //   data: verification,
      // });
      sendToken(user, 200, res);
      // if (verification.valid === false) {
      //   res.status(400).json({ msg: "Invalid OTP" });
      // }
    });
  // .catch((err) => {
  //   res.status(500).json({
  //     msg: err,
  //   });
  // });
});

exports.verify = catchAsyncErrors(async (req, res, next) => {
  const { email, token } = req.body;
  User.findOne({ email }, (err, user) => {
    if (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
      return;
    }

    if (!user) {
      res.status(404).send("User not found");
      return;
    }

    if (user.verificationToken !== token) {
      res.status(401).send("Invalid Token");
      return;
    }

    user.verified = true;
    user.verificationToken = undefined;
    user.save((err) => {
      if (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
        return;
      }

      res.send("Email verified successfully");
    });
  });
});

// exports.getUserInfo = catchAsyncErrors(async (req, res, next) => {
//   const customerId = req.params.id;
//   const user = await User.find({ customerId: customerId });
//   const invoice = await Invoice.find({ customerId: customerId });
//   const estimate = await Estimate.find({ customerId: customerId });
//   const salesOrder = await SalesOrder.find({ customerId: customerId });
//   const enquiry = await Enquiry.find({ customerId: customerId });
//   const serviceRequest = await ServiceRequest.find({ customerId: customerId });

//   const invoiceAmount = invoice.reduce((total, item) => total + item.total, 0);

//   const currentDate = new Date();
//   const sixMonthsAgo = new Date();
//   sixMonthsAgo.setMonth(currentDate.getMonth() - 6);

//   const filteredBills = invoice.filter((item) => {
//     const billDate = new Date(item.createdAt);
//     return billDate >= sixMonthsAgo && billDate <= currentDate;
//   });

//   const filteredEstimate = estimate.filter((item) => {
//     const estimateDate = new Date(item.createdAt);
//     return estimateDate >= sixMonthsAgo && estimateDate <= currentDate;
//   });

//   const filteredEnquiry = enquiry.filter((item) => {
//     const enquiryDate = new Date(item.createdAt);
//     return enquiryDate >= sixMonthsAgo && enquiryDate <= currentDate;
//   });

//   const filteredSalesOrder = salesOrder.filter((item) => {
//     const salesOrderDate = new Date(item.createdAt);
//     return salesOrderDate >= sixMonthsAgo && salesOrderDate <= currentDate;
//   });

//   const inProgress = estimate.filter(
//     (item) => item.status === "In Progress"
//   ).length;

//   const proposal = estimate.filter((item) => item.status === "Proposal").length;
//   const inNegotiation = estimate.filter(
//     (item) => item.status === "In Negotiation"
//   ).length;
//   const purchasing = estimate.filter(
//     (item) => item.status === "Purchasing"
//   ).length;

//   const inProgressServiceRequest = serviceRequest.filter(
//     (item) => item.status === "In Progress"
//   ).length;

//   const notStartedServiceRequest = serviceRequest.filter(
//     (item) => item.status === "Not Started"
//   ).length;
//   const completedServiceRequest = serviceRequest.filter(
//     (item) => item.status === "Closed"
//   ).length;

//   const monthlyData = {};

//   filteredBills.forEach((item) => {
//     const dateObj = new Date(item.createdAt);
//     const monthName = dateObj.toLocaleString("default", { month: "short" });

//     if (!monthlyData[monthName]) {
//       monthlyData[monthName] = {
//         name: monthName,
//         count: 0,
//         amount: 0,
//       };
//     }

//     monthlyData[monthName].count += 1;
//     monthlyData[monthName].amount += parseFloat(item.total);
//   });

//   const invoiceData = Object.values(monthlyData).sort((a, b) => {
//     const monthsOrder = [
//       "Jan",
//       "Feb",
//       "Mar",
//       "Apr",
//       "May",
//       "Jun",
//       "Jul",
//       "Aug",
//       "Sep",
//       "Oct",
//       "Nov",
//       "Dec",
//     ];
//     return monthsOrder.indexOf(a.name) - monthsOrder.indexOf(b.name);
//   });

//   const data = {
//     invoiceAmount: invoiceAmount,
//     enquiry: filteredEnquiry?.length,
//     salesOrder: filteredSalesOrder.length,
//     estimate: {
//       inProgress: inProgress,
//       inNegotiation: inNegotiation,
//       proposal: proposal,
//       purchasing: purchasing,
//       total: estimate.length,
//     },
//     serviceRequest: {
//       inProgress: inProgressServiceRequest,
//       notStarted: notStartedServiceRequest,
//       completed: completedServiceRequest,
//     },
//     invoice: invoiceData,
//   };

//   res.status(200).json({
//     success: true,
//     info: data,
//   });
// });

exports.updateCustomer = catchAsyncErrors(async (req, res, next) => {
  let user = await User.findOne({ customerId: req.body.customerId });

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  user = await User.findOneAndUpdate(
    { customerId: req.body.customerId },
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    success: true,
    user,
  });
});

exports.verifyMailOtp = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return res.status(401).json({ msg: "User not found" });
  }
  console.log(user);
  console.log(req.body);
  if (Number(user.otp) === Number(req.body.otp)) {
    user.otp = "";
    await user.save();
    sendToken(user, 200, res);
  } else {
    res.status(500).json({ success: false, message: "Invalid OTP" });
  }
});
