import puppeteer from "puppeteer";

export const puppeteerScan = async (url) => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(url, {
    waitUntil: "networkidle2",
    timeout: 60000,
  });

  const result = await page.evaluate(() => {
    return {
      title: document.title,
      headings: Array.from(document.querySelectorAll("h1, h2, h3")).map(
        el => el.innerText
      ),
      linksCount: document.querySelectorAll("a").length,
      buttons: Array.from(document.querySelectorAll("button")).map(
        btn => btn.innerText
      ),
      images: Array.from(document.querySelectorAll("img")).map(img => ({
        src: img.src,
        alt: img.alt,
      })),
    };
  });

  await browser.close();
  return result;
};
