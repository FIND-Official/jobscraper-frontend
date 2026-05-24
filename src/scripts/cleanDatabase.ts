/**
 * Kept intentionally non-destructive.
 *
 * The previous version stripped HTML from every job description, which damaged
 * We Work Remotely posts by turning source markup into visible text. Refresh
 * jobs through the scrape-jobs function instead so descriptions are rebuilt
 * from source and sanitized by the scraper.
 */
console.warn(
  "cleanDatabase is disabled. Use the scrape-jobs function to refresh job descriptions from source.",
);
