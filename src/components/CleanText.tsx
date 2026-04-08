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
    // ✅ STEP 1: Parse HTML safely (DO NOT remove your other code)
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

      // If valid HTML → replace text with clean content
      if (doc.body && doc.body.textContent) {
        text = doc.body.textContent;
      }
    } catch (e) {
      // fallback → keep original text
    }
    // Remove broken image text (plain text img src)
    text = text.replace(/img\s+src\s*=\s*"https?:\/\/[^\s"]*"/gi, "");
    // Remove "href=" but KEEP the URL
    text = text.replace(/href\s*=\s*/gi, "");

    text = text.replace(
      /\bhttps?:\/\/([a-z0-9-]+)(com|net|org)\b/gi,
      "https://$1.$2",
    );

    // Fix duplicated/broken quoted URLs like: "url""url/a
    text = text.replace(/"(https?:\/\/[^\s"]+)"?\s*"?\1[^"\s]*/gi, "$1");

    // ✅ Extract links FIRST (before anything else)
    text = text.replace(/<a[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gi, "$1");

    // ✅ FIX href="url"url duplication
    text = text.replace(/href="([^"]+)"\s*\1/gi, "$1");
    // ✅ FIX leftover href="..."
    text = text.replace(/href="([^"]+)"/gi, "$1");

    // ✅ Remove leftover "a" wrappers completely
    text = text.replace(/\ba\s*(https?:\/\/[^\s]+)\s*a\b/gi, "$1");

    // ✅ Remove leftover "a" wrappers
    text = text.replace(/\ba\s+(https?:\/\/[^\s]+)\s*a\b/gi, "$1");
    // ✅ 1. REMOVE IMAGES
    text = text.replace(/<img[^>]*>|img\s+src="[^"]*"/gi, "");
    // ✅ 2. FIX URLS (DO NOT TOUCH AFTER THIS)
    text = text.replace(/https?:\s+/g, "https://");
    text = text.replace(/https:\/(?!\/)/g, "https://");

    // Fix URLs with space like "https. //"
    text = text.replace(/https\.\s*\/\//gi, "https://");

    text = text.replace(/https?\s*\n\s*\/\/\s*/gi, "https://");
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
    text = text.replace(/\b[pb]?strong\b/gi, "\n\n## ");
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
    text = text.replace(/(^|\s)\/{2,}(?=\s)/g, "\n");
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

    // ✅ Clean stray #
    text = text.replace(/(^|\n)#(?!#)/g, "\n");
    // ✅ Remove trailing slashes at end of lines (but keep URLs safe)
    text = text.replace(/([^\n])\/(\s|\n)/g, "$1$2");
    // ✅ Fix broken commas on new lines
    text = text.replace(/\n\s*,/g, ",");
    // ✅ Remove trailing broken attribute garbage
    text = text.replace(/class="[^"]*"/gi, "");
    // ✅ Fix bullet spacing
    text = text.replace(/\n?•\s*/g, "\n• ");

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
    // ✅ FIX broken "pbr" patterns (MAIN FIX)
    text = text.replace(/pbrp/gi, "\n\n");
    text = text.replace(/pbr/gi, "\n");

    // ✅ FIX bullet points like "pbr·"
    text = text.replace(/\n?\s*·\s*/g, "\n• ");

    // ✅ Clean remaining single "p"
    text = text.replace(/\bp\b/gi, "");
    // ✅ REMOVE leftover broken tag words (FINAL FIX)
    text = text.replace(/\b(br|div|span|ul|ol|li|p)\b/gi, "");

    // ✅ REMOVE combined garbage like brdiv, brulli
    text = text.replace(/\b(brdiv|brulli|brul|ulli|libr)\b/gi, "");

    // ✅ Clean spaces after removal
    text = text.replace(/[ \t]{2,}/g, " ");
    text = text.replace(/\n{2,}/g, "\n\n");
    // ✅ Fix ONLY known broken patterns (SAFE)
    text = text.replace(/\bdiv(?=[A-Z])/gi, "");
    text = text.replace(/\bspan(?=[A-Z])/gi, "");
    text = text.replace(/\bstrong(?=[A-Z])/gi, "");
    text = text.replace(/\bli(?=\d)/gi, ""); // li2+ → 2+

    // fix double spaces created
    text = text.replace(/[ \t]{2,}/g, " ");
    // ✅ CRITICAL FIX: normalize ALL line breaks first
    text = text.replace(/\r\n/g, "\n");

    // ✅ collapse multiple spaces/newlines early
    text = text.replace(/[ \t]+/g, " ");
    text = text.replace(/\n{3,}/g, "\n\n");

    // ✅ FIX: join broken words/lines safely (MAIN FIX)
    text = text.replace(/([a-z])\n([a-z])/g, "$1 $2");
    // ✅ REMOVE BROKEN TAG WORDS (CRITICAL FIX FOR NEW JOBS)
    text = text.replace(
      /\b(div|span|p|li|ul|ol|section|article|strong|br|h[1-6])\b/gi,
      "",
    );

    // ✅ Remove garbage words globally (VERY IMPORTANT)
    text = text.replace(
      /\b(pa|Fr|rati|em|brp||pbr|br| &amp|ab|po|pt|ol|a|abr|abra|brbr|abrbr|spanbrb|bspan|span|spa|brb|ulb|)\b/gi,
      "",
    );
    // Fix broken word fragments
    text = text.replace(/\bcs\b(?=\s+following|\s+using)/gi, "clips");
    text = text.replace(/\bc\b(?=\s*\.)/gi, "clip");
    text = text.replace(/for each clip\./gi, "for each clip.");
    text = text.replace(/for each c\./gi, "for each clip.");
    text = text.replace(/\bamfied\b/gi, "amplified");
    text = text.replace(/\bOortunity\b/gi, "Opportunity");
    // ✅ Fix broken "pstrong", "divstrong", etc.
    text = text.replace(/\b(p|div|span|ul|li)?\s*strong\b/gi, "");

    // Remove lang attributes like lang="de"
    text = text.replace(/lang="[^"]*"/gi, "");
    // ✅ Convert common section titles to bold headers
    text = text.replace(
      /\n?(What You'll Do|What You'll Bring|Responsibilities|Requirements|Benefits|Ideal Candidate Profile)\n?/gi,
      "\n\n## $1\n",
    );

    // Remove ### and #### header markers
    text = text.replace(/^####\s*/gm, "");
    text = text.replace(/^###\s*/gm, "");

    // Fix spacing before URL
    text = text.replace(/([a-z])(https?:\/\/)/gi, "$1 $2");

    text = text.replace(
      /(Contra)\s+(Remote)\s+(Apr \d+, \d{4})/gi,
      "$1\n$2\n$3",
    );

    // ✅ Convert titles EXCEPT URL / To apply  Convert "Title:" into bold section
    text = text.replace(
      /\n?\s*(?!URL|Website|To apply)([A-Z][A-Za-z\s&/]{2,30})\s*:\s*\n?/g,
      "\n\n## $1\n",
    );

    // ✅ Fix tech words spacing
    text = text.replace(/\b(HTML|CSS|SQL|API)\s+(?=[A-Z])/g, "$1, ");

    // ✅ REMOVE leftover symbols garbage
    text = text.replace(/[#:;]+(?=\s|$)/g, "");

    // ✅ FINAL FIX: force URL + link in one line (LAST step)
    text = text.replace(
      /\b(URL|Website|To apply)\s*\n+\s*(https?:\/\/[^\s]+)/gi,
      "$1: $2",
    );

    // ✅ Fix broken URLs like https.\n//
    text = text.replace(/https?\.\s*\n\s*\/\//gi, "https://");

    // ✅ Fix repeated br issues
    text = text.replace(/br\s*br/gi, "\n");

    // ✅ FIX broken href leftovers
    text = text.replace(/href="\s*(https?:\/\/[^\s"]+)/gi, "$1");

    // ✅ REMOVE any remaining href=" garbage
    text = text.replace(/href="[^"]*/gi, "");

    // ✅ Remove dot after URLs
    text = text.replace(/(https?:\/\/[^\s]+)\./g, "$1");

    // Fix "URL" label position (move it before the link)
    text = text.replace(
      /\b([A-Za-z\s]+)\s+URL\s*\n\s*(https?:\/\/[^\s]+)/gi,
      (_, location, url) => `${location.trim()}\nURL: ${url}`,
    );

    // Fix "To apply" label (attach to link)
    text = text.replace(
      /\bTo apply\s*\n\s*(https?:\/\/[^\s]+)/gi,
      "To apply: $1",
    );

    // Fix short label values (like Location, Job Type)
    text = text.replace(
      /\b(Location|Job Type|Headquarters)\s*\n\s*([^\n]{1,60})/gi,
      (_, label, value) => {
        // if short → keep inline
        if (value.length <= 60 && !value.includes(".")) {
          return `${label}: ${value.trim()}`;
        }
        return `${label}\n${value}`;
      },
    );

    // ✅ FIX: join lines ending with dash (— or -)
    text = text.replace(
      /(Location: [^\n]+)[—-]\s*\n\s*([^\n]+)/gi,
      (_, first, second) => `${first} — ${second.trim()}`,
    );
    // ✅ GENERAL FIX: join any line ending with dash
    text = text.replace(
      /([^\n]+)[—-]\s*\n\s*([^\n]+)/g,
      (_, a, b) => `${a} — ${b.trim()}`,
    );

    // ✅ FIX: Join 3-line broken blocks like Time + Schedule + Flexible Hours
    text = text.replace(
      /\b(Time)\s*\n\s*(Schedule)\s*\n\s*([^\n]{2,50})/gi,
      (_, a, b, c) => `${a} ${b}: ${c.trim()}`,
    );

    // ✅ FIX: Join short broken label lines (Time / Schedule / Flexible Hours)
    text = text.replace(
      /\b(Time|Work From Anywhere|Job Type|Schedule)\s*\n\s*([A-Za-z ]{2,40})/gi,
      (_, label, value) => `${label} ${value.trim()}`,
    );

    // ✅ FINAL CLEAN (MUST BE LAST)
    text = text.replace(/<\/?[^>]+(>|$)/g, ""); // remove ALL remaining HTML tags
    text = text.replace(/\bb\s+/g, ""); // fix "b co-create" issue

    // ✅ REMOVE leftover garbage words
    text = text.replace(/\b(br|ul|ol)\b/gi, "");

    // ✅ SPLIT into lines for processing
    const lines = text.split("\n");

    // ✅ rebuild clean structure
    const fixed: string[] = [];

    lines.forEach((line) => {
      const l = line.trim();

      if (!l) return;

      // ✅ detect section titles (German + English)
      if (
        l.match(
          /^(Dein Profil|Dein Tech-Stack|Damit kannst du uns beeindrucken|Was wir bieten|About|Requirements|Benefits)$/i,
        )
      ) {
        fixed.push(`\n## ${l}`);
        return;
      }

      // ✅ detect list items (tech words, short lines)
      if (
        l.length < 60 &&
        !l.startsWith("•") &&
        !l.includes(".") &&
        !l.includes(":")
      ) {
        fixed.push(`• ${l}`);
        return;
      }

      // default
      fixed.push(l);
    });

    // ✅ join back
    text = fixed.join("\n");

    // ✅ FIX broken anchor text (a "text" url a → text: url)
    text = text.replace(
      /\ba\s*"?([^"]{3,80})"?\s*(https?:\/\/[^\s]+)\s*a\b/gi,
      (_, label, url) => `${label.trim()}: ${url}`,
    );

    // ✅ FIX broken domain like clerkdev → clerk.dev
    text = text.replace(/\b(clerk)(dev)\b/gi, "$1.$2");

    // ✅ REMOVE duplicated commas / fragments
    text = text.replace(/,\s*a,?/gi, "");

    // ✅ CLEAN weird quotes
    text = text.replace(/["“”]/g, "");

    // ✅ SMART JOIN LINES INTO PARAGRAPHS
    const joined: string[] = [];

    const source = text.split("\n");

    for (let i = 0; i < source.length; i++) {
      const current = source[i].trim();
      const next = source[i + 1]?.trim();

      if (!current) continue;

      // ❌ keep bullets separate
      if (current.startsWith("•")) {
        joined.push(current);
        continue;
      }

      // ❌ keep headers separate
      if (current.startsWith("##")) {
        joined.push("\n" + current);
        continue;
      }

      // ✅ JOIN if it's a sentence continuation
      if (
        next &&
        !next.startsWith("•") &&
        !next.startsWith("##") &&
        !/[:.!?]$/.test(current) // added ":" protection
      ) {
        joined.push(current + " " + next);
        i++; // skip next (already merged)
      } else {
        joined.push(current);
      }
    }

    // replace text
    text = joined.join("\n");
    // ✅ IMPORTANT: from now, ONLY modify "text" (NOT fixed anymore)

    // Fix "a https://..."
    text = text.replace(/\ba\s+(https?:\/\/)/gi, "$1");

    // Fix weird quotes like: " "0x a,
    text = text.replace(/"\s*"\s*([a-z0-9]+)\s*a,/gi, "$1,");

    // Remove stray "a"
    text = text.replace(/\ba\b/g, "");

    // Remove stray "#"
    text = text.replace(/\s*#\s*/g, "");

    // only remove single-letter lines (not inside sentences)
    text = text.replace(/^\s*[a-zA-Z]\s*$/gm, "");

    // ✅ FIX labels like URL / Location / Headquarters
    text = text.replace(
      /\b(URL|Website|Location|Headquarters)\s*\n+\s*([^\n]+)/gi,
      (_, label, value) => `${label}: ${value.trim()}`,
    );

    // ✅ Fix missing dot in domains
    text = text.replace(
      /\b(https?:\/\/)?([a-z0-9-]+)(com|org|net)\b/gi,
      (_, p1, p2, p3) => {
        return `${p1 || "https://"}${p2}.${p3}`;
      },
    );

    // ✅ Join short bullet lines into one line
    text = text.replace(
      /(• [^\n]{1,30})\n(• [^\n]{1,30})/g,
      (_, a, b) => `${a}, ${b.replace("• ", "")}`,
    );

    // ✅ Fix repeated word + garbage quotes
    text = text.replace(/(\b[A-Z][a-z]+)\s+a\s*"\s*"\s*\1\s*a\s*/g, "$1 ");

    // ✅ Remove broken ". ." or ". #"
    text = text.replace(/\.\s*\./g, ".");

    text = text.replace(
      /\b([A-Z])\s+([A-Z])\s+(tests?|testing)\b/g,
      "$1/$2 $3",
    );

    // ✅ Remove list garbage prefixes
    text = text.replace(/\b(pul|ulp|ulul|ul)\b/gi, "");

    // ✅ FIX labels properly
    text = text.replace(
      /\b(URL|Website|Location|Headquarters)\s*\n+\s*([^\n]+)/gi,
      (_, label, value) => `${label}: ${value.trim()}`,
    );

    // ✅ FIX BROKEN TAG CHAINS (ulbr, libr, h4strong, etc.)
    text = text.replace(/\b(ul|ol|li|br|p|h[1-6]|strong){2,}\b/gi, "\n");

    // ✅ CLEAN weird "culture aa https://..."
    text = text.replace(
      /(https?:\/\/[^\s]+)\s+[a-z]+\s+[a-z]+\s+(https?:\/\/[^\s]+)/gi,
      "$1",
    );

    // ✅ ABSOLUTE FINAL CLEAN (THIS MUST BE LAST)

    // remove broken tag chains
    text = text.replace(/\b(ul|ol|li|br|p|h[1-6]|strong){2,}\b/gi, "\n");

    // fix joined words
    text = text.replace(/\b([a-z]+)nd\b/gi, "$1 and");
    text = text.replace(/\b([a-z]+)ctivation\b/gi, "$1 activation");

    // remove "a", "aa"
    text = text.replace(/\b(a|aa)\b/gi, "");

    // fix headers
    text = text.replace(
      /\b(h[1-6])?\s*strong\s*([A-Z][^\n]+)/gi,
      "\n\n## $2\n",
    );

    // clean bullets
    text = text.replace(/\n?\s*•\s*/g, "\n• ");

    // remove garbage prefixes
    text = text.replace(/\b(pul|ulp|ulul|ulbr|libr|brul)\b/gi, "");

    // fix broken lines
    text = text.replace(/([a-z])\n([a-z])/g, "$1 $2");

    // ✅ remove ONLY known garbage chains (SAFE - no break)
    text = text.replace(/\b(librlistrong|ulbrpem|ulbr|libr|pul|ulp)\b/gi, "");
    text = text.replace(/\bata\b/gi, "at a");

    // ✅ HARD FINAL CLEAN (this fixes 80% of your UI damage)
    text = text
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/\b(work|weworkremotely)\s*\n\s*(work|weworkremotely)\b/gi, "")
      .replace(/\n\s*,/g, ",")
      .trim();

    setCleanText(text || "No description available");
  }, [html]);

  // ✅ SMART LINE MERGING (fix broken sentences + bullets)
  const lines = cleanText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .reduce((acc: string[], line) => {
      const last = acc[acc.length - 1];

      const isBullet = line.startsWith("•") || line.startsWith("-");

      const lastIsBullet =
        last && (last.startsWith("•") || last.startsWith("-"));

      // ❌ remove single "a" or broken "a url"
      line = line.replace(/^\s*a\s+(https?:\/\/)/i, "$1");
      line = line.replace(/^\s*a\s*$/i, "");

      // ❌ ignore empty bullets
      if (line === "•" || line === "-") return acc;

      // ✅ FIX: join LABEL + VALUE (URL, Location, etc.)
      if (
        last &&
        /^(URL|Location|Headquarters|Job Type|Website)$/i.test(last) &&
        line.length < 100
      ) {
        acc[acc.length - 1] = `${last}: ${line}`;
        return acc;
      }

      // ✅ join broken sentences
      if (
        last &&
        !last.endsWith(".") &&
        !last.endsWith(":") &&
        !lastIsBullet &&
        !isBullet &&
        line.length < 80
      ) {
        acc[acc.length - 1] = last + " " + line;
      } else {
        acc.push(line);
      }

      return acc;
    }, []);

  return (
    <div className="text-gray-200 text-sm leading-7">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return null;

        // ✅ remove ### or ## leftovers
        const cleanLine = trimmed.replace(/^#+\s*/, "");

        if (!cleanLine) return null;

        const isBullet = cleanLine.startsWith("•") || cleanLine.startsWith("-");

        const possibleTitle = cleanLine.replace(/^[-•]\s*/, "");

        const isTitle =
          !cleanLine.includes("http") &&
          (/^(Responsibilities|Requirements|Benefits|Mission|About|What|Why|Who)/i.test(
            possibleTitle,
          ) ||
            (possibleTitle.length < 60 &&
              /^[A-Z]/.test(possibleTitle) &&
              !/[.!?]$/.test(possibleTitle)));

        const urlMatch = cleanLine.match(/(https?:\/\/[^\s]+)/);

        // ✅ URL rendering
        if (urlMatch) {
          const url = urlMatch[0];
          const before = cleanLine.replace(url, "").trim();

          return (
            <div key={i} className="my-2 break-words">
              {before && <span>{before} </span>}
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-400 underline"
              >
                {url}
              </a>
            </div>
          );
        }

        // ✅ Titles
        if (isTitle) {
          return (
            <div key={i} className="font-bold text-white text-lg mt-6 mb-2">
              {cleanLine}
            </div>
          );
        }

        // ✅ Bullet points
        if (isBullet) {
          return (
            <div key={i} className="ml-4 my-1 flex">
              <span className="mr-2">•</span>
              <span>{cleanLine.replace(/^[-•]\s*/, "")}</span>
            </div>
          );
        }

        // ✅ Paragraphs (main spacing fix)
        return (
          <p key={i} className="my-3 text-gray-300 leading-7">
            {cleanLine}
          </p>
        );
      })}
    </div>
  );
};

export default CleanText;
// PR trigger change
