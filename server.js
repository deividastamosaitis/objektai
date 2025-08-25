import "express-async-errors";
import * as dotenv from "dotenv";
dotenv.config();
import express from "express";
const app = express();
import morgan from "morgan";
import mongoose, { mongo } from "mongoose";
import cookieParser from "cookie-parser";
import cloudinary from "cloudinary";

//reminders
import cron from "node-cron";
import Reminder from "./models/ReminderModel.js";
import { sendReminderEmail } from "./mailer.js";

//routers
import jobRouter from "./routes/jobRouter.js";
import authRouter from "./routes/authRouter.js";
import userRouter from "./routes/userRouter.js";
import darbaiRouter from "./routes/darbaiRouter.js";
import reminders from "./routes/reminders.js";
import sutartysRouter from "./routes/sutartysRouter.js";

//public
import { dirname } from "path";
import { fileURLToPath } from "url";
import path from "path";

//middleware
import errorHandlerMiddleware from "./middleware/errorHandlerMiddleware.js";
import { authenticateUser } from "./middleware/authMiddleware.js";

//cloudinary
cloudinary.config({
  secure: true,
  cloud_name: "dqkckpob1",
  api_key: "534921817683276",
  api_secret: "MJ0xbEKTIPLjaJANnbSAvLJVpDs",
});
// cloudinary.config({
//   cloud_name: process.env.CLOUD_NAME,
//   api_key: process.env.CLOUD_API_KEY,
//   api_secret: process.env.CLOUD_API_SECRET,
// });

const __dirname = dirname(fileURLToPath(import.meta.url));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}
app.use(express.static(path.resolve(__dirname, "./public")));
app.use(cookieParser());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello world");
});

app.get("/api/v1/test", (req, res) => {
  res.json({ msg: "test route" });
});

app.use("/api/v1/jobs", authenticateUser, jobRouter);
app.use("/api/v1/users", authenticateUser, userRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/darbai", darbaiRouter);
app.use("/api/v1/reminders", reminders);
app.use("/api/v1/sutartys", sutartysRouter);

app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "./public", "index.html"));
});

app.use("*", (req, res) => {
  res.status(404).json({ msg: "not found" });
});

app.use(errorHandlerMiddleware);

const port = process.env.PORT || 5100;

try {
  await mongoose.connect(process.env.MONGO_URL);
  app.listen(port, () => {
    console.log(`server running on PORT: ${port}`);
  });
} catch (error) {
  console.log(error);
  process.exit(1);
}

//reminder
cron.schedule("* * * * *", async () => {
  const now = new Date();
  const reminders = await Reminder.find({ sendAt: { $lte: now } });

  reminders.forEach((reminder) => {
    sendReminderEmail(reminder.email, reminder.subject, reminder.message);
    reminder.deleteOne();
  });
});
