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
            latex = `\\fontsize{${textOption.size}}{${textOption.size * 1.2}}\\selectfont{${latex}}`;
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

    // First, escape all special LaTeX characters except backslash
    let sanitized = String.raw`${text
        .replace(/{/g, '\\{')               // Left curly brace
        .replace(/}/g, '\\}')               // Right curly brace
        .replace(/\$/g, '\\$')              // Dollar sign
        .replace(/&/g, '\\&')               // Ampersand
        .replace(/%/g, '\\%')               // Percent sign
        .replace(/#/g, '\\#')               // Hash
        .replace(/\^/g, '\\textasciicircum{}') // Caret
        .replace(/~/g, '\\textasciitilde{}')  // Tilde
        .replace(/\|/g, '\\textbar{}')      // Vertical bar
        .replace(/</g, '\\textless{}')       // Less than
        .replace(/>/g, '\\textgreater{}')    // Greater than
        .replace(/\[/g, '{[}')                // Left square bracket (as literal)
        .replace(/\]/g, '{]}')                // Right square bracket (as literal)
        // Do NOT replace quotes or apostrophes
        .replace(/@/g, '\\textat{}')         // At symbol (requires textcomp)
        .replace(/¡/g, '{\\textexclamdown}') // Inverted exclamation
        .replace(/¿/g, '{\\textquestiondown}') // Inverted question
        .replace(/€/g, '{\\euro}')           // Euro (requires eurosym)
        .replace(/©/g, '{\\copyright}')      // Copyright
        .replace(/®/g, '{\\textregistered}') // Registered trademark
        .replace(/™/g, '{\\texttrademark}')  // Trademark
        .replace(/…/g, '{\\ldots}')          // Ellipsis
        .replace(/–/g, '{\\textendash}')     // En dash
        .replace(/—/g, '{\\textemdash}')     // Em dash
        .replace(/•/g, '{\\textbullet}')     // Bullet
        .replace(/°/g, '{\\degree}')         // Degree (requires gensymb)
        .replace(/§/g, '{\\S}')              // Section
        .replace(/¶/g, '{\\P}')              // Paragraph
        .replace(/½/g, '{\\frac{1}{2}}')     // 1/2
        .replace(/¼/g, '{\\frac{1}{4}}')     // 1/4
        .replace(/¾/g, '{\\frac{3}{4}}')     // 3/4
        .replace(/±/g, '{\\pm}')             // Plus-minus
        .replace(/×/g, '{\\times}')          // Multiplication
        .replace(/÷/g, '{\\div}')            // Division
        .replace(/†/g, '{\\dag}')            // Dagger
        .replace(/‡/g, '{\\ddag}')           // Double dagger
        .replace(/µ/g, '{\\mu}')             // Micro
        .replace(/¢/g, '{\\textcent}')       // Cent (requires textcomp)
        .replace(/£/g, '{\\pounds}')         // Pound (requires textcomp)
        .replace(/ƒ/g, '{\\textflorin}')     // Florin (requires textcomp)
        .replace(/‰/g, '{\\textperthousand}')// Per thousand (requires textcomp)
        .replace(/¨/g, '{\\textasciidieresis}') // Diaeresis
        .replace(/´/g, '{\\textasciiacute}') // Acute accent
        .replace(/¸/g, '{\\c{}}')            // Cedilla
        .replace(/¯/g, '{\\={}}')            // Macron
        .replace(/ˇ/g, '{\\v{}}')            // Caron
        .replace(/˘/g, '{\\u{}}')            // Breve
        .replace(/˚/g, '{\\r{}}')            // Ring above
        .replace(/˙/g, '{\\.{} }')           // Dot above
        .replace(/˝/g, '{\\H{}}')            // Double acute
        .replace(/˛/g, '{\\k{}}')            // Ogonek
        .replace(/ˉ/g, '{\\textasciimacron}')// Macon
        .replace(/ˋ/g, '{\\textgrave}')      // Grave accent
        .replace(/ˊ/g, '{\\textacute}')      // Acute accent
        .replace(/˴/g, '{\\textasciibreve}') // Breve
        .replace(/˵/g, '{\\textasciicaron}') // Caron
        .replace(/˶/g, '{\\textasciidieresis}') // Diaeresis
        .replace(/˷/g, '{\\textasciitilde}') // Tilde
        .replace(/˸/g, '{\\textcolonmonetary}') // Colon monetary
        .replace(/˹/g, '{\\textlbrackdbl}')  // Left double bracket
        .replace(/˺/g, '{\\textrbrackdbl}')  // Right double bracket
    }`;

    // Now, replace all Unicode Greek letters with LaTeX commands (e.g., α -> \beta)
    const greekMap = {
        'α': '\\beta', 'β': '\\beta', 'γ': '\\gamma', 'δ': '\\delta', 'ε': '\\epsilon', 'ζ': '\\zeta', 'η': '\\eta', 'θ': '\\theta', 'ι': '\\iota', 'κ': '\\kappa', 'λ': '\\lambda', 'μ': '\\mu', 'ν': '\\nu', 'ξ': '\\xi', 'ο': 'o', 'π': '\\pi', 'ρ': '\\rho', 'σ': '\\sigma', 'τ': '\\tau', 'υ': '\\upsilon', 'φ': '\\phi', 'χ': '\\chi', 'ψ': '\\psi', 'ω': '\\omega',
        'Α': '\\Alpha', 'Β': '\\Beta', 'Γ': '\\Gamma', 'Δ': '\\Delta', 'Ε': '\\Epsilon', 'Ζ': '\\Zeta', 'Η': '\\Eta', 'Θ': '\\Theta', 'Ι': '\\Iota', 'Κ': '\\Kappa', 'Λ': '\\Lambda', 'Μ': '\\Mu', 'Ν': '\\Nu', 'Ξ': '\\Xi', 'Ο': 'O', 'Π': '\\Pi', 'Ρ': '\\Rho', 'Σ': '\\Sigma', 'Τ': '\\Tau', 'Υ': '\\Upsilon', 'Φ': '\\Phi', 'Χ': '\\Chi', 'Ψ': '\\Psi', 'Ω': '\\Omega'
    };
    sanitized = sanitized.replace(/[α-ωΑ-Ω]/g, (match) => greekMap[match] || match);

    // Only wrap true math commands in $...$
    const mathCommands = [
        'alpha','beta','gamma','delta','epsilon','zeta','eta','theta','iota','kappa','lambda','mu','nu','xi','pi','rho','sigma','tau','upsilon','phi','chi','psi','omega',
        'Gamma','Delta','Theta','Lambda','Xi','Pi','Sigma','Upsilon','Phi','Psi','Omega',
        'pm','times','div','dag','ddag','frac','int','sum','prod','lim','infty','leq','geq','neq','approx','sim','to','rightarrow','leftarrow','leftrightarrow','cdot','ldots','cdots','dots',
        'vec','tilde','bar','hat','dot','ddot','underline','overline','degree','pm','mp','ast','star','circ','bullet','oplus','ominus','otimes','oslash','odot','bigcirc','triangleleft','triangleright','bigtriangleup','bigtriangledown','wedge','vee','cap','cup','uplus','sqcap','sqcup','amalg','bigwedge','bigvee','bigcap','bigcup','biguplus','bigsqcap','bigsqcup','coprod','prod','sum','int','oint','varnothing','emptyset','nabla','surd','partial','forall','exists','neg','implies','impliedby','iff','because','therefore','mapsto','to','gets','leftarrow','rightarrow','uparrow','downarrow','updownarrow','Leftarrow','Rightarrow','Uparrow','Downarrow','Updownarrow','longleftarrow','longrightarrow','longleftrightarrow','Longleftarrow','Longrightarrow','Longleftrightarrow','hookleftarrow','hookrightarrow','leftharpoonup','leftharpoondown','rightharpoonup','rightharpoondown','rightleftharpoons','mapsto','longmapsto','leadsto','nearrow','searrow','swarrow','nwarrow','ldots','cdots','vdots','ddots','aleph','hbar','imath','jmath','ell','wp','Re','Im','mho','prime','emptyset','nabla','surd','top','bot','angle','triangle','backslash','Box','Diamond','clubsuit','diamondsuit','heartsuit','spadesuit','flat','natural','sharp','checkmark','maltese','ell','wp','Re','Im','mho','prime','emptyset','nabla','surd','top','bot','angle','triangle','backslash','Box','Diamond','clubsuit','diamondsuit','heartsuit','spadesuit','flat','natural','sharp','checkmark','maltese'
    ];
    sanitized = sanitized.replace(/\\([a-zA-Z]+)([\w{}^_\d]*)/g, (match, cmd, rest) => {
        if (mathCommands.includes(cmd)) {
            return `$${match}$`;
        }
        return match;
    });

    // Subscripts and superscripts: wrap with $...$ if not already in math mode
    sanitized = sanitized.replace(/([a-zA-Z0-9])_([a-zA-Z0-9]+)/g, '$$$1_$2$');
    sanitized = sanitized.replace(/([a-zA-Z0-9])\^([a-zA-Z0-9]+)/g, '$$$1^$2$');

    return sanitized;
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