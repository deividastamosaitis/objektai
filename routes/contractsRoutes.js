import express from "express";
import {
  createContract,
  listContracts,
  getPublicContract,
  signPublicContract,
} from "../controllers/contractsController.js";
import { authenticateUser } from "../middleware/authMiddleware.js";

const router = express.Router();

// Admin/protected
router.post("/", authenticateUser, createContract);
router.get("/", authenticateUser, listContracts);

// Viešas pasirašymas
router.get("/public/:token", getPublicContract);
router.post("/public/:token/sign", signPublicContract);

export default router;
