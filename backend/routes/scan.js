import express from "express";
import { startScan } from "../controllers/scanController.js";
import { validateURL } from "../utils/validators.js";

const router = express.Router();

router.post("/", validateURL, startScan);

export default router;
