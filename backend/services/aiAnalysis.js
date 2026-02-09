import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ✅ AGGRESSIVE JSON CLEANER
function extractJSON(text) {
  if (!text) return null;

  text = text.replace(/```json/gi, '').replace(/```/g, '');

  const objStart = text.indexOf('{');
  const arrStart = text.indexOf('[');

  let start =
    objStart === -1 ? arrStart :
    arrStart === -1 ? objStart :
    Math.min(objStart, arrStart);

  if (start === -1) return null;

  const endChar = text[start] === '{' ? '}' : ']';
  const end = text.lastIndexOf(endChar);

  if (end === -1) return null;

  let json = text.substring(start, end + 1);

  json = json
    .replace(/,(\s*[}\]])/g, '$1')
    .replace(/,+/g, ',');

  return json;
}



// ✅ SAFE PARSE with fallback
function safeParse(text, fallback) {
  try {
    const cleaned = extractJSON(text);
    if (!cleaned) return fallback;
    return JSON.parse(cleaned);
  } catch (error) {
    console.error(`   ⚠️  Parse error: ${error.message}`);
    
    // Try one more aggressive fix
    try {
      let aggressive = text
        .replace(/,\s*([}\]])/g, '$1')
        .replace(/([}\]])\s*,/g, '$1')
        .replace(/,+/g, ',');
      
      return JSON.parse(extractJSON(aggressive));
    } catch (e) {
      console.error(`   ⚠️  Second attempt failed`);
      return fallback;
    }
  }
}

function detectCategory(text="") {
  text = text.toLowerCase();

  if (text.includes("title") || text.includes("meta")) return "On-Page SEO";
  if (text.includes("alt") || text.includes("access")) return "Accessibility";
  if (text.includes("speed") || text.includes("load")) return "Performance";
  if (text.includes("mobile") || text.includes("viewport")) return "Mobile UX";
  if (text.includes("heading")) return "Content Structure";

  return "General SEO";
}


// ✅ SIMPLIFIED AI ANALYSIS - Smaller prompt, better JSON
export async function analyzeWithAI(pageData) {
  try {
    console.log(`   🤖 Analyzing: ${pageData.title}`);
    
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.1,  // Very low for consistency
        maxOutputTokens: 3000,  // Smaller = less chance of cutoff
      }
    });

    // MUCH SIMPLER PROMPT
    const prompt = `Analyze this webpage for SEO. Return ONLY valid JSON, no extra text.

Page Title: ${pageData.title || "MISSING"}
URL: ${pageData.url}
Meta Description: ${pageData.meta?.description || "MISSING"}
H1 Count: ${pageData.meta?.h1Count || 0}
Total Headings: ${pageData.headings?.length || 0}
Images: ${pageData.images?.length || 0}
Images Missing Alt: ${pageData.images?.filter(img => !img.alt).length || 0}
Has Viewport: ${pageData.meta?.viewport ? "Yes" : "No"}

Find the top 5 SEO issues and score the page.

Return this JSON exactly:
{
  "score": 75,
  "issues": [
    {"problem": "what's wrong", "fix": "how to fix", "priority": "High"}
  ],
  "strengths": ["what's good"]
}

JSON only, no explanations:`;

    const result = await model.generateContent(prompt);
    const rawText = result.response.text();
    
    console.log(`   📝 Response: ${rawText.length} chars`);
    
    // Fallback data
    const fallback = createFallback(pageData);
    
    // Parse response
    const parsed = safeParse(rawText, fallback);
    
    if (!parsed || (!parsed.score && !parsed.pageScore)) 
 {
      console.log(`   ⚠️  Using fallback analysis`);
      return fallback;
    }
    
    // Convert to full format
   const analysis = {
  pageScore: parsed.score ?? parsed.pageScore ?? 50,
  pageName: pageData.title,
  pageUrl: pageData.url,

criticalIssues: (parsed.issues || []).map(i => ({
  title: i.problem,
  why: "Detected by AI",
  fix: i.fix,
  impact: i.priority || "Medium",
  category: detectCategory(i.problem)
})),


  recommendations: [],
  strengths: parsed.strengths || [],
  quickWins: (parsed.issues || []).slice(0,3).map(i => i.problem)
};

    
    console.log(`   ✅ Score: ${analysis.pageScore}/100`);
    console.log(`   🔴 Issues: ${analysis.criticalIssues.length}`);
    
    return analysis;
    
  } catch (error) {
    console.error(`   ❌ AI failed: ${error.message}`);
    
    if (error.message.includes("quota") || error.message.includes("429")) {
      throw new Error("QUOTA_EXCEEDED");
    }
    
    throw error;

  }
}

// ✅ Smart fallback based on actual data
function createFallback(pageData) {
  const issues = [];
  let score = 100;
  
  // Check title
  if (!pageData.title || pageData.title === "No title") {
    issues.push({
      title: "Missing page title",
      why: "Google can't understand page topic",
      fix: "Add: <title>Primary Keyword | Brand</title>",
      impact: "High"
    });
    score -= 20;
  }
  
  // Check meta description
  if (!pageData.meta?.description) {
    issues.push({
      title: "No meta description",
      why: "Missing search result preview",
      fix: "Add: <meta name='description' content='150 char description'>",
      impact: "High"
    });
    score -= 15;
  }
  
  // Check H1
  if (pageData.meta?.h1Count === 0) {
    issues.push({
      title: "No H1 heading",
      why: "Search engines can't identify main topic",
      fix: "Add: <h1>Main Topic with Keywords</h1>",
      impact: "High"
    });
    score -= 15;
  } else if (pageData.meta?.h1Count > 1) {
    issues.push({
      title: `Multiple H1s (${pageData.meta.h1Count})`,
      why: "Confuses search engines",
      fix: "Use only ONE H1 per page",
      impact: "Medium"
    });
    score -= 10;
  }
  
  // Check images
  const noAlt = pageData.images?.filter(img => !img.alt).length || 0;
  if (noAlt > 0) {
    issues.push({
      title: `${noAlt} images without alt text`,
      why: "Lost SEO opportunity + accessibility issue",
      fix: "Add alt to all images: <img alt='description'>",
      impact: "Medium"
    });
    score -= 10;
  }
  
  // Check viewport
  if (!pageData.meta?.viewport) {
    issues.push({
      title: "No viewport meta tag",
      why: "Not mobile-friendly",
      fix: "Add: <meta name='viewport' content='width=device-width, initial-scale=1'>",
      impact: "High"
    });
    score -= 15;
  }
  
  const strengths = [];
  if (pageData.meta?.h1Count === 1) strengths.push("Correct H1 structure");
  if (pageData.meta?.description) strengths.push("Has meta description");
  if (pageData.structure?.hasMain) strengths.push("Uses semantic HTML");
  
  return {
    pageScore: Math.max(0, score),
    pageName: pageData.title,
    pageUrl: pageData.url,
    criticalIssues: issues.filter(i => i.impact === "High"),
    recommendations: issues.filter(i => i.impact !== "High"),
    strengths,
    quickWins: issues.slice(0, 3).map(i => i.title),
    _note: "Fallback analysis (AI unavailable)"
  };
}

// ✅ Site-wide analysis
export async function analyzeSiteWide(allPages) {
  try {
    console.log(`\n   🔍 Site-wide analysis...`);
    
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2000,
      }
    });

    const summary = allPages.map(p => ({
      url: p.url,
      title: p.title,
      h1: p.meta?.h1Count,
      metaDesc: !!p.meta?.description
    }));

    const prompt = `Compare these ${allPages.length} pages. Return ONLY JSON:

${JSON.stringify(summary)}

Find common issues. Return:
{
  "commonIssues": ["issue on multiple pages"],
  "topPriority": ["fix these first"],
  "score": 75
}

JSON only:`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    const parsed = safeParse(text, {
      commonIssues: [],
      topPriority: [],
      score: 50
    });
    
    console.log(`   ✅ Site Score: ${parsed.score}/100`);
    
    return parsed;
    
  } catch (error) {
    console.error(`   ❌ Site-wide failed: ${error.message}`);
    return null;
  }
}