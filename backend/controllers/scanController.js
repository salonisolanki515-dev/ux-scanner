import { puppeteerScan, crawlWebsite } from "../services/puppeteerScan.js";
import { analyzeWithAI, analyzeSiteWide } from "../services/aiAnalysis.js";

export const startScan = async (req, res) => {
  console.log("\n" + "=".repeat(70));
  console.log("🚀 AI-POWERED SEO SCANNER");
  console.log("=".repeat(70));

  try {
    const { url, options = {} } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: "URL required"
      });
    }

    const multiPage = options.multiPage === true;
    const maxPages = options.maxPages || 5;

    console.log(`\n📍 Target: ${url}`);
    console.log(`🎯 Mode: ${multiPage ? `Multi-page (${maxPages} pages)` : 'Single page'}`);
    console.log(`🤖 Analysis: 100% AI\n`);

    if (multiPage) {
      // ==========================================
      // MULTI-PAGE: Crawl + AI Analysis
      // ==========================================
      
      console.log("Step 1: Crawling website...\n");
      const crawlResult = await crawlWebsite(url, { maxPages, maxDepth: 2 });
      
      console.log(`\n✅ Crawled ${crawlResult.totalPages} pages`);
      console.log("\nStep 2: AI analyzing each page...\n");
      console.log("=".repeat(70));

      const pageAnalyses = [];
      let quotaExceeded = false;
      
      for (let i = 0; i < crawlResult.pages.length; i++) {
        const pageData = crawlResult.pages[i];
        
        console.log(`\n[${i + 1}/${crawlResult.totalPages}] ${pageData.url}`);
        
        try {
          const analysis = await analyzeWithAI(pageData);
          
          pageAnalyses.push({
            pageNumber: i + 1,
            url: pageData.url,
            title: pageData.title,
            aiAnalysis: analysis
          });
          
          // Rate limiting
          if (i < crawlResult.pages.length - 1) {
            console.log("   ⏳ Waiting 2s...");
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
          
        } catch (error) {
          if (error.message === "QUOTA_EXCEEDED") {
            console.log(`   ⚠️  Quota exceeded. Stopping scan.`);
            quotaExceeded = true;
            break;
          }
          
          pageAnalyses.push({
            pageNumber: i + 1,
            url: pageData.url,
            title: pageData.title,
            error: error.message
          });
        }
      }

      // Site-wide comparison
      let siteWideAnalysis = null;
      
      if (!quotaExceeded && pageAnalyses.length > 1) {
        console.log("\n" + "=".repeat(70));
        console.log("Step 3: Site-wide comparison...\n");
        
        try {
          siteWideAnalysis = await analyzeSiteWide(crawlResult.pages);
        } catch (error) {
          console.log(`   ⚠️  Skipped: ${error.message}`);
        }
      }

      console.log("\n" + "=".repeat(70));
      console.log("✅ SCAN COMPLETE");
      console.log("=".repeat(70));
      
      const avgScore = pageAnalyses
        .filter(p => p.aiAnalysis)
        .reduce((sum, p) => sum + (p.aiAnalysis.pageScore || 0), 0) / 
        (pageAnalyses.filter(p => p.aiAnalysis).length || 1);
      
      console.log(`📊 Average Score: ${avgScore.toFixed(1)}/100`);
      console.log(`📄 Pages Analyzed: ${pageAnalyses.filter(p => p.aiAnalysis).length}/${crawlResult.totalPages}\n`);

      return res.json({
        success: true,
        scanType: "multi-page-ai",
        url,
        timestamp: new Date().toISOString(),
        summary: {
          totalPages: crawlResult.totalPages,
          analyzedPages: pageAnalyses.filter(p => p.aiAnalysis).length,
          averageScore: Math.round(avgScore),
          quotaExceeded
        },
        pages: pageAnalyses,
        siteWide: siteWideAnalysis
      });

    } else {
      // ==========================================
      // SINGLE PAGE: Scan + AI Analysis
      // ==========================================
      
      console.log("Step 1: Collecting data...");
      const pageData = await puppeteerScan(url);
      
      console.log("✅ Data collected\n");
      console.log("Step 2: AI analysis...\n");
      console.log("=".repeat(70));
      
      const analysis = await analyzeWithAI(pageData);
      
      console.log("\n" + "=".repeat(70));
      console.log("✅ ANALYSIS COMPLETE");
      console.log("=".repeat(70));
      console.log(`📊 Page Score: ${analysis.pageScore}/100\n`);

      return res.json({
        success: true,
        scanType: "single-page-ai",
        url,
        timestamp: new Date().toISOString(),
        analysis
      });
    }

  } catch (error) {
    console.error("\n❌ SCAN FAILED:", error.message);
    
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};