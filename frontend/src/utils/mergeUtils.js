/*** Helper function to check if a publication has already been merged from Scopus
 * Check for fields that typically come from Scopus and indicate the publication has been already updated
 */
export const hasBeenMergedFromScopus = (publication) => {
  if (!publication || !publication.data_details) return false;

  const data = publication.data_details;

  // DOI / Link / Keywords are indicators of Scopus data
  let scopusIndicators;
  try {
    scopusIndicators = [
      data.doi && data.doi.trim() !== "",
      data.link && data.link.trim() !== "",
      data.keywords && data.keywords.length !== 0,
    ];
  } catch (error) {
    console.error("Error checking Scopus indicators:", error);
  }

  // If at least 2 Scopus-specific fields are present, consider it already merged
  const scopusFieldCount = scopusIndicators.filter(Boolean).length;
  return scopusFieldCount >= 1;
};

// Helper function to calculate title similarity
export const calculateTitleSimilarity = (title1, title2) => {
  if (!title1 || !title2) return 0;

  // Normalize titles: remove extra spaces, convert to lowercase, remove common punctuation
  const normalize = (title) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s]/g, "") // Remove punctuation
      .replace(/\s+/g, " ") // Replace multiple spaces with single space
      .trim();
  };

  const normalizedTitle1 = normalize(title1);
  const normalizedTitle2 = normalize(title2);

  // Check for exact match after normalization
  if (normalizedTitle1 === normalizedTitle2) {
    return 1.0; // 100% match
  }

  // Calculate similarity using Levenshtein distance
  return calculateStringSimilarity(normalizedTitle1, normalizedTitle2);
};

// Helper function to calculate string similarity (simple Levenshtein-based)
export const calculateStringSimilarity = (str1, str2) => {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
};

// Helper function to normalize text for comparison
export const normalizeText = (text) => {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

// Helper function to normalize amounts for comparison
export const normalizeAmount = (amount) => {
  if (!amount) return 0;
  const numericAmount = String(amount).replace(/[^0-9.]/g, "");
  return parseFloat(numericAmount) || 0;
};

// Helper function to extract year from date string
export const normalizeYear = (dateStr) => {
  if (!dateStr) return null;
  const yearMatch = String(dateStr).match(/\b(\d{4})\b/);
  return yearMatch ? parseInt(yearMatch[1]) : null;
};

// Helper function to calculate Jaccard similarity for text comparison
export const calculateJaccardSimilarity = (text1, text2) => {
  if (!text1 || !text2) return 0;

  const norm1 = normalizeText(text1);
  const norm2 = normalizeText(text2);

  if (norm1 === norm2) return 100;

  const words1 = norm1.split(" ").filter((w) => w.length > 2);
  const words2 = norm2.split(" ").filter((w) => w.length > 2);

  if (words1.length === 0 && words2.length === 0) return 100;
  if (words1.length === 0 || words2.length === 0) return 0;

  const intersection = words1.filter((w) => words2.includes(w));
  const union = [...new Set([...words1, ...words2])];

  return (intersection.length / union.length) * 100;
};

// Helper function to calculate author similarity between publications
export const calculateAuthorSimilarity = (fetchedPub, existingPubData) => {
  // Extract author strings from both publications
  const fetchedAuthors = fetchedPub.author_names || fetchedPub.authors || "";
  const existingAuthors = existingPubData.author_names || existingPubData.authors || "";

  // Handle empty, null, or undefined values
  if (
    !fetchedAuthors ||
    !existingAuthors ||
    (Array.isArray(fetchedAuthors) && fetchedAuthors.length === 0) ||
    (Array.isArray(existingAuthors) && existingAuthors.length === 0) ||
    (typeof fetchedAuthors === "string" && fetchedAuthors.trim() === "") ||
    (typeof existingAuthors === "string" && existingAuthors.trim() === "")
  ) {
    return 0; // No author info available
  }

  // Normalize and split authors - handle both arrays and strings
  const normalizeAuthors = (authorData) => {
    let authorString;

    // Handle different author data formats
    if (Array.isArray(authorData)) {
      // If it's an array, join with commas
      authorString = authorData.join(", ");
    } else if (typeof authorData === "string") {
      // If it's already a string, use as is
      authorString = authorData;
    } else {
      // If it's neither, convert to string
      authorString = String(authorData);
    }

    return authorString
      .toLowerCase()
      .replace(/[^\w\s,;]/g, "") // Remove punctuation except commas and semicolons
      .split(/[,;]/) // Split by comma or semicolon
      .map((author) => author.trim())
      .filter((author) => author.length > 2) // Remove very short strings
      .map((author) => {
        // Extract last name (usually comes first or last)
        const parts = author.split(/\s+/);
        if (parts.length > 1) {
          // Try to identify last name - typically longer and comes first or last
          return parts.reduce((longest, current) => (current.length > longest.length ? current : longest));
        }
        return author;
      });
  };

  const fetchedAuthorList = normalizeAuthors(fetchedAuthors);
  const existingAuthorList = normalizeAuthors(existingAuthors);

  if (fetchedAuthorList.length === 0 || existingAuthorList.length === 0) {
    return 0;
  }

  // Check for author overlap using fuzzy matching
  let matchCount = 0;
  const usedExistingAuthors = new Set();

  try {
    fetchedAuthorList.forEach((fetchedAuthor) => {
      existingAuthorList.forEach((existingAuthor, index) => {
        if (usedExistingAuthors.has(index)) return;

        // Check for exact match
        if (fetchedAuthor === existingAuthor) {
          matchCount++;
          usedExistingAuthors.add(index);
          return;
        }

        // Check for fuzzy match (using string similarity)
        const authorSimilarity = calculateStringSimilarity(fetchedAuthor, existingAuthor);
        if (authorSimilarity > 0.8) {
          // High threshold for author name similarity
          matchCount++;
          usedExistingAuthors.add(index);
          return;
        }

        // Check for substring match (for cases like "Smith" vs "Smith J")
        if (fetchedAuthor.includes(existingAuthor) || existingAuthor.includes(fetchedAuthor)) {
          if (Math.min(fetchedAuthor.length, existingAuthor.length) > 3) {
            // Avoid matching very short names
            matchCount += 0.8; // Partial credit for substring matches
            usedExistingAuthors.add(index);
            return;
          }
        }
      });
    });
  } catch (error) {
    console.error("Error in author similarity calculation:", error);
    console.log("Fetched authors:", fetchedAuthors);
    console.log("Existing authors:", existingAuthors);
    return 0;
  }

  // Calculate similarity as percentage of matched authors
  const maxAuthors = Math.max(fetchedAuthorList.length, existingAuthorList.length);
  const similarity = matchCount / maxAuthors;

  return Math.min(similarity, 1.0); // Cap at 1.0
};

// Helper function to extract DOIs from citation text
export const extractDOIsFromCitation = (citation) => {
  if (!citation) return [];

  const dois = new Set();
  const doiPatterns = [
    // Standard DOI URLs
    /https?:\/\/(?:dx\.)?doi\.org\/(10\.\d+\/[^\s,;)]+(?:\.[^\s,;)]*)*)/gi,
    /(?:dx\.)?doi\.org\/(10\.\d+\/[^\s,;)]+(?:\.[^\s,;)]*)*)/gi,
    // DOI: prefix patterns (case insensitive)
    /doi:\s*(10\.\d+\/[^\s,;)\].]+)/gi,
    /DOI:\s*(10\.\d+\/[^\s,;)\].]+)/gi,
    // More flexible DOI patterns
    /doi\s+(10\.\d+\/[^\s,;)\].]+)/gi,
    /DOI\s+(10\.\d+\/[^\s,;)\].]+)/gi,
    // Pattern for DOIs that might end with periods
    /(?:doi|DOI)[\s:]+?(10\.\d+\/[^\s,;)\]]+)/gi,
    // Catch standalone DOIs that start with 10.
    /\b(10\.\d{4,}\/[^\s,;)\].]+)/gi,
    // Handle cases where DOI might have spaces (like "10.1136/ bmjopen-2022-062567")
    /(?:doi|DOI)[\s:]+?(10\.\d+\/\s*[^\s,;)\].]+)/gi,
    // Handle malformed DOIs missing the "1" (like "0.1016/...", "0.1080/...")
    /(?:doi|DOI)[\s:]+?(0\.1\d{3,4}\/[^\s,;)\].]+)/gi,
    // Handle malformed DOIs with just space after doi (like "doi: 0.1016/...")
    /\bdoi[\s:]+?(0\.1\d{3,4}\/[^\s,;)\].]+)/gi,
    /\bDOI[\s:]+?(0\.1\d{3,4}\/[^\s,;)\].]+)/gi,
    // Handle malformed DOIs with NO space after colon (like "doi:0.1016/...")
    /\bdoi:(0\.1\d{3,4}\/[^\s,;)\].]+)/gi,
    /\bDOI:(0\.1\d{3,4}\/[^\s,;)\].]+)/gi,
    // Handle DOIs with missing slash (like "doi:10.1016j.vaccine...")
    /\bdoi:(10\.\d{4}[a-zA-Z][^\s,;)\].]*)/gi,
    /\bDOI:(10\.\d{4}[a-zA-Z][^\s,;)\].]*)/gi,
    // More patterns for different formatting
    /(?:doi|DOI)[\s:]*?(10\.\d+\s*\/\s*[^\s,;)\].]+)/gi,
    // Handle DOIs with parentheses (like S1473-3099(16)30120-7)
    /(?:doi|DOI)[\s:]+?(10\.\d+\/[^\s,;.]+(?:\([^)]+\)[^\s,;.]*)*)/gi,
    // Fallback pattern for any DOI starting with 10. that might contain special chars
    /(?:doi|DOI)[\s:]+?(10\.\d+\/[A-Za-z0-9\-()._\/]+)/gi,
  ];

  doiPatterns.forEach((pattern, patternIndex) => {
    let match;
    const regex = new RegExp(pattern.source, pattern.flags);
    while ((match = regex.exec(citation)) !== null) {
      let rawDOI = match[1];

      // Fix common DOI issues
      rawDOI = fixCommonDOIIssues(rawDOI);

      const normalizedDOI = normalizeDOI(rawDOI);
      if (normalizedDOI && isValidDOI(normalizedDOI)) {
        dois.add(normalizedDOI);
      }
    }
  });

  return Array.from(dois);
};

// Helper function to normalize DOI format
export const normalizeDOI = (doi) => {
  if (!doi) return null;

  let normalized = String(doi)
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^(dx\.)?doi\.org\//i, "")
    .replace(/^doi:\s*/i, "")
    .replace(/^DOI:\s*/i, "")
    .replace(/^doi\s+/i, "")
    .replace(/^DOI\s+/i, "")
    // Remove spaces within the DOI
    .replace(/\s+/g, "")
    // Remove trailing punctuation but be careful not to remove dots that are part of the DOI
    .replace(/[,;)\]\s]+$/, "")
    .replace(/\.+$/, "") // Remove trailing dots
    .replace(/^\(+/, "")
    .replace(/^\[+/, "")
    // Remove trailing text that might be journal names or other content
    .replace(/[A-Za-z\s]+$/, "")
    .trim();

  // Convert to lowercase for comparison (DOIs are case-insensitive for the most part)
  normalized = normalized.toLowerCase();

  if (normalized.match(/^10\.\d+\/.+/) && isValidDOI(normalized)) {
    return normalized;
  }

  return null;
};

// Helper function to truncate author names with character limit
export const truncateAuthors = (authors, maxLength = 150) => {
  if (!authors) return "";

  // Handle array of authors
  let authorsString;
  if (Array.isArray(authors)) {
    authorsString = authors.join(", ");
  } else {
    authorsString = authors;
  }

  if (authorsString.length <= maxLength) {
    return authorsString;
  }

  // Try to truncate at a reasonable point (after a comma or semicolon)
  let truncated = authorsString.substring(0, maxLength);
  const lastComma = truncated.lastIndexOf(",");
  const lastSemicolon = truncated.lastIndexOf(";");
  const lastReasonableBreak = Math.max(lastComma, lastSemicolon);

  if (lastReasonableBreak > maxLength * 0.7) {
    truncated = authorsString.substring(0, lastReasonableBreak);
  }

  return truncated + "...";
};

// Levenshtein distance calculation
const levenshteinDistance = (str1, str2) => {
  const matrix = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
      }
    }
  }

  return matrix[str2.length][str1.length];
};

// Helper function to fix common DOI issues
const fixCommonDOIIssues = (doi) => {
  if (!doi) return doi;

  let fixed = doi.trim();

  // Fix missing "1" in DOI (0.1016 -> 10.1016, 0.1080 -> 10.1080, etc.)
  fixed = fixed.replace(/^0\.1(\d{3,4}\/)/g, "10.1$1");

  // Fix missing slash after publisher code (10.1016j.vaccine -> 10.1016/j.vaccine)
  fixed = fixed.replace(/^(10\.\d{4})([a-zA-Z])/g, "$1/$2");

  // Remove spaces within the DOI
  fixed = fixed.replace(/\s+/g, "");

  // Remove trailing punctuation and common suffixes
  fixed = fixed.replace(/[.,;)\]\s]+$/, "");
  fixed = fixed.replace(/[A-Za-z\s]+$/, ""); // Remove trailing text like "Current Sexual Health Reports"

  return fixed;
};

// Helper function to validate if a string is a proper DOI
const isValidDOI = (doi) => {
  if (!doi) return false;
  // Convert to lowercase for validation since DOIs are case-insensitive
  const lowerDoi = doi.toLowerCase();
  if (!lowerDoi.match(/^10\.\d{4,}\/\S+/)) return false;
  if (lowerDoi.match(/^10\.\d{4}\/\d{4}$/)) return false; // Reject year patterns
  if (lowerDoi.length < 10) return false;
  return true;
};
