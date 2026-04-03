import { useEffect, useState } from "react";

interface CleanTextProps {
  html: string;
}

const CleanText = ({ html }: CleanTextProps) => {
  const [cleanText, setCleanText] = useState("");

  useEffect(() => {
    if (!html) {
      setCleanText("");
      return;
    }

    let text = html;

    // ✅ Extract links FIRST (before anything else)
    text = text.replace(/<a[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gi, "$1");
    // ✅ FIX href="url"url duplication
    text = text.replace(/href="([^"]+)"\s*\1/gi, "$1");
    // ✅ FIX leftover href="..."
    text = text.replace(/href="([^"]+)"/gi, "$1");
    // ✅ Remove leftover "a" wrappers completely
    text = text.replace(/\ba\s*(https?:\/\/[^\s]+)\s*a\b/gi, "$1");
    // ✅ Remove duplicated URLs
    text = text.replace(/(https?:\/\/[^\s]+)\s+\1/g, "$1");
    // ✅ Remove leftover "a" wrappers completely
    text = text.replace(/\ba\s*(https?:\/\/[^\s]+)\s*a\b/gi, "$1");
    // ✅ Remove duplicated URLs
    text = text.replace(/(https?:\/\/[^\s]+)\s+\1/g, "$1");
    // ✅ Remove leftover "a" wrappers
    text = text.replace(/\ba\s+(https?:\/\/[^\s]+)\s*a\b/gi, "$1");
    // ✅ 1. REMOVE IMAGES
    text = text.replace(/<img[^>]*>/gi, "");
    text = text.replace(/img\s+src="[^"]*"\s*\/?/gi, "");
    // ✅ 2. FIX URLS (DO NOT TOUCH AFTER THIS)
    text = text.replace(/https?:\s+/g, "https://");
    text = text.replace(/https:\/(?!\/)/g, "https://");
    // ✅ 3. FIX MERGED WORDS
    text = text.replace(/([a-z])([A-Z])/g, "$1 $2");
    // ✅ 4. FIX HEADERS
    text = text.replace(/h[1-6]\s*([^/]+)\s*\/h[1-6]/gi, "\n\n## $1\n\n");
    text = text.replace(/p?h[1-6]\s*([^/]+?)\s*\/\/?h[1-6]/gi, "\n\n## $1\n\n");
    // ✅ STRUCTURE
    text = text.replace(/<\/p>/gi, "\n\n");
    text = text.replace(/<br\s*\/?>/gi, "\n");
    text = text.replace(/<\/li>/gi, "\n");
    text = text.replace(/<li[^>]*>/gi, "• ");
    text = text.replace(/<\/h[1-6]>/gi, "\n\n");
    // ✅ HANDLE TAGS BEFORE REMOVAL
    text = text.replace(/<h[1-6][^>]*>/gi, "\n\n## ");
    text = text.replace(/<strong[^>]*>/gi, "**");
    text = text.replace(/<\/strong>/gi, "**");
    // ✅ REMOVE ATTRIBUTES (IMPORTANT)
    text = text.replace(/\b(class|style|id)="[^"]*"/gi, "");
    // ✅ DECODE HTML
    text = text
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">");
    text = text.replace(/br\s*strong/gi, "\n");
    // ✅ Fix broken tag words like hr, brstrong
    text = text.replace(/\bhr\b/gi, "\n\n");
    text = text.replace(/\bbr\b/gi, "\n");
    text = text.replace(/\bbrstrong\b/gi, "\n");
    // ✅ ONLY fix real broken "liWord" (not inside URLs)
    text = text.replace(/(^|\n)\s*li\s*([A-Z])/g, "\n• $2");
    // ✅ Clean slash garbage but keep URLs safe
    text = text.replace(/(^|\s)\/+/g, "\n");
    text = text.replace(/\/{2,}/g, "\n");
    // ✅ FIX leftover "/" blocks like / or /// between sentences
    text = text.replace(/\n?\s*\/{1,3}\s*\n?/g, "\n\n");
    // ✅ Fix words stuck to "strong"
    text = text.replace(/\bstrong(?=[a-z0-9])/gi, "");
    // ✅ FIX broken list words like ulli, lili
    text = text.replace(/\b(u?l+li)(?=\d|\s)/gi, "\n• ");
    // ✅ FIX common broken words (safe corrections)
    text = text.replace(/\bshiing\b/gi, "shipping");
    text = text.replace(/\buntaed\b/gi, "untapped");
    text = text.replace(/\boortunities\b/gi, "opportunities");
    text = text.replace(/\bsuort\b/gi, "support");
    // ✅ Remove weird repeated fragments like "divdiv", "lilip"
    text = text.replace(/(div|li|p|span|h[1-6]){2,}/gi, "");
    // ✅ Fix common broken words
    text = text.replace(/\bve Kit\b/gi, "LiveKit");
    text = text.replace(/\bnked In\b/gi, "LinkedIn");
    text = text.replace(/\bava Script\b/gi, "JavaScript");
    // ✅ Remove duplicate bullets
    text = text.replace(/(\n•\s*){2,}/g, "\n• ");
    // ✅ FIX: Keep label + URL on same line (URL + To apply)
    text = text.replace(
      /\b(URL|Website|To apply):\s*\n+\s*(https?:\/\/[^\s]+)/gi,
      "$1: $2",
    );
    // ✅ Fix broken URLs spacing
    text = text.replace(/https?:\s*\n\s*/g, "https://");
    text = text.replace(/https?:\s+/g, "https://");
    // ✅ FIX: Keep label + URL on same line (URL + To apply)
    text = text.replace(
      /\b(URL|Website|To apply):\s*\n+\s*(https?:\/\/[^\s]+)/gi,
      "$1: $2",
    );
    // ✅ FIX &nbsp (both correct and broken)
    text = text.replace(/&nbsp;/gi, " ");
    // ✅ FIX "/a" ONLY at end of URLs
    text = text.replace(/(https?:\/\/[^\s]+)\/a\b/gi, "$1");
    // ✅ CLEAN "pa title=..." safely
    text = text.replace(/pa\s+title="[^"]*"\s*(https?:\/\/[^\s]+)/gi, "$1");
    // ✅ FIX "Apply" / "To apply"
    text = text.replace(/\bTo aly\b/gi, "To apply");
    text = text.replace(/\baly\b/gi, "apply");
    // Fix "pa title=..." → just keep URL
    text = text.replace(/pa\s+title="[^"]*"\s*(https?:\/\/[^\s]+)/gi, "$1");
    // Clean "To apply:/" → proper format
    text = text.replace(/To apply:\s*\//gi, "\nTo apply:\n");
    // ✅ Fix "To aly"
    text = text.replace(/\bTo aly\b/gi, "To apply");
    // ✅ Fix "To apply:/"
    text = text.replace(/To apply:\s*\//gi, "\nTo apply:\n");
    // ✅ Remove random single #
    text = text.replace(/(^|\n)[#]+(?!#)/g, "\n");
    // ✅ Remove trailing "/" at end of lines (safe for URLs)
    text = text.replace(/([^\s])\/(\s|\n)/g, "$1$2");
    // ✅ Remove leftover "di" at end
    text = text.replace(/\bdi\b$/gi, "");
    // ✅ FINAL CLEAN
    text = text
      .replace(/[ \t]+/g, " ")
      .replace(/\n{1,}/g, "\n")
      .trim();
    // ✅ Clean stray #
    text = text.replace(/(^|\n)#(?!#)/g, "\n");
    // ✅ Remove trailing slashes at end of lines (but keep URLs safe)
    text = text.replace(/([^\n])\/(\s|\n)/g, "$1$2");
    // ✅ Fix broken commas on new lines
    text = text.replace(/\n\s*,/g, ",");
    // ✅ Remove trailing broken attribute garbage
    text = text.replace(/class=\S+.*$/gi, "");

    // ✅ Fix bullet spacing
    text = text.replace(/\n?•\s*/g, "\n• ");
    // ✅ Remove leftover class fragments completely
    text = text.replace(/class="[^"]*"/gi, "");
    // formatting (LAST LAST)
    text = text.replace(/\n\s*\n\s*\n+/g, "\n\n");
    // ✅ Fix UX/UI broken lines
    text = text.replace(/\bUX\s*\n\s*UI\b/gi, "UX/UI");
    // ✅ Remove duplicated URLs like: url url
    text = text.replace(/(https?:\/\/[^\s]+)\s+\1/g, "$1");
    // ✅ Ensure section titles have spacing
    text = text.replace(
      /\n?(Job description|Job requirements|Key Responsibilities|Requirements|Benefits)\n?/gi,
      "\n\n## $1\n\n",
    );
    text = text.replace(/\n\s*•\s*/g, "\n• ");
    // ✅ REMOVE ALL HTML TAGS (MUST be near end)
    text = text.replace(/<[^>]*>/g, "");
    // ✅ SMART FIX: only fix vertical broken words (safe)
    text = text.replace(/(\b\w+\b)(\n\s*\b\w+\b){3,}/g, (match) => {
      return match.replace(/\n\s*/g, " ");
    });
    // fix double spaces created
    text = text.replace(/\s{2,}/g, " ");
    // ✅ CRITICAL FIX: normalize ALL line breaks first
    text = text.replace(/\r\n/g, "\n");

    // ✅ collapse multiple spaces/newlines early
    text = text.replace(/[ \t]+/g, " ");
    text = text.replace(/\n{2,}/g, "\n");

    // ✅ FIX: join broken words/lines safely (MAIN FIX)
    text = text.replace(/(\w)\n(\w)/g, "$1 $2");
    // ✅ REMOVE LEFTOVER TAG WORDS (FIX ulli, lili, etc.)
    text = text.replace(
      /\b(div|p|li|ul|span|section|em|strong|br|h[1-6])+\b/gi,
      "",
    );
    // ✅ Remove garbage words globally (VERY IMPORTANT)
    text = text.replace(
      /\b(pa|pt|ol|a|abr|abra|brbr|abrbr|spanbrb|bspan|span|spa|brb|ulb|b)\b/gi,
      "",
    );
    // ✅ Fix broken "pstrong", "divstrong", etc.
    text = text.replace(/\b(p|div|span|ul|li)?\s*strong\b/gi, "");
    // ✅ Convert common section titles to bold headers
    text = text.replace(
      /\n?(What You'll Do|What You'll Bring|Responsibilities|Requirements|Benefits|Ideal Candidate Profile)\n?/gi,
      "\n\n## $1\n",
    );

    // ✅ Convert titles EXCEPT URL / To apply  Convert "Title:" into bold section
    text = text.replace(
      /\n?\s*(?!URL|Website|To apply)([A-Z][A-Za-z\s&/]{2,30})\s*:\s*\n?/g,
      "\n\n## $1\n",
    );

    // ✅ HARD FINAL CLEAN (this fixes 80% of your UI damage)
    text = text
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/\b(work|weworkremotely)\s*\n\s*(work|weworkremotely)\b/gi, "")
      .replace(/\n\s*,/g, ",")
      .trim();
    // ✅ Fix tech words spacing
    text = text.replace(/\b(HTML|CSS|SQL|API)\s+(?=[A-Z])/g, "$1, ");

    // ✅ REMOVE leftover symbols garbage
    text = text.replace(/[#:; . -]+(?=\s|$)/g, "");

    // ✅ FINAL FIX: force URL + link in one line (LAST step)
    text = text.replace(
      /\b(URL|Website|To apply)\s*\n+\s*(https?:\/\/[^\s]+)/gi,
      "$1: $2",
    );

    // ✅ Add period to normal sentences (SAFE)
    text = text.replace(/([a-zA-Z0-9)])\n/g, (match, p1) => {
      // skip if already proper punctuation
      if (/[.!?:]$/.test(p1)) return match;

      return p1 + ".\n";
    });

    setCleanText(text || "No description available");
  }, [html]);

  return (
    <div className="whitespace-pre-line leading-relaxed text-gray-200 text-sm">
      {cleanText.split("\n").map((line, i) => {
        const trimmed = line.trim();

        const isImportant =
          trimmed.length < 60 &&
          /^[A-Z]/.test(trimmed) &&
          !trimmed.includes("http") &&
          !trimmed.startsWith("•") &&
          !trimmed.includes(":");

        if (!trimmed) return null;

        const urlMatch = trimmed.match(/(https?:\/\/[^\s]+)/);

        if (urlMatch) {
          const url = urlMatch[0];

          return (
            <div key={i}>
              {trimmed.replace(url, "")}
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-400 underline break-all"
              >
                {url}
              </a>
            </div>
          );
        }

        if (trimmed.startsWith("##")) {
          return (
            <div key={i} className="font-bold text-white text-lg mt-6 mb-2">
              {trimmed.replace(/^##\s*/, "")}
            </div>
          );
        }

        if (isImportant) {
          return (
            <div key={i} className="font-semibold text-white mt-2">
              {trimmed}
            </div>
          );
        }

        return <div key={i}>{trimmed}</div>;
      })}
    </div>
  );
};

export default CleanText;
