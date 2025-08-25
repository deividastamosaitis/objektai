import mongoose from "mongoose";

const ReminderSchema = new mongoose.Schema({
  email: { type: String, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  sendAt: { type: Date, required: true },
});

export default mongoose.model("Reminder", ReminderSchema);
