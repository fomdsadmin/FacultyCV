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

// Update the font size calculation with the improvements
const estimateTextWidth = (text, fontSize = 9.5) => {
    // Less conservative character width estimation
    const avgCharWidth = fontSize * 0.6; // Reduced back from 0.65 to 0.6
    
    // Remove HTML tags for width calculation
    const plainText = text.replace(/<[^>]*>/g, '');
    
    // Find the longest word
    const words = plainText.split(/\s+/);
    const longestWord = words.reduce((longest, word) => 
        word.length > longest.length ? word : longest, '');
    
    // Reduced formatting multiplier for bold text
    const formattingMultiplier = text.includes('<strong>') ? 1.1 : 1.0; // Reduced from 1.15 to 1.1
    
    return longestWord.length * avgCharWidth * formattingMultiplier;
};

const calculateOptimalFontSize = (text, availableWidthPt, baseFontSize = 9.5) => {
    const minFontSize = 6;
    const maxFontSize = baseFontSize;
    
    // Convert percentage width to approximate points (assuming 8.5" page width)
    const pageWidthPt = 612; // 8.5 inches * 72 points/inch
    const availableWidth = (parseFloat(availableWidthPt) / 100) * pageWidthPt;
    
    // Reduced buffer space to allow more room for text
    const usableWidth = availableWidth - 12; // Reduced buffer from 20 to 12
    
    const estimatedWidth = estimateTextWidth(text, baseFontSize);
    
    if (estimatedWidth <= usableWidth) {
        return baseFontSize; // No adjustment needed
    }
    
    // Calculate required font size with a less aggressive safety factor
    const safetyFactor = 0.92; // Increased from 0.85 to 0.92 (only 8% smaller instead of 15%)
    const requiredFontSize = (usableWidth / estimatedWidth) * baseFontSize * safetyFactor;
    
    // Return the larger of minimum font size or calculated size
    return Math.max(minFontSize, Math.min(maxFontSize, requiredFontSize));
};

// Add function to calculate padding based on font size
const calculatePadding = (fontSize, baseFontSize = 9.5) => {
    const basePadding = 4; // Base padding in pixels for normal font size
    const minPadding = 2;  // Minimum padding to maintain readability
    
    // Scale padding proportionally with font size
    const scaledPadding = (fontSize / baseFontSize) * basePadding;
    
    // Ensure minimum padding
    return Math.max(minPadding, Math.round(scaledPadding));
};

const textOptionsBuilder = (textOptions, columnWidth = null) => {
    const processedTexts = textOptions.map((textOption) => {
        if (!textOption || !textOption.text || textOption.text === 'undefined' || textOption.text === 'null') {
            return "";
        }

        // Use sanitizeRichText instead of sanitizeHtml to preserve rich text formatting
        let html = sanitizeRichText(String(textOption.text));

        // Calculate optimal font size if column width is provided
        let fontSize = textOption.size || 9.5;
        if (columnWidth) {
            fontSize = calculateOptimalFontSize(html, columnWidth, textOption.size || 9.5);
        }

        if (textOption.bold) {
            html = `<strong>${html}</strong>`;
        }

        // Always apply font size (either original or calculated)
        html = `<span style="font-size: ${fontSize}pt; line-height: ${fontSize * 1.3}pt;" data-font-size="${fontSize}">${html}</span>`;

        if (textOption.link) {
            html = `<a href="${textOption.link}" style="color: inherit; text-decoration: underline;">${html}</a>`;
        }

        return html;
    }).filter((text) => text.trim() !== "");

    return processedTexts.join(', ');
}

export const cellRowBuilder = (cellOptions, columnWidths, mergeCells = false, includeFirstColumnInMerge = false) => {
    let cellsHtml = cellOptions.map((cellOption, index) => {
        // Pass column width to textOptionsBuilder for font size calculation
        let html = textOptionsBuilder(cellOption.textOptions, columnWidths[index]);

        if (html.trim() === "") {
            html = "&nbsp;"; // Non-breaking space for empty cells
        }

        // Extract font size from the HTML to calculate padding
        let fontSize = 9.5; // Default
        const fontSizeMatch = html.match(/data-font-size="([^"]+)"/);
        if (fontSizeMatch) {
            fontSize = parseFloat(fontSizeMatch[1]);
        }

        // Calculate dynamic padding based on font size
        const padding = calculatePadding(fontSize);

        // Allow sentence wrapping but prevent word breaking/hyphenation with dynamic padding
        let cellStyle = `padding: ${padding}px ${padding + 2}px; 
                        border: 1px solid #000; 
                        vertical-align: top; 
                        width: ${columnWidths[index] || 'auto'}; 
                        max-width: ${columnWidths[index] || 'auto'}; 
                        word-wrap: normal;
                        overflow-wrap: normal;
                        word-break: keep-all;
                        hyphens: none;
                        -webkit-hyphens: none;
                        -moz-hyphens: none;
                        -ms-hyphens: none;
                        white-space: normal;
                        page-break-inside: avoid;
                        box-sizing: border-box;`;
        
        if (cellOption.color) {
            const colorMap = {
                'headerGray': '#999999',
                'subHeaderGray': '#CCCCCC', 
                'columnGray': '#F2F2F2'
            };
            const bgColor = colorMap[cellOption.color] || cellOption.color;
            cellStyle += ` background-color: ${bgColor};`;
        }

        // Remove the data-font-size attribute from the final HTML
        html = html.replace(/data-font-size="[^"]+"\s*/g, '');

        return `<td style="${cellStyle}">${html}</td>`;
    });

    if (mergeCells) {
        cellsHtml = cellsHtml.filter((cell) => !cell.includes(">&nbsp;<"));
        
        if (includeFirstColumnInMerge) {
            // Merge all cells including the first column
            const totalWidth = columnWidths.reduce((sum, width) => sum + parseFloat(width), 0) + '%';
            const combinedContent = cellOptions.map((opt, index) => 
                textOptionsBuilder(opt.textOptions, totalWidth)
            ).filter(content => content.trim() !== "").join(', ');
            
            // Extract font size for merged cell padding
            let fontSize = 9.5;
            const fontSizeMatch = combinedContent.match(/data-font-size="([^"]+)"/);
            if (fontSizeMatch) {
                fontSize = parseFloat(fontSizeMatch[1]);
            }
            const padding = calculatePadding(fontSize);
            
            const cellStyle = `padding: ${padding}px ${padding + 2}px; 
                             border: 1px solid #000; 
                             vertical-align: top; 
                             width: ${totalWidth}; 
                             max-width: ${totalWidth}; 
                             word-wrap: normal;
                             overflow-wrap: normal;
                             word-break: keep-all;
                             hyphens: none;
                             -webkit-hyphens: none;
                             -moz-hyphens: none;
                             -ms-hyphens: none;
                             white-space: normal;
                             box-sizing: border-box; 
                             page-break-inside: avoid;`;
            let bgColor = '';
            if (cellOptions[0]?.color) {
                const colorMap = {
                    'headerGray': '#999999',
                    'subHeaderGray': '#CCCCCC', 
                    'columnGray': '#F2F2F2'
                };
                bgColor = ` background-color: ${colorMap[cellOptions[0].color] || cellOptions[0].color};`;
            }
            
            const cleanContent = combinedContent.replace(/data-font-size="[^"]+"\s*/g, '');
            cellsHtml = [`<td colspan="${cellOptions.length}" style="${cellStyle}${bgColor}">${cleanContent}</td>`];
        } else {
            // Keep first column separate, merge the rest
            const firstCell = cellsHtml[0];
            const restWidth = columnWidths.slice(1).reduce((sum, width) => sum + parseFloat(width), 0) + '%';
            const restContent = cellOptions.slice(1).map((opt, index) => 
                textOptionsBuilder(opt.textOptions, restWidth)
            ).filter(content => content.trim() !== "").join(', ');
            
            // Extract font size for merged cell padding
            let fontSize = 9.5;
            const fontSizeMatch = restContent.match(/data-font-size="([^"]+)"/);
            if (fontSizeMatch) {
                fontSize = parseFloat(fontSizeMatch[1]);
            }
            const padding = calculatePadding(fontSize);
            
            const restCellStyle = `padding: ${padding}px ${padding + 2}px; 
                                 border: 1px solid #000; 
                                 vertical-align: top; 
                                 width: ${restWidth}; 
                                 max-width: ${restWidth}; 
                                 word-wrap: normal;
                                 overflow-wrap: normal;
                                 word-break: keep-all;
                                 hyphens: none;
                                 -webkit-hyphens: none;
                                 -moz-hyphens: none;
                                 -ms-hyphens: none;
                                 white-space: normal;
                                 box-sizing: border-box; 
                                 page-break-inside: avoid;`;
            let bgColor = '';
            if (cellOptions[1]?.color) {
                const colorMap = {
                    'headerGray': '#999999',
                    'subHeaderGray': '#CCCCCC', 
                    'columnGray': '#F2F2F2'
                };
                bgColor = ` background-color: ${colorMap[cellOptions[1].color] || cellOptions[1].color};`;
            }
            
            const cleanContent = restContent.replace(/data-font-size="[^"]+"\s*/g, '');
            cellsHtml = [firstCell, `<td colspan="${cellOptions.length - 1}" style="${restCellStyle}${bgColor}">${cleanContent}</td>`];
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


