import { Router } from "express";
const router = Router();

import {
  getAllJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  upsertMontavimas,
  exportMontavimasExcel,
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

router.patch("/:id/montavimas", validateIdParam, upsertMontavimas);
router.get("/:id/montavimas/export", validateIdParam, exportMontavimasExcel);

export default router;
