import { GoogleGenerativeAI } from "@google/generative-ai";
import { PROMPTS } from "../utils/prompts.js";
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function cleanJsonResponse(text) {
  return text
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .replace(/^[^{]*/, '')
    .replace(/[^}]*$/,'')
    .trim();
}

export async function generateFixCode(issue, scanData) {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash", // ✅ Updated
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 4000,
      }
    });

    const context = {
      pageTitle: scanData.title,
      hasButtons: scanData.buttons?.length > 0,
      hasImages: scanData.images?.length > 0,
      imagesMissingAlt: scanData.images?.filter(img => !img.alt).length || 0
    };

    const prompt = PROMPTS.codeGeneration(issue, context);
    const result = await model.generateContent(prompt);
    const text = cleanJsonResponse(result.response.text());

    return JSON.parse(text);

  } catch (err) {
    console.error("Code Generation Failed:", err.message);
    
    return {
      htmlCode: "<!-- Unable to generate code -->",
      cssCode: "/* Unable to generate CSS */",
      reactCode: null,
      implementation: {
        steps: ["Manual review required"],
        fileChanges: [],
        dependencies: []
      },
      explanation: {
        before: issue.issue,
        after: issue.recommendedFix,
        impact: "Improved user experience"
      },
      testing: {
        manual: ["Test the fix manually"],
        automated: []
      }
    };
  }
}

export async function generateAllFixes(issues, scanData) {
  const fixes = [];

  for (const issue of issues) {
    const fix = await generateFixCode(issue, scanData);
    fixes.push({
      issue: issue.issue,
      priority: issue.priority,
      category: issue.category,
      fix
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return fixes;
}