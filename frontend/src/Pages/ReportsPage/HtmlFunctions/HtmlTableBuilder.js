export const generateColumnFormatViaRatioArray = (ratioArray) => {
    const totalRatio = ratioArray.reduce((sum, ratio) => sum + ratio, 0);
    
    return ratioArray.map((ratio) => {
        const widthPercentage = ((ratio / totalRatio) * 100).toFixed(2);
        return `${widthPercentage}%`;
    });
};

export const textOptions = (text, bold = false, size = 9.5, link = null) => {
    return {
        text: text,
        bold: bold,
        size: size,
        link: link
    }
}

export const cellOptions = (textOptions, color = null) => {
    return {
        textOptions: textOptions,
        color: color
    }
}

const textOptionsBuilder = (textOptions) => {
    const processedTexts = textOptions.map((textOption) => {
        if (!textOption || !textOption.text || textOption.text === 'undefined' || textOption.text === 'null') {
            return "";
        }

        // Use sanitizeRichText instead of sanitizeHtml to preserve rich text formatting
        let html = sanitizeRichText(String(textOption.text));

        if (textOption.bold) {
            html = `<strong>${html}</strong>`;
        }

        if (textOption.size) {
            html = `<span style="font-size: ${textOption.size}pt; line-height: ${textOption.size * 1.2}pt;">${html}</span>`;
        }

        if (textOption.link) {
            html = `<a href="${textOption.link}" style="color: inherit; text-decoration: underline;">${html}</a>`;
        }

        return html;
    }).filter((text) => text.trim() !== "");

    return processedTexts.join(', ');
}

export const cellRowBuilder = (cellOptions, columnWidths, mergeCells = false, includeFirstColumnInMerge = false) => {
    let cellsHtml = cellOptions.map((cellOption, index) => {
        let html = textOptionsBuilder(cellOption.textOptions);

        if (html.trim() === "") {
            html = "&nbsp;"; // Non-breaking space for empty cells
        }

        // Apply background color if specified
        let cellStyle = `padding: 4px 6px; border: 1px solid #000; vertical-align: top; width: ${columnWidths[index] || 'auto'}; max-width: ${columnWidths[index] || 'auto'}; word-wrap: break-word; hyphens: auto; -webkit-hyphens: auto; -moz-hyphens: auto; overflow-wrap: break-word; page-break-inside: avoid;`;
        
        if (cellOption.color) {
            const colorMap = {
                'headerGray': '#999999',
                'subHeaderGray': '#CCCCCC', 
                'columnGray': '#F2F2F2'
            };
            const bgColor = colorMap[cellOption.color] || cellOption.color;
            cellStyle += ` background-color: ${bgColor};`;
        }

        return `<td style="${cellStyle}">${html}</td>`;
    });

    if (mergeCells) {
        cellsHtml = cellsHtml.filter((cell) => !cell.includes(">&nbsp;<"));
        
        if (includeFirstColumnInMerge) {
            // Merge all cells including the first column
            const combinedContent = cellOptions.map(opt => textOptionsBuilder(opt.textOptions)).filter(content => content.trim() !== "").join(', ');
            const totalWidth = columnWidths.reduce((sum, width) => sum + parseFloat(width), 0);
            const cellStyle = `padding: 4px 6px; border: 1px solid #000; vertical-align: top; width: ${totalWidth}%; max-width: ${totalWidth}%; word-wrap: break-word; hyphens: auto; -webkit-hyphens: auto; -moz-hyphens: auto; overflow-wrap: break-word; box-sizing: border-box; page-break-inside: avoid;`;
            let bgColor = '';
            if (cellOptions[0]?.color) {
                const colorMap = {
                    'headerGray': '#999999',
                    'subHeaderGray': '#CCCCCC', 
                    'columnGray': '#F2F2F2'
                };
                bgColor = ` background-color: ${colorMap[cellOptions[0].color] || cellOptions[0].color};`;
            }
            cellsHtml = [`<td colspan="${cellOptions.length}" style="${cellStyle}${bgColor}">${combinedContent}</td>`];
        } else {
            // Keep first column separate, merge the rest
            const firstCell = cellsHtml[0];
            const restContent = cellOptions.slice(1).map(opt => textOptionsBuilder(opt.textOptions)).filter(content => content.trim() !== "").join(', ');
            const restWidth = columnWidths.slice(1).reduce((sum, width) => sum + parseFloat(width), 0);
            const restCellStyle = `padding: 4px 6px; border: 1px solid #000; vertical-align: top; width: ${restWidth}%; max-width: ${restWidth}%; word-wrap: break-word; hyphens: auto; -webkit-hyphens: auto; -moz-hyphens: auto; overflow-wrap: break-word; box-sizing: border-box; page-break-inside: avoid;`;
            let bgColor = '';
            if (cellOptions[1]?.color) {
                const colorMap = {
                    'headerGray': '#999999',
                    'subHeaderGray': '#CCCCCC', 
                    'columnGray': '#F2F2F2'
                };
                bgColor = ` background-color: ${colorMap[cellOptions[1].color] || cellOptions[1].color};`;
            }
            cellsHtml = [firstCell, `<td colspan="${cellOptions.length - 1}" style="${restCellStyle}${bgColor}">${restContent}</td>`];
        }
    }

    return `
    <table style="width: 100%; border-collapse: collapse; margin: 0; padding: 0; border-spacing: 0; table-layout: fixed; page-break-inside: auto;">
        <tr style="page-break-inside: avoid; page-break-after: auto;">
            ${cellsHtml.join('')}
        </tr>
    </table>`;
}

// Function to detect if text contains HTML tags
const isHtmlContent = (text) => {
    if (typeof text !== 'string') return false;
    // Check for common HTML tags
    const htmlTagPattern = /<\/?[a-z][\s\S]*>/i;
    return htmlTagPattern.test(text);
};

// Function to handle HTML content - just pass through HTML or escape plain text
export const sanitizeRichText = (text) => {
    if (typeof text !== 'string') return text;
    
    // If it's HTML content, just return it as-is
    if (isHtmlContent(text)) {
        return text;
    }
    
    // For non-HTML text, escape HTML characters
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
};

export const sanitizeHtml = (text) => {
    if (typeof text !== 'string') return text;

    // Basic HTML escaping
    let sanitized = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    // Handle common symbols and special characters
    const symbolMap = {
        '©': '&copy;',
        '®': '&reg;',
        '™': '&trade;',
        '€': '&euro;',
        '£': '&pound;',
        '¢': '&cent;',
        '¥': '&yen;',
        '§': '&sect;',
        '¶': '&para;',
        '†': '&dagger;',
        '‡': '&Dagger;',
        '•': '&bull;',
        '…': '&hellip;',
        '–': '&ndash;',
        '—': '&mdash;',
        '\u2018': '&lsquo;',
        '\u2019': '&rsquo;',
        '\u201C': '&ldquo;',
        '\u201D': '&rdquo;',
        '«': '&laquo;',
        '»': '&raquo;',
        '°': '&deg;',
        '±': '&plusmn;',
        '×': '&times;',
        '÷': '&divide;',
        '½': '&frac12;',
        '¼': '&frac14;',
        '¾': '&frac34;',
        'α': '&alpha;',
        'β': '&beta;',
        'γ': '&gamma;',
        'δ': '&delta;',
        'ε': '&epsilon;',
        'ζ': '&zeta;',
        'η': '&eta;',
        'θ': '&theta;',
        'ι': '&iota;',
        'κ': '&kappa;',
        'λ': '&lambda;',
        'μ': '&mu;',
        'ν': '&nu;',
        'ξ': '&xi;',
        'ο': '&omicron;',
        'π': '&pi;',
        'ρ': '&rho;',
        'σ': '&sigma;',
        'τ': '&tau;',
        'υ': '&upsilon;',
        'φ': '&phi;',
        'χ': '&chi;',
        'ψ': '&psi;',
        'ω': '&omega;',
        'Α': '&Alpha;',
        'Β': '&Beta;',
        'Γ': '&Gamma;',
        'Δ': '&Delta;',
        'Ε': '&Epsilon;',
        'Ζ': '&Zeta;',
        'Η': '&Eta;',
        'Θ': '&Theta;',
        'Ι': '&Iota;',
        'Κ': '&Kappa;',
        'Λ': '&Lambda;',
        'Μ': '&Mu;',
        'Ν': '&Nu;',
        'Ξ': '&Xi;',
        'Ο': '&Omicron;',
        'Π': '&Pi;',
        'Ρ': '&Rho;',
        'Σ': '&Sigma;',
        'Τ': '&Tau;',
        'Υ': '&Upsilon;',
        'Φ': '&Phi;',
        'Χ': '&Chi;',
        'Ψ': '&Psi;',
        'Ω': '&Omega;'
    };

    // Replace symbols
    for (const [symbol, entity] of Object.entries(symbolMap)) {
        sanitized = sanitized.replace(new RegExp(symbol, 'g'), entity);
    }

    return sanitized;
};


