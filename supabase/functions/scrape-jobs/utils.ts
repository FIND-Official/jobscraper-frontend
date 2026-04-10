export const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SCRAPER] ${step}${detailsStr}`);
};

export const cleanHTML = (text: string | null | undefined, maxLength: number = 5000): string | null => {
  if (!text) return null;

  let sanitized = String(text);

  sanitized = sanitized.replace(/<img[^>]*>/gi, '');
  sanitized = sanitized.replace(/<\/p>/gi, '\n\n');
  sanitized = sanitized.replace(/<br\s*\/?>/gi, '\n');
  sanitized = sanitized.replace(/<\/li>/gi, '\n');
  sanitized = sanitized.replace(/<li>/gi, '• ');
  sanitized = sanitized.replace(/<\/?(div|span|section|ul)[^>]*>/gi, '');
  sanitized = sanitized.replace(/\b\w+="[^"]*"/g, '');
  sanitized = sanitized.replace(/<[^>]*>/g, '');
  sanitized = sanitized
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
  sanitized = sanitized.replace(/https?:\/{1,}/g, 'https://');
  sanitized = sanitized.replace(/https:\s+/g, 'https://');
  sanitized = sanitized.replace(/http:\s+/g, 'http://');
  sanitized = sanitized
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();

  return sanitized.substring(0, maxLength) || null;
};

export const sanitizeText = (text: string | null | undefined, maxLength: number = 5000): string | null => {
  return cleanHTML(text, maxLength);
};

export const sanitizeUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  try {
    const parsedUrl = new URL(String(url));
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return '';
    }
    return url;
  } catch {
    return '';
  }
};
