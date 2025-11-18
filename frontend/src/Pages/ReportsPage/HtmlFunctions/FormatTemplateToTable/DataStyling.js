
function genericDataStyler(data) {
    const wordArray = String(data).trim().split(/\s+/);

    const formattedArray = wordArray.map((word) => {
        if (isUrl(word)) {
            return linkWrapper(word);
        }

        const doiResult = isDOI(word);
        if (doiResult.isValid) {
            return doiWrapper(word);
        }

        return word;
    });

    const formattedData = formattedArray.join(" ");

    return formattedData;
}

function doiWrapper(doi) {
    const doiResult = isDOI(doi);
    const cleanedDoi = doiResult.doi;
    const link = `https://doi.org/${cleanedDoi}`;
    return `<a href="${link}" target="_blank" rel="noopener noreferrer">${doi}</a>`;
}

function isDOI(str) {
    let cleanedStr = String(str).trim();

    // Remove leading URL/doi.org prefixes
    cleanedStr = cleanedStr.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "");
    cleanedStr = cleanedStr.replace(/^doi\.org\//i, "");

    // Remove surrounding angle brackets sometimes used in citations: <...>
    // (only if the whole value is wrapped; avoid removing internal < > which are valid)
    if (/^<.*>$/.test(cleanedStr)) {
        cleanedStr = cleanedStr.slice(1, -1);
    }

    // Trim trailing punctuation commonly added in prose (.,;:)
    cleanedStr = cleanedStr.replace(/[.,;:]+$/g, "");

    // DOI regex: prefix "10." + 4-9 digits + "/" + non-whitespace suffix
    // Using \S+ for suffix is intentionally permissive to allow older/special chars like <>;()
    const doiRegex = /^10\.\d{4,9}\/\S+$/i;

    return { doi: cleanedStr, isValid: doiRegex.test(cleanedStr) };
}
export function dataStyler(data) {
    if (isDateData(data)) {
        return dateDataStyler(data);
    }

    let styled = genericDataStyler(data);
    styled = commaStyler(styled);
    return styled;
}

function dateDataStyler(data) {
    function isNumber(word) {
        return /^\d+$/.test(word);
    }

    function monthAbbreviator(word) {
        const month = String(word)
            .replace(/[^a-z]/g, "")
            .toLowerCase();

        const monthMap = {
            january: "Jan",
            february: "Feb",
            march: "Mar",
            april: "Apr",
            may: "May",
            june: "Jun",
            july: "Jul",
            august: "Aug",
            september: "Sep",
            october: "Oct",
            november: "Nov",
            december: "Dec",
        };

        return monthMap[month];
    }

    const cleanedData = String(data).trim().toLowerCase();
    const wordArray = cleanedData.split(/\s+/);

    const formattedWordArray = wordArray.map((word) => {
        if (word === "-") {
            return "-<br/>"; // break on dash
        } else if (isNumber(word)) {
            return word;
        } else {
            return monthAbbreviator(word) ?? word;
        }
    });

    return `<div class="date-div">${formattedWordArray.join(" ")}</div>`; // normal spaces only
}

function isDateData(data) {
    // First check if it's a DOI - if so, it's NOT date data
    const doiResult = isDOI(data);
    if (doiResult.isValid) {
        return false;
    }

    // Then check if it's a URL - if so, it's NOT date data
    if (isUrl(data)) {
        return false;
    }

    function isMonthsAndNumbers(str) {
        // Split on spaces or commas
        const parts = str.split(/[\s,]+/).filter(Boolean);

        return parts.every(
            (part) => allowedMonths.includes(part.toLowerCase()) || /^\d+$/.test(part) || part.toLowerCase() === "current"
        );
    }

    let cleanedData = String(data)
        .replace(/[^a-zA-Z0-9 ]/g, "")
        .toLowerCase();
    const allowedMonths = [
        "january",
        "jan",
        "february",
        "feb",
        "march",
        "mar",
        "april",
        "apr",
        "may",
        "june",
        "jun",
        "july",
        "jul",
        "august",
        "aug",
        "september",
        "sep",
        "sept",
        "october",
        "oct",
        "november",
        "nov",
        "december",
        "dec",
    ];

    return isMonthsAndNumbers(cleanedData);
}

function isUrl(string) {
    const urlPattern = /https?:\/\/[^\s]+/i;
    return urlPattern.test(string);
}

function linkWrapper(link) {
    return `<div class="link-wrap"><a href="${link}" target="_blank" rel="noopener noreferrer">${link}</a></div>`;
}

function commaStyler(data) {
    // Replace commas with comma + space, but NOT inside HTML tags
    // This regex avoids matching commas inside < >
    return String(data).replace(/,(?!\s)(?![^<]*>)/g, ", ");
}