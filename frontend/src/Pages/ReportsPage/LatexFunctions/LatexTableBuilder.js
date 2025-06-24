export const generateColumnFormatViaRatioArray = (ratioArray) => {
    const totalRatio = ratioArray.reduce((sum, ratio) => sum + ratio, 0);
    const lineWidthRatio = 0.95;
    const numColumns = ratioArray.length;
    const numVerticalLines = numColumns + 1; // Lines between columns + 2 outer lines

    // Each vertical line is approximately 0.4pt ≈ 0.014cm
    const verticalLineWidth = `${numVerticalLines * 0.4}pt`;

    const columnFormat = ratioArray
        .map((ratio) => {
            const widthRatio = (ratio / totalRatio).toFixed(4);
            const ratioToUse = lineWidthRatio * widthRatio;
            return `>{\\raggedright\\arraybackslash}p{\\dimexpr${ratioToUse}\\linewidth-2\\tabcolsep-${verticalLineWidth}/${numColumns}\\relax}`;
        })
        .join('|');

    return `|${columnFormat}|`;
};

export const cellOptionsBuilder = (text, bold, size, color) => {
    return {
        text: text,
        bold: bold,
        size: size,
        color: color
    }
}

export const cellRowBuilder = (cellFormatArray, columnFormat) => {
    console.log(cellFormatArray)
    const cellFormat = cellFormatArray.map((cellOptions) => {
        console.log(cellOptions.text)
        var latex = addBreaks(sanitizeLatex(cellOptions.text));

        if (cellOptions.bold) {
            latex = String.raw`\textbf{${latex}}`
        }

        if (cellOptions.size) {
            console.log(cellOptions.size);
            const textSize = '\\' + cellOptions.size + '{';
            latex = textSize + latex + "}"
        }

        if (cellOptions.color) {
            const cellColor = '\\cellcolor{' + cellOptions.color + '}';
            latex = cellColor + latex;
        }

        return latex;
    }).join(' & ');

    return String.raw`
    \begin{tabular}{${columnFormat}}
    \hline
    ${cellFormat} \\
    \hline
    \end{tabular}%
    \vspace{-1pt}
    `;
}

const sanitizeLatex = (text) => {
    if (typeof text !== 'string') return text; // Return as-is if not a string

    // Replace special LaTeX characters with their escaped versions using String.raw
    return String.raw`${text
        .replace(/\\/g, '\\textbackslash{}') // Backslash
        .replace(/{/g, '\\{')               // Left curly brace
        .replace(/}/g, '\\}')               // Right curly brace
        .replace(/\$/g, '\\$')              // Dollar sign
        .replace(/&/g, '\\&')               // Ampersand
        .replace(/%/g, '\\%')               // Percent sign
        .replace(/#/g, '\\#')               // Hash
        .replace(/_/g, '\\_')               // Underscore
        .replace(/\^/g, '\\textasciicircum{}') // Caret
        .replace(/~/g, '\\textasciitilde{}')  // Tilde
        }`;
};

const addBreaks = (text) => {
    if (typeof text !== 'string') return text; // Return as-is if not a string

    // Replace specific characters with their LaTeX \allowbreak equivalents
    return String.raw`${text}`
        .replace(/,/g, ',\\hspace{0pt}')   // Comma
        .replace(/\./g, '.\\hspace{0pt}') // Period
        .replace(/-/g, '-\\hspace{0pt}')  // Hyphen
        .replace(/\//g, '/\\hspace{0pt}') // Forward slash
        .replace(/:/g, ':\\hspace{0pt}') // Colon
        .replace(/;/g, ';\\hspace{0pt}') // Semicolon
        .replace(/_/g, '_\\hspace{0pt}') // Underscore
        .replace(/=/g, '=\\hspace{0pt}') // Equal
        .replace(/&/g, '&\\hspace{0pt}') // Ampersand
        .replace(/\?/g, '?\\hspace{0pt}') // Question mark
        .replace(/(?<!\\hspace\{[^}]*)\d(?!pt)/g, '$&\\hspace{0pt}'); // Digit not in \hspace{}
};