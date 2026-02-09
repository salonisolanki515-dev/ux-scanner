export function analyzeUX(scanData) {
  const issues = [];

  if (!scanData.title || scanData.title.length < 10) {
    issues.push({
      issue: "Missing or too short page title",
      priority: "High",
      category: "SEO"
    });
  }

  if (scanData.title && scanData.title.length > 60) {
    issues.push({
      issue: `Page title too long (${scanData.title.length} chars)`,
      priority: "Medium",
      category: "SEO"
    });
  }

  if (!scanData.meta?.description) {
    issues.push({
      issue: "Missing meta description",
      priority: "High",
      category: "SEO"
    });
  }

  if (!scanData.meta?.viewport) {
    issues.push({
      issue: "Missing viewport meta tag",
      priority: "High",
      category: "Mobile"
    });
  }

  if (!scanData.meta?.hasH1) {
    issues.push({
      issue: "No H1 heading found",
      priority: "High",
      category: "SEO"
    });
  }

  if (!scanData.headings || scanData.headings.length === 0) {
    issues.push({
      issue: "No headings found on page",
      priority: "High",
      category: "SEO"
    });
  }

  if (scanData.images && scanData.images.length > 0) {
    const imagesWithoutAlt = scanData.images.filter(img => !img.alt || img.alt.trim() === '');
    if (imagesWithoutAlt.length > 0) {
      issues.push({
        issue: `${imagesWithoutAlt.length} of ${scanData.images.length} image(s) missing alt text`,
        priority: "High",
        category: "Accessibility"
      });
    }
  }

  if (!scanData.buttons || scanData.buttons.length === 0) {
    issues.push({
      issue: "No interactive buttons or CTAs found",
      priority: "Medium",
      category: "UX"
    });
  }

  if (!scanData.linksCount || scanData.linksCount === 0) {
    issues.push({
      issue: "No links found on page",
      priority: "Medium",
      category: "UX"
    });
  }

  if (scanData.structure) {
    if (!scanData.structure.hasMain) {
      issues.push({
        issue: "No <main> element found",
        priority: "Medium",
        category: "Accessibility"
      });
    }
  }

  if (!scanData.meta?.lang) {
    issues.push({
      issue: "Missing language attribute on <html> tag",
      priority: "Medium",
      category: "Accessibility"
    });
  }

  return issues;
}