import { Router } from "express";
const router = Router();

import {
  getAllJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
} from "../controllers/jobController.js";
import {
  validateJobInput,
  validateIdParam,
} from "../middleware/validationMiddleware.js";
import upload from "../middleware/multerMiddleware.js";

router
  .route("/")
  .get(getAllJobs)
  .post(upload.array("images"), validateJobInput, createJob);
router
  .route("/:id")
  .get(getJob)
  .patch(upload.array("images"), validateJobInput, validateIdParam, updateJob)
  .delete(validateIdParam, deleteJob);

export default router;
