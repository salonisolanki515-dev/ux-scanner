import puppeteer from "puppeteer";

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ✅ SINGLE PAGE SCAN
export const puppeteerScan = async (url) => {
  let browser;
  
  try {
    console.log(`🌐 Launching browser for: ${url}`);
    
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920x1080'
      ]
    });

    const page = await browser.newPage();

    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const resourceType = req.resourceType();
      if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    await page.setViewport({ width: 1920, height: 1080 });

    console.log(`📍 Navigating to: ${url}`);

    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 20000,
    });

    console.log('✅ Page loaded, extracting data...');

    await delay(2000);

    const scanData = await page.evaluate(() => {
      return {
        url: window.location.href,
        title: document.title || "No title",

        headings: Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, h6"))
          .map(h => ({
            level: h.tagName.toLowerCase(),
            text: h.innerText.trim()
          }))
          .filter(h => h.text.length > 0),

        headingTexts: Array.from(document.querySelectorAll("h1, h2, h3"))
          .map(h => h.innerText.trim())
          .filter(Boolean),

        buttons: Array.from(document.querySelectorAll("button, a[role='button'], input[type='button'], input[type='submit']"))
          .map(b => b.innerText.trim() || b.value || b.getAttribute('aria-label') || '')
          .filter(text => text.length > 0),

        linksCount: document.querySelectorAll("a[href]").length,
        
        internalLinks: Array.from(document.querySelectorAll("a[href]"))
          .map(a => a.href)
          .filter(href => {
            try {
              const url = new URL(href);
              const currentUrl = new URL(window.location.href);
              return url.hostname === currentUrl.hostname && 
                     !href.includes('#') && 
                     !href.includes('mailto:') &&
                     !href.includes('tel:');
            } catch {
              return false;
            }
          }),

        images: Array.from(document.querySelectorAll("img")).map(img => ({
          src: img.src || img.getAttribute('data-src') || '',
          alt: img.alt || "",
          width: img.width,
          height: img.height
        })),

        meta: {
          description: document.querySelector('meta[name="description"]')?.content || "",
          keywords: document.querySelector('meta[name="keywords"]')?.content || "",
          viewport: document.querySelector('meta[name="viewport"]')?.content || "",
          hasH1: document.querySelectorAll("h1").length > 0,
          h1Count: document.querySelectorAll("h1").length,
          charset: document.characterSet || "",
          lang: document.documentElement.lang || ""
        },

        structure: {
          hasHeader: !!document.querySelector('header'),
          hasNav: !!document.querySelector('nav'),
          hasMain: !!document.querySelector('main'),
          hasFooter: !!document.querySelector('footer'),
          formCount: document.querySelectorAll('form').length
        }
      };
    });

    console.log('✅ Data extracted successfully');
    
    await browser.close();
    return scanData;

  } catch (error) {
    console.error('❌ Puppeteer scan failed:', error.message);
    
    if (browser) {
      await browser.close();
    }

    throw new Error(`Failed to scan website: ${error.message}`);
  }
};

// ✅ MULTI-PAGE CRAWLER
export const crawlWebsite = async (startUrl, options = {}) => {
  const {
    maxPages = 5,
    maxDepth = 2,
  } = options;

  const visited = new Set();
  const toVisit = [{ url: startUrl, depth: 0 }];
  const results = [];
  let browser;

  try {
    console.log('\n========================================');
    console.log('🕷️  MULTI-PAGE CRAWL STARTED');
    console.log('========================================');
    console.log(`📍 Starting URL: ${startUrl}`);
    console.log(`📊 Max Pages: ${maxPages}`);
    console.log(`📏 Max Depth: ${maxDepth}`);
    console.log('========================================\n');

    browser = await puppeteer.launch({
      headless: "new",
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();

    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const resourceType = req.resourceType();
      if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    );

    let pageNumber = 0;

    while (toVisit.length > 0 && results.length < maxPages) {
      const { url, depth } = toVisit.shift();

      if (visited.has(url) || depth > maxDepth) {
        continue;
      }

      visited.add(url);
      pageNumber++;

      console.log(`\n🔍 [${pageNumber}/${maxPages}] SCANNING PAGE`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📄 URL: ${url}`);
      console.log(`📏 Depth: ${depth}`);
      console.log(`⏳ Loading page...`);

      try {
        await page.goto(url, {
          waitUntil: 'domcontentloaded',
          timeout: 15000,
        });

        await delay(1500);

        const pageData = await page.evaluate(() => {
          return {
            url: window.location.href,
            title: document.title || "No title",
            
            headings: Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, h6"))
              .map(h => ({
                level: h.tagName.toLowerCase(),
                text: h.innerText.trim()
              }))
              .filter(h => h.text.length > 0),
            
            headingTexts: Array.from(document.querySelectorAll("h1, h2, h3"))
              .map(h => h.innerText.trim())
              .filter(Boolean),
            
            buttons: Array.from(document.querySelectorAll("button, a[role='button'], input[type='button'], input[type='submit']"))
              .map(b => b.innerText.trim() || b.value || b.getAttribute('aria-label') || '')
              .filter(text => text.length > 0),
            
            linksCount: document.querySelectorAll("a[href]").length,
            
            internalLinks: Array.from(document.querySelectorAll("a[href]"))
              .map(a => a.href)
              .filter(href => {
                try {
                  const linkUrl = new URL(href);
                  const currentUrl = new URL(window.location.href);
                  return linkUrl.hostname === currentUrl.hostname && 
                         !href.includes('#') && 
                         !href.includes('mailto:') &&
                         !href.includes('tel:');
                } catch {
                  return false;
                }
              }),
            
            images: Array.from(document.querySelectorAll("img")).map(img => ({
              src: img.src || img.getAttribute('data-src') || '',
              alt: img.alt || "",
              width: img.width,
              height: img.height
            })),
            
            meta: {
              description: document.querySelector('meta[name="description"]')?.content || "",
              keywords: document.querySelector('meta[name="keywords"]')?.content || "",
              viewport: document.querySelector('meta[name="viewport"]')?.content || "",
              hasH1: document.querySelectorAll("h1").length > 0,
              h1Count: document.querySelectorAll("h1").length,
              charset: document.characterSet || "",
              lang: document.documentElement.lang || ""
            },
            
            structure: {
              hasHeader: !!document.querySelector('header'),
              hasNav: !!document.querySelector('nav'),
              hasMain: !!document.querySelector('main'),
              hasFooter: !!document.querySelector('footer'),
              formCount: document.querySelectorAll('form').length
            }
          };
        });

        console.log(`✅ Page loaded successfully`);
        console.log(`📝 Title: "${pageData.title}"`);
        console.log(`🔤 Headings: ${pageData.headings.length}`);
        console.log(`🔗 Links found: ${pageData.linksCount}`);

        results.push(pageData);

        // Add new links to crawl
        if (depth < maxDepth) {
          const newLinks = pageData.internalLinks
            .filter(link => !visited.has(link) && !toVisit.some(item => item.url === link))
            .slice(0, 10);

          if (newLinks.length > 0) {
            console.log(`🔗 Found ${newLinks.length} new links to crawl`);
            newLinks.forEach(link => {
              toVisit.push({ url: link, depth: depth + 1 });
            });
          }
        }

      } catch (error) {
        console.warn(`❌ Failed to scan ${url}: ${error.message}`);
      }

      await delay(1000);
    }

    await browser.close();
    
    console.log(`\n========================================`);
    console.log(`✅ CRAWL COMPLETE`);
    console.log(`========================================`);
    console.log(`📊 Total pages scanned: ${results.length}`);
    console.log(`========================================\n`);
    
    return {
      pages: results,
      totalPages: results.length,
      startUrl
    };

  } catch (error) {
    if (browser) await browser.close();
    console.error('❌ Crawl failed:', error);
    throw new Error(`Crawl failed: ${error.message}`);
  }
};