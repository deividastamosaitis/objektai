import Reminder from "../models/ReminderModel.js";
import { StatusCodes } from "http-status-codes";

export const addReminder = async (req, res) => {
  try {
    const { email, subject, message, sendAt } = req.body;
    const newReminder = new Reminder({ email, subject, message, sendAt });
    await newReminder.save();
    res.status(StatusCodes.CREATED).json(newReminder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getReminder = async (req, res) => {
  try {
    const reminders = await Reminder.find();
    res.status(StatusCodes.OK).json(reminders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
