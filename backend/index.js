import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from 'url';
import scanRoutes from "./routes/scan.js";

// Load environment variables FIRST
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Verify API key is loaded
console.log("🔑 Checking environment variables...");
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY is not set in .env file!");
  console.error("   Please add your Gemini API key to the .env file");
} else {
  console.log("✅ GEMINI_API_KEY loaded successfully");
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ SERVE STATIC FILES FROM 'public' FOLDER
app.use(express.static(path.join(__dirname, 'public')));

// ✅ API HEALTH CHECK (separate endpoint)
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "✅ UX Scanner API is running",
    timestamp: new Date().toISOString(),
    apiKeyConfigured: !!process.env.GEMINI_API_KEY
  });
});

// ✅ API ROUTES
app.use("/scan", scanRoutes);

// ✅ SERVE FRONTEND - Catch all other routes (MUST BE LAST)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("❌ Unhandled error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: err.message
  });
});

// Start server with error handling
const server = app.listen(PORT, () => {
  console.log(`\n${"=".repeat(70)}`);
  console.log(`🚀 UX SCANNER - FRONTEND + BACKEND INTEGRATED`);
  console.log(`${"=".repeat(70)}`);
  console.log(`🌐 Open App:      http://localhost:${PORT}/`);
  console.log(`🔌 API Endpoint:  http://localhost:${PORT}/scan`);
  console.log(`💚 Health Check:  http://localhost:${PORT}/api/health`);
  console.log(`📁 Serving from:  ${path.join(__dirname, 'public')}`);
  console.log(`${"=".repeat(70)}\n`);
  console.log("✨ Frontend + Backend running together!");
  console.log(`   Just open http://localhost:${PORT}/ in your browser\n`);
});

// Handle server errors
server.on('error', (error) => {
  console.error("\n❌ Server Error:", error.message);
  
  if (error.code === 'EADDRINUSE') {
    console.error(`   Port ${PORT} is already in use!`);
    console.error("   Solutions:");
    console.error("   1. Kill the process using that port");
    console.error("   2. Change PORT in .env file");
    console.error(`   3. Run: netstat -ano | findstr :${PORT}`);
  }
  
  process.exit(1);
});

// Handle process termination
process.on('SIGTERM', () => {
  console.log('\n🛑 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n\n🛑 Ctrl+C pressed, shutting down...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('\n❌ Uncaught Exception:', error);
  console.error('Stack trace:', error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('\n❌ Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
});

console.log("⏳ Initializing server...");