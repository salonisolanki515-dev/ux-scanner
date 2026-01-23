import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import scanRoutes from "./routes/scan.js";


dotenv.config();
console.log("GEMINI KEY FOUND:", !!process.env.GEMINI_API_KEY);

const app = express();

app.use(cors());
app.use(express.json());

app.use("/scan", scanRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
