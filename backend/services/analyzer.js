export const analyzeUX = (scanData) => {
  const issues = [];

  const { title, headings = [], buttons = [] } = scanData;

  // 1️⃣ TITLE CHECK
  if (!title || title.length < 10) {
    issues.push({
      type: "SEO",
      problem: "Page title is missing or too short",
    });
  }

  // 2️⃣ H1 CHECK
  if (headings.length === 0) {
    issues.push({
      type: "SEO / UX",
      problem: "No main heading (H1) found on the page",
    });
  }

  // 3️⃣ CTA CHECK (CORRECT LOGIC)
  const ctaKeywords = ["buy", "contact", "get", "start", "apply", "join"];
  const hasPrimaryCTA = buttons.some(btn =>
    ctaKeywords.some(keyword =>
      btn.toLowerCase().includes(keyword)
    )
  );

  if (!hasPrimaryCTA) {
    issues.push({
      type: "UX",
      problem: "No clear primary call-to-action button found",
    });
  }

  return issues;
};
