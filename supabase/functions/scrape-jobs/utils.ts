export const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SCRAPER] ${step}${detailsStr}`);
};

const DESCRIPTION_MAX_LENGTH = 50000;

const decodeHtmlEntities = (value: string): string => {
  const entities: Record<string, string> = {
    amp: '&',
    apos: "'",
    gt: '>',
    lt: '<',
    nbsp: ' ',
    quot: '"',
  };

  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) =>
      String.fromCharCode(parseInt(code, 16)),
    )
    .replace(/&([a-z]+);/gi, (match, entity) => entities[entity] ?? match);
};

const escapeAttribute = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const allowedDescriptionTags = new Set([
  'a',
  'blockquote',
  'br',
  'code',
  'em',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'li',
  'ol',
  'p',
  'pre',
  'strong',
  'ul',
]);

const normalizeTagName = (tagName: string): string => {
  if (tagName === 'b') return 'strong';
  if (tagName === 'i') return 'em';
  return tagName;
};

const looksLikeStrippedHtml = (value: string): boolean => {
  if (/<\/?[a-z][\s\S]*>/i.test(value)) return false;

  return /(?:^|[\s>])(?:p|ul|ol|li|h[1-6]|strong|b)(?=(?:\/?[a-z]|[A-Z0-9#]))|\/(?:p|ul|ol|li|h[1-6]|strong|b)(?=$|\s|[a-z<])|(?:div|span)\s+(?:class|id|style|data-[\w-]+)=|(?:pstrong|pb|pbr|brp|pulli|lili|libr|ulp|ulbr|divspan|spanstrong|\/spanspan|\/divdiv)/i.test(
    value,
  );
};

const strippedHtmlTagNames = [
  'blockquote',
  'strong',
  'span',
  'div',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'li',
  'br',
  'p',
  'b',
];

const restoredBlockTags = new Set([
  'blockquote',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ol',
  'p',
  'ul',
]);

const restoredInlineTags = new Set(['strong']);

type StrippedTagMatch = {
  length: number;
  tagName: string;
};

const normalizeRestoredTagName = (tagName: string): string => {
  if (tagName === 'b') return 'strong';
  if (tagName === 'div') return 'p';
  if (tagName === 'span') return '';
  return tagName;
};

const startsWithTagToken = (
  value: string,
  index: number,
  tagName: string,
): boolean => value.startsWith(tagName, index);

const isAlphaNumeric = (char: string | undefined): boolean =>
  Boolean(char && /[A-Za-z0-9]/.test(char));

const isLikelyRestoredTextStart = (char: string | undefined): boolean =>
  Boolean(char && /[A-Z0-9#&$('"(\[]/.test(char));

const isTagBoundaryBefore = (value: string, index: number): boolean =>
  index === 0 || !isAlphaNumeric(value[index - 1]);

const rawStrippedTagAt = (
  value: string,
  index: number,
): string | null =>
  strippedHtmlTagNames.find((tagName) =>
    startsWithTagToken(value, index, tagName),
  ) || null;

const knownStrippedTagStartsAt = (value: string, index: number): boolean =>
  Boolean(rawStrippedTagAt(value, index)) || value.startsWith('a href=', index);

const hasNearbyClosingTag = (
  value: string,
  index: number,
  tagName: string,
  maxDistance = 220,
): boolean => {
  const closingPattern = tagName === 'strong' ? '(?:strong|b)' : tagName;
  const tagPattern = strippedHtmlTagNames.join('|');
  const slice = value.slice(index, index + maxDistance);
  return new RegExp(`\\/${closingPattern}(?=$|\\s|${tagPattern})`).test(slice);
};

const readClosingStrippedTag = (
  value: string,
  index: number,
  stack: string[],
): StrippedTagMatch | null => {
  if (value[index] !== '/') return null;

  for (const rawTagName of strippedHtmlTagNames) {
    if (!startsWithTagToken(value, index + 1, rawTagName)) continue;

    const end = index + rawTagName.length + 1;
    const tagName = normalizeRestoredTagName(rawTagName);
    const hasOpenTag = Boolean(tagName && stack.includes(tagName));
    const next = value[end];

    if (
      !hasOpenTag &&
      end < value.length &&
      isAlphaNumeric(next) &&
      !knownStrippedTagStartsAt(value, end)
    ) {
      continue;
    }

    if (
      hasOpenTag ||
      end === value.length ||
      /[\s/<]/.test(next || '') ||
      knownStrippedTagStartsAt(value, end)
    ) {
      return { length: rawTagName.length + 1, tagName };
    }
  }

  return null;
};

const readAttributeStrippedTag = (
  value: string,
  index: number,
  afterTag: boolean,
): StrippedTagMatch | null => {
  if (!afterTag && !isTagBoundaryBefore(value, index)) return null;

  const match =
    /^(div|span|p|ul|ol|li|h[1-6])\s+(?:(?:class|id|style|data-[\w-]+)=(?:"[^"]*"|'[^']*'|[^\s]+)\s*)+/i.exec(
      value.slice(index),
    );

  if (!match) return null;

  return {
    length: match[0].length,
    tagName: normalizeRestoredTagName(match[1].toLowerCase()),
  };
};

const readOpeningStrippedTag = (
  value: string,
  index: number,
  afterTag: boolean,
  stack: string[],
): StrippedTagMatch | null => {
  const attributeTag = readAttributeStrippedTag(value, index, afterTag);
  if (attributeTag) return attributeTag;

  if (!afterTag && !isTagBoundaryBefore(value, index)) return null;

  const insideStrong = stack.includes('strong');

  for (const rawTagName of strippedHtmlTagNames) {
    if (!startsWithTagToken(value, index, rawTagName)) continue;

    const end = index + rawTagName.length;
    const tagName = normalizeRestoredTagName(rawTagName);
    const next = value[end];
    const nextIsKnownTag = knownStrippedTagStartsAt(value, end);

    if (insideStrong && tagName !== 'br') return null;

    if (rawTagName === 'br') {
      if (
        end === value.length ||
        /[\s/<]/.test(next || '') ||
        nextIsKnownTag ||
        isLikelyRestoredTextStart(next)
      ) {
        return { length: rawTagName.length, tagName: 'br' };
      }
      return null;
    }

    if (rawTagName === 'ul' || rawTagName === 'ol') {
      if (
        end === value.length ||
        /[\s/<]/.test(next || '') ||
        nextIsKnownTag
      ) {
        return { length: rawTagName.length, tagName };
      }
      return null;
    }

    if (rawTagName === 'p') {
      if (
        end === value.length ||
        /[\s/<]/.test(next || '') ||
        next === '/' ||
        nextIsKnownTag ||
        isLikelyRestoredTextStart(next)
      ) {
        return { length: rawTagName.length, tagName };
      }
      return null;
    }

    if (rawTagName === 'b') {
      if (
        end === value.length ||
        /[\s/<]/.test(next || '') ||
        nextIsKnownTag ||
        isLikelyRestoredTextStart(next) ||
        hasNearbyClosingTag(value, index, 'strong')
      ) {
        return { length: rawTagName.length, tagName: 'strong' };
      }
      return null;
    }

    if (rawTagName === 'li') {
      if (
        end === value.length ||
        /[\s/<]/.test(next || '') ||
        nextIsKnownTag ||
        isLikelyRestoredTextStart(next) ||
        afterTag
      ) {
        return { length: rawTagName.length, tagName };
      }
      return null;
    }

    if (rawTagName === 'strong') {
      if (
        end === value.length ||
        /[\s/<]/.test(next || '') ||
        nextIsKnownTag ||
        isLikelyRestoredTextStart(next) ||
        hasNearbyClosingTag(value, index, 'strong')
      ) {
        return { length: rawTagName.length, tagName: 'strong' };
      }
      return null;
    }

    if (rawTagName === 'span' || rawTagName === 'div') {
      if (
        end === value.length ||
        /[\s/<]/.test(next || '') ||
        nextIsKnownTag ||
        isLikelyRestoredTextStart(next) ||
        afterTag
      ) {
        return { length: rawTagName.length, tagName };
      }
      return null;
    }

    if (/^h[1-6]$/.test(rawTagName) || rawTagName === 'blockquote') {
      if (
        end === value.length ||
        /[\s/<]/.test(next || '') ||
        nextIsKnownTag ||
        isLikelyRestoredTextStart(next)
      ) {
        return { length: rawTagName.length, tagName };
      }
    }
  }

  return null;
};

const appendClosingTag = (
  output: string[],
  stack: string[],
  tagName: string,
): void => {
  if (!tagName) return;

  if (tagName !== 'strong') {
    while (restoredInlineTags.has(stack[stack.length - 1])) {
      output.push(`</${stack.pop()}>`);
    }
  }

  const index = stack.lastIndexOf(tagName);
  if (index === -1) return;

  while (stack.length > index) {
    output.push(`</${stack.pop()}>`);
  }
};

const appendOpeningTag = (
  output: string[],
  stack: string[],
  tagName: string,
): void => {
  if (!tagName) return;
  if (tagName === 'br') {
    output.push('<br>');
    return;
  }

  if (tagName === 'li') {
    if (stack[stack.length - 1] === 'p') appendClosingTag(output, stack, 'p');
    if (stack[stack.length - 1] === 'li') appendClosingTag(output, stack, 'li');
    if (!stack.includes('ul') && !stack.includes('ol')) {
      output.push('<ul>');
      stack.push('ul');
    }
  } else if (restoredBlockTags.has(tagName) && stack[stack.length - 1] === 'p') {
    appendClosingTag(output, stack, 'p');
  }

  output.push(`<${tagName}>`);
  stack.push(tagName);
};

const restoreStrippedHtml = (value: string): string => {
  if (!looksLikeStrippedHtml(value)) return value;

  const input = value.replace(
    /^\s*img\s+src=(?:"[^"]*"|'[^']*'|[^\s]+)\s*\/?\s*$/gim,
    '',
  );
  const output: string[] = [];
  const stack: string[] = [];
  let afterTag = true;

  for (let index = 0; index < input.length;) {
    const closingTag = readClosingStrippedTag(input, index, stack);
    if (closingTag) {
      appendClosingTag(output, stack, closingTag.tagName);
      index += closingTag.length;
      afterTag = true;
      continue;
    }

    const openingTag = readOpeningStrippedTag(input, index, afterTag, stack);
    if (openingTag) {
      appendOpeningTag(output, stack, openingTag.tagName);
      index += openingTag.length;
      afterTag = true;
      continue;
    }

    output.push(input[index]);
    afterTag = false;
    index += 1;
  }

  while (restoredInlineTags.has(stack[stack.length - 1])) {
    output.push(`</${stack.pop()}>`);
  }
  while (stack.length) {
    output.push(`</${stack.pop()}>`);
  }

  return output
    .join('')
    .replace(
      /\ba\s+href=(?:"([^"]*)"|'([^']*)'|([^\s]+))([^<\n]*?)\/a\b/g,
      (_match, doubleQuoted, singleQuoted, unquoted, label) => {
        const href = doubleQuoted || singleQuoted || unquoted || '';
        const text = label?.trim() || href;
        return `<a href="${escapeAttribute(href)}">${text}</a>`;
      },
    )
    .replace(/:\/(<\/strong>)/g, ':$1')
    .replace(/<(ul|ol)>\s*(?:<br>\s*)+/g, '<$1>')
    .replace(/(?:<br>\s*)+<\/(ul|ol)>/g, '</$1>')
    .replace(/<\/li>\s*<br>\s*<li>/g, '</li><li>')
    .replace(/<p>\s*(?:<br>\s*)+/g, '<p>')
    .replace(/<strong>\s*<\/strong>/g, '')
    .replace(/<p>\s*<\/p>/g, '')
    .replace(/<p>\s*<br>\s*<\/p>/g, '')
    .replace(/<p>\s*&nbsp;\s*<\/p>/g, '')
    .replace(/\s+(class|id|style|data-[\w-]+)=(?:"[^"]*"|'[^']*'|[^\s]+)/g, '')
    .replace(/\berse perspectives\b/g, 'diverse perspectives')
    .replace(/\bing new solutions\b/g, 'bring new solutions')
    .replace(/\bequirements definition\b/g, 'requirements definition')
    .replace(/\beak new ground\b/g, 'break new ground')
    .replace(/\bokerages\b/g, 'brokerages')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

export const sanitizeUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  try {
    const parsedUrl = new URL(String(url));
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return '';
    }
    return String(url);
  } catch {
    return '';
  }
};

const sanitizeDescriptionTag = (tag: string): string => {
  const match = /^<\s*(\/?)\s*([a-z0-9]+)([^>]*)\/?\s*>$/i.exec(tag);
  if (!match) return '';

  const closing = Boolean(match[1]);
  const tagName = normalizeTagName(match[2].toLowerCase());
  const attributes = match[3] || '';

  if (!allowedDescriptionTags.has(tagName)) return '';
  if (tagName === 'br') return '<br>';
  if (closing) return `</${tagName}>`;

  if (tagName === 'a') {
    const hrefMatch = /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(
      attributes,
    );
    const href = sanitizeUrl(
      decodeHtmlEntities(hrefMatch?.[1] || hrefMatch?.[2] || hrefMatch?.[3] || ''),
    );
    if (!href) return '<a>';
    return `<a href="${escapeAttribute(href)}" target="_blank" rel="noopener noreferrer">`;
  }

  return `<${tagName}>`;
};

export const sanitizeDescriptionHtml = (
  text: string | null | undefined,
  maxLength: number = DESCRIPTION_MAX_LENGTH,
): string | null => {
  if (!text) return null;

  let sanitized = restoreStrippedHtml(decodeHtmlEntities(String(text)));

  sanitized = sanitized
    .replace(/\r\n?/g, '\n')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style|iframe|object|embed|svg|canvas)\b[\s\S]*?<\/\1>/gi, '')
    .replace(/<img\b[^>]*>/gi, '')
    .replace(/<\s*(\/?)\s*(div|section|article)\b[^>]*>/gi, '<$1p>')
    .replace(/<[^>]+>/g, sanitizeDescriptionTag)
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/<p>\s*<\/p>/gi, '')
    .trim();

  return sanitized.substring(0, maxLength) || null;
};

export const cleanHTML = (
  text: string | null | undefined,
  maxLength: number = 5000,
): string | null => {
  if (!text) return null;

  let sanitized = sanitizeDescriptionHtml(text, Math.max(maxLength * 2, 1000)) || '';

  sanitized = sanitized.replace(/<\/h[1-6]>/gi, '\n\n');
  sanitized = sanitized.replace(/<h[1-6][^>]*>/gi, '\n\n');
  sanitized = sanitized.replace(/<\/p>/gi, '\n\n');
  sanitized = sanitized.replace(/<br\s*\/?>/gi, '\n');
  sanitized = sanitized.replace(/<\/li>/gi, '\n');
  sanitized = sanitized.replace(/<li[^>]*>/gi, '- ');
  sanitized = sanitized.replace(/<\/?(div|span|section|ul|ol)[^>]*>/gi, '');
  sanitized = sanitized.replace(/\b\w+="[^"]*"/g, '');
  sanitized = sanitized.replace(/<[^>]*>/g, '');
  sanitized = decodeHtmlEntities(sanitized);
  sanitized = sanitized.replace(/https?:\/{1,}/g, 'https://');
  sanitized = sanitized.replace(/https:\s+/g, 'https://');
  sanitized = sanitized.replace(/http:\s+/g, 'http://');
  sanitized = sanitized
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();

  return sanitized.substring(0, maxLength) || null;
};

export const sanitizeText = (
  text: string | null | undefined,
  maxLength: number = 5000,
): string | null => {
  return cleanHTML(text, maxLength);
};
