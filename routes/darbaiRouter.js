import { Router } from "express";
const router = Router();

import {
  addDarbas,
  getAllDarbai,
  toggleDarbasDone,
  updateDarbas,
  deleteDarbas,
} from "../controllers/darbaiController.js";

router.post("/", addDarbas);
router.get("/", getAllDarbai);
router.get("/:id", toggleDarbasDone);
router.patch("/:id", updateDarbas);
router.delete("/:id", deleteDarbas);

export default router;
