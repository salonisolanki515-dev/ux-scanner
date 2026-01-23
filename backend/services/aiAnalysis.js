import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export const aiAnalysis = async (scanData, issues) => {
  const prompt = `
You are a senior UX + SEO expert.

Website Scan Data:
${JSON.stringify(scanData, null, 2)}

Detected Issues:
${JSON.stringify(issues, null, 2)}

Return ONLY a valid JSON array like:
[
  {
    "issue": "Missing page title",
    "whyItMatters": "Search engines rely on titles for ranking",
    "fix": "<title>Professional Law Firm</title>"
  }
]

If no issues, return []
`;

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ]
      },
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    const outputText =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!outputText) return [];

    console.log("Gemini Raw Output:\n", outputText);

    try {
      return JSON.parse(outputText);
    } catch {
      return [{
        issue: "AI JSON Parse Failed",
        raw: outputText
      }];
    }

  } catch (err) {
    console.error("Gemini API Error:", err.response?.data || err.message);
    return [];
  }
};
