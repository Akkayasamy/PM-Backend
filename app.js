const express = require("express");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
// const fileUpload = require("express-fileupload");

const auth = require("./routes/auth");

const project = require("./routes/project");
const client = require("./routes/client");
const task = require("./routes/task");
const team = require("./routes/team");
const role = require("./routes/role");
const consultant = require("./routes/consultant");
const subTask = require("./routes/subTask");
const milestone = require("./routes/milestone");
const resource = require("./routes/resource");
const issue = require("./routes/issue");
const sprint = require("./routes/sprint");
const timesheet = require("./routes/timesheetRoutes");

app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));
app.use(cookieParser());
// app.use(fileUpload());

const corsOptions = {
  // origin: "https://main.d12f6ibxzoxlvr.amplifyapp.com",
  origin: "http://localhost:3000",
  credentials: true,
};

app.use(cors(corsOptions));

app.use(express.json({ limit: "10mb" }));
app.use("/api/v1", auth);

app.use("/api/v1", project);
app.use("/api/v1", client);
app.use("/api/v1", task);
app.use("/api/v1", team);
app.use("/api/v1", role);
app.use("/api/v1", consultant);
app.use("/api/v1", subTask);
app.use("/api/v1", milestone);
app.use("/api/v1", resource);
app.use("/api/v1", issue);
app.use("/api/v1", sprint);
app.use("/api/v1", timesheet);

module.exports = app;
