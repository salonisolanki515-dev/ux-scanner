import { puppeteerScan } from "../services/puppeteerScan.js";
import { analyzeUX } from "../services/analyzer.js";
import { aiAnalysis } from "../services/aiAnalysis.js";

export const startScan = async (req, res) => {
  const { url } = req.body;

  try {
    // 1️⃣ Scan website
    const scanData = await puppeteerScan(url);

    // 2️⃣ Rule-based detection
    const ruleIssues = analyzeUX(scanData);

    // Log issues safely
    console.log("Rule-based detected issues:", ruleIssues);

    // 3️⃣ AI enhancement (ONLY if issues exist)
    let enhancedIssues = [];

    if (ruleIssues && ruleIssues.length > 0) {
      enhancedIssues = await aiAnalysis(scanData, ruleIssues);
    }

    // 4️⃣ Final response
    res.status(200).json({
      success: true,
      scanData,
      issues: enhancedIssues,
    });

  } catch (error) {
    console.error("Scan Error:", error);
    res.status(500).json({
      success: false,
      message: "Scan failed",
    });
  }
};
