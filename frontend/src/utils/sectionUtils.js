function parseSectionTitle(title) {
  // Match: 8a., 8b.1., 8[f-i]., 8., etc.
  // Groups: [number][letter][subnumber][bracket]
  const match = title.match(/^(\d+)([a-z])?(?:\.([0-9]+))?(?:\[(.*?)\])?/i);
  let num = match ? parseInt(match[1], 10) : null;
  let letter = match && match[2] ? match[2] : "";
  let subnum = match && match[3] ? parseInt(match[3], 10) : null;
  let bracket = match && match[4] ? match[4] : "";

  // If bracket, get the start letter (e.g. 'f' from 'f-i')
  let letterIndex = "";
  if (bracket) {
    letterIndex = bracket.split("-")[0].trim();
  }

  return { num, letter, subnum, bracket, letterIndex, raw: title };
}

// Natural sort function for titles/categories with leading numbers
export function naturalSort(a, b) {
  const numA = parseInt(a, 10);
  const numB = parseInt(b, 10);
  const hasNumA = !isNaN(numA);
  const hasNumB = !isNaN(numB);

  if (hasNumA && hasNumB) {
    if (numA !== numB) return numA - numB;
    return a.localeCompare(b, undefined, { sensitivity: "base" });
  }
  if (hasNumA) return -1;
  if (hasNumB) return 1;
  return a.localeCompare(b, undefined, { sensitivity: "base" });
}

export function sectionTitleSort(a, b) {
  const A = parseSectionTitle(a.title);
  const B = parseSectionTitle(b.title);

  // 1. Sort by number
  if (A.num !== null && B.num !== null) {
    if (A.num !== B.num) return A.num - B.num;

    // 2. If both have brackets, sort by start letter
    if (A.bracket && B.bracket) {
      return A.letterIndex.localeCompare(B.letterIndex);
    }

    // 3. If one has bracket and the other is a single letter
    if (A.bracket && B.letter) {
      // If B.letter is in A.bracket range, bracket comes first
      const [start, end] = A.bracket.split("-").map((s) => s.trim());
      if (B.letter >= start && (!end || B.letter <= end)) return -1;
      // Otherwise, sort by letter
      return A.letterIndex.localeCompare(B.letter);
    }
    if (A.letter && B.bracket) {
      const [start, end] = B.bracket.split("-").map((s) => s.trim());
      if (A.letter >= start && (!end || A.letter <= end)) return 1;
      return A.letter.localeCompare(B.letterIndex);
    }

    // 4. If both are single letters, sort alphabetically
    if (A.letter && B.letter) {
      if (A.letter !== B.letter) return A.letter.localeCompare(B.letter);
    }

    // 5. Subnumber
    if ((A.subnum || 0) !== (B.subnum || 0)) return (A.subnum || 0) - (B.subnum || 0);

    // 6. Fallback
    return A.raw.localeCompare(B.raw, undefined, { sensitivity: "base" });
  }

  // Numbered comes before non-numbered
  if (A.num !== null) return -1;
  if (B.num !== null) return 1;
  return A.raw.localeCompare(B.raw, undefined, { sensitivity: "base" });
}