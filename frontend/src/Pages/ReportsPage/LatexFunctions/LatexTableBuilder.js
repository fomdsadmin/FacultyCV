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

        if (!textOption.text || textOption.text === 'undefined' || textOption.text === 'null') {
            return "";
        }

        let latex = addBreaks(sanitizeLatex(String(textOption.text)));

        if (textOption.bold) {
            latex = String.raw`\textbf{${latex}}`
        }

        if (textOption.size) {
            console.log(textOption.size);
            latex = `\\fontsize{${textOption.size}}\\selectfont{${latex}}`;
        }

        if (textOption.link) {
            latex = String.raw`\href{${textOption.link}}{${latex}}`
        }

        return latex;
    }).filter((text) => text.trim() !== "");

    return processedTexts.join(', ');
}

export const cellRowBuilder = (cellOptions, columnFormat, mergeCells = false, includeFirstColumnInMerge = false) => {
    console.log(cellOptions)
    let cellFormat = cellOptions.map((cellOption) => {
        console.log(cellOption.text)

        var latex = textOptionsBuilder(cellOption.textOptions);

        if (latex.trim() === "") {
            return "";
        }

        if (cellOption.color) {
            const cellColor = '\\cellcolor{' + cellOption.color + '}';
            latex = cellColor + latex;
        }
        return latex;
    });

    if (mergeCells) {
            cellFormat = cellFormat.filter((text) => text.trim() !== "");
        if (includeFirstColumnInMerge) {
            // Merge all cells including the first column (row number)
            cellFormat = cellFormat.join(', ');
        } else {
            // Keep first column separate, merge the rest
            const firstColumn = cellFormat[0];
            const mergedRest = cellFormat.slice(1).join(', ');
            cellFormat = firstColumn + ' & ' + mergedRest;
        }
    } else {
        cellFormat = cellFormat.join(' & ');
    }

    return String.raw`
    \begin{tabular}{${columnFormat}}
    \hline
    ${cellFormat} \\
    \hline
    \end{tabular}%
    \vspace{-1pt}
    `;
}

export const sanitizeLatex = (text) => {
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

export const addBreaks = (text) => {
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