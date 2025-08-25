import { Router } from "express";
import upload from "../middleware/multerMiddleware.js";
const router = Router();

import {
  getAllSutartys,
  createSutartis,
  getSutartis,
  uploadPDF,
} from "../controllers/sutartysController.js";

router.route("/").get(getAllSutartys).post(createSutartis);
router.get("/:id", getSutartis);
router.post("/upload", upload.single("file"), uploadPDF);

export default router;
