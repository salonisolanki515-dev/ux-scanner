import express from "express";
import { startScan } from "../controllers/scanController.js";

const router = express.Router();

// ✅ FIX HERE
router.post("/", startScan);

export default router;
