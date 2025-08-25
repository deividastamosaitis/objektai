import { Router } from "express";
const router = Router();

import { addReminder, getReminder } from "../controllers/reminderController.js";

router.post("/add", addReminder);
router.get("/", getReminder);

export default router;
