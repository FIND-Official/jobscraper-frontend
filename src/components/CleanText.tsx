import { useMemo } from "react";
import DOMPurify from "dompurify";
import { cn } from "@/lib/utils";

interface CleanTextProps {
  html?: string | null;
  maxLength?: number;
  className?: string;
}

const allowedTags = [
  "a",
  "b",
  "blockquote",
  "br",
  "code",
  "em",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "i",
  "li",
  "ol",
  "p",
  "pre",
  "strong",
  "ul",
];

const normalizeEncodingArtifacts = (value: string): string =>
  value
    .replace(/\u00e2\u20ac\u00a2/g, "\u2022")
    .replace(/\u00c2\u00b7/g, "\u2022")
    .replace(/\u00e2\u20ac[\u009d\u201d]/g, "\u2014")
    .replace(/\u00e2\u20ac[\u0093\u201c]/g, "\u2013")
    .replace(/\u00e2\u20ac[\u0099\u2122]/g, "'")
    .replace(/\u00e2\u20ac[\u009c\u0153]/g, '"');

const decodeEntities = (value: string): string => {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = value;
  return textarea.value;
};

const hasHtml = (value: string): boolean => /<\/?[a-z][\s\S]*>/i.test(value);

const looksLikeStrippedHtml = (value: string): boolean => {
  if (hasHtml(value)) return false;

  return /(?:^|[\s>])(?:p|ul|ol|li|h[1-6]|strong|b)(?=(?:\/?[a-z]|[A-Z0-9#]))|\/(?:p|ul|ol|li|h[1-6]|strong|b)(?=$|\s|[a-z<])|(?:div|span)\s+(?:class|id|style|data-[\w-]+)=|(?:pstrong|pb|pbr|brp|pulli|lili|libr|ulp|ulbr|divspan|spanstrong|\/spanspan|\/divdiv)/i.test(
    value,
  );
};

const escapeAttribute = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const strippedHtmlTagNames = [
  "blockquote",
  "strong",
  "span",
  "div",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "li",
  "br",
  "p",
  "b",
];

const restoredBlockTags = new Set([
  "blockquote",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ol",
  "p",
  "ul",
]);

const restoredInlineTags = new Set(["strong"]);

type StrippedTagMatch = {
  length: number;
  tagName: string;
};

const normalizeRestoredTagName = (tagName: string): string => {
  if (tagName === "b") return "strong";
  if (tagName === "div") return "p";
  if (tagName === "span") return "";
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
  Boolean(rawStrippedTagAt(value, index)) || value.startsWith("a href=", index);

const hasNearbyClosingTag = (
  value: string,
  index: number,
  tagName: string,
  maxDistance = 220,
): boolean => {
  const closingPattern = tagName === "strong" ? "(?:strong|b)" : tagName;
  const tagPattern = strippedHtmlTagNames.join("|");
  const slice = value.slice(index, index + maxDistance);
  return new RegExp(`\\/${closingPattern}(?=$|\\s|${tagPattern})`).test(slice);
};

const readClosingStrippedTag = (
  value: string,
  index: number,
  stack: string[],
): StrippedTagMatch | null => {
  if (value[index] !== "/") return null;

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
      /[\s/<]/.test(next || "") ||
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

  const insideStrong = stack.includes("strong");

  for (const rawTagName of strippedHtmlTagNames) {
    if (!startsWithTagToken(value, index, rawTagName)) continue;

    const end = index + rawTagName.length;
    const tagName = normalizeRestoredTagName(rawTagName);
    const next = value[end];
    const nextIsKnownTag = knownStrippedTagStartsAt(value, end);

    if (insideStrong && tagName !== "br") return null;

    if (rawTagName === "br") {
      if (
        end === value.length ||
        /[\s/<]/.test(next || "") ||
        nextIsKnownTag ||
        isLikelyRestoredTextStart(next)
      ) {
        return { length: rawTagName.length, tagName: "br" };
      }
      return null;
    }

    if (rawTagName === "ul" || rawTagName === "ol") {
      if (
        end === value.length ||
        /[\s/<]/.test(next || "") ||
        nextIsKnownTag
      ) {
        return { length: rawTagName.length, tagName };
      }
      return null;
    }

    if (rawTagName === "p") {
      if (
        end === value.length ||
        /[\s/<]/.test(next || "") ||
        next === "/" ||
        nextIsKnownTag ||
        isLikelyRestoredTextStart(next)
      ) {
        return { length: rawTagName.length, tagName };
      }
      return null;
    }

    if (rawTagName === "b") {
      if (
        end === value.length ||
        /[\s/<]/.test(next || "") ||
        nextIsKnownTag ||
        isLikelyRestoredTextStart(next) ||
        hasNearbyClosingTag(value, index, "strong")
      ) {
        return { length: rawTagName.length, tagName: "strong" };
      }
      return null;
    }

    if (rawTagName === "li") {
      if (
        end === value.length ||
        /[\s/<]/.test(next || "") ||
        nextIsKnownTag ||
        isLikelyRestoredTextStart(next) ||
        afterTag
      ) {
        return { length: rawTagName.length, tagName };
      }
      return null;
    }

    if (rawTagName === "strong") {
      if (
        end === value.length ||
        /[\s/<]/.test(next || "") ||
        nextIsKnownTag ||
        isLikelyRestoredTextStart(next) ||
        hasNearbyClosingTag(value, index, "strong")
      ) {
        return { length: rawTagName.length, tagName: "strong" };
      }
      return null;
    }

    if (rawTagName === "span" || rawTagName === "div") {
      if (
        end === value.length ||
        /[\s/<]/.test(next || "") ||
        nextIsKnownTag ||
        isLikelyRestoredTextStart(next) ||
        afterTag
      ) {
        return { length: rawTagName.length, tagName };
      }
      return null;
    }

    if (/^h[1-6]$/.test(rawTagName) || rawTagName === "blockquote") {
      if (
        end === value.length ||
        /[\s/<]/.test(next || "") ||
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

  if (tagName !== "strong") {
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
  if (tagName === "br") {
    output.push("<br>");
    return;
  }

  if (tagName === "li") {
    if (stack[stack.length - 1] === "p") appendClosingTag(output, stack, "p");
    if (stack[stack.length - 1] === "li") appendClosingTag(output, stack, "li");
    if (!stack.includes("ul") && !stack.includes("ol")) {
      output.push("<ul>");
      stack.push("ul");
    }
  } else if (restoredBlockTags.has(tagName) && stack[stack.length - 1] === "p") {
    appendClosingTag(output, stack, "p");
  }

  output.push(`<${tagName}>`);
  stack.push(tagName);
};

const restoreStrippedHtml = (value: string): string => {
  if (!looksLikeStrippedHtml(value)) return value;

  const input = value.replace(
    /^\s*img\s+src=(?:"[^"]*"|'[^']*'|[^\s]+)\s*\/?\s*$/gim,
    "",
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
    .join("")
    .replace(
      /\ba\s+href=(?:"([^"]*)"|'([^']*)'|([^\s]+))([^<\n]*?)\/a\b/g,
      (_match, doubleQuoted, singleQuoted, unquoted, label) => {
        const href = doubleQuoted || singleQuoted || unquoted || "";
        const text = label?.trim() || href;
        return `<a href="${escapeAttribute(href)}">${text}</a>`;
      },
    )
    .replace(/:\/(<\/strong>)/g, ":$1")
    .replace(/<(ul|ol)>\s*(?:<br>\s*)+/g, "<$1>")
    .replace(/(?:<br>\s*)+<\/(ul|ol)>/g, "</$1>")
    .replace(/<\/li>\s*<br>\s*<li>/g, "</li><li>")
    .replace(/<p>\s*(?:<br>\s*)+/g, "<p>")
    .replace(/<strong>\s*<\/strong>/g, "")
    .replace(/<p>\s*<\/p>/g, "")
    .replace(/<p>\s*<br>\s*<\/p>/g, "")
    .replace(/<p>\s*&nbsp;\s*<\/p>/g, "")
    .replace(/\s+(class|id|style|data-[\w-]+)=(?:"[^"]*"|'[^']*'|[^\s]+)/g, "")
    .replace(/\berse perspectives\b/g, "diverse perspectives")
    .replace(/\bing new solutions\b/g, "bring new solutions")
    .replace(/\bequirements definition\b/g, "requirements definition")
    .replace(/\beak new ground\b/g, "break new ground")
    .replace(/\bokerages\b/g, "brokerages")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

const htmlToText = (value: string): string => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(value, "text/html");
  return doc.body.textContent || "";
};

const truncate = (value: string, maxLength?: number): string => {
  const text = value.replace(/\s+/g, " ").trim();
  if (!maxLength || text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 1)).trimEnd()}...`;
};

const plainTextToHtml = (value: string): string => {
  const escaped = value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return escaped
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => {
      const lines = paragraph.split("\n").map((line) => line.trim()).filter(Boolean);
      const isList = lines.every((line) => /^([-*]|\u2022)\s+/.test(line));

      if (isList) {
        const items = lines
          .map((line) => `<li>${line.replace(/^([-*]|\u2022)\s+/, "")}</li>`)
          .join("");
        return `<ul>${items}</ul>`;
      }

      return `<p>${lines.join("<br>")}</p>`;
    })
    .join("");
};

const CleanText = ({ html, maxLength, className }: CleanTextProps) => {
  const content = useMemo(() => {
    if (!html) return "";

    const normalized = restoreStrippedHtml(
      normalizeEncodingArtifacts(decodeEntities(html)),
    );

    if (maxLength) {
      return truncate(hasHtml(normalized) ? htmlToText(normalized) : normalized, maxLength);
    }

    const sourceHtml = hasHtml(normalized) ? normalized : plainTextToHtml(normalized);

    return DOMPurify.sanitize(sourceHtml, {
      ALLOWED_ATTR: ["href", "target", "rel"],
      ALLOWED_TAGS: allowedTags,
      FORBID_ATTR: ["class", "id", "style"],
      FORBID_TAGS: ["img", "picture", "source", "script", "style"],
    });
  }, [html, maxLength]);

  if (!content) {
    return <span className={className}>No description available</span>;
  }

  if (maxLength) {
    return <span className={className}>{content}</span>;
  }

  return (
    <div
      className={cn("job-description", className)}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};

export default CleanText;
