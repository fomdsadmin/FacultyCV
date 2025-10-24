import React, { useMemo } from "react";

/**
 * FastTable – React table with AG Grid style column defs
 * Supports mixed columns: groups with children + flat columns
 * Dynamic column widths computed from max content length per column
 */
export default function FastTable({ table }) {
  const {
    columns = [],
    hide_column_header: hideColumnHeader,
    rows = []
  } = table || {};

  // Flatten out child columns while keeping flat columns intact
  const childColumns = columns.flatMap(col =>
    Array.isArray(col.children) ? col.children : [col]
  );

  // helper to extract plain text from various cell shapes
  const flattenCell = (cell) => {
    if (cell == null) return "";
    if (typeof cell === "string" || typeof cell === "number" || typeof cell === "boolean") return String(cell);
    if (Array.isArray(cell)) {
      return cell.map(c => (c && (c.text !== undefined ? c.text : c)).toString()).join("; ");
    }
    if (typeof cell === "object") {
      if (cell.text !== undefined) return String(cell.text);
      if (cell.link !== undefined && cell.text !== undefined) return String(cell.text);
      try { return String(cell); } catch (e) { return ""; }
    }
    return String(cell);
  };

  // compute widths based on max text length per column
  const colWidths = useMemo(() => {
    if (!childColumns || childColumns.length === 0) return [];

    const maxLens = childColumns.map((col) => {
      const headerLen = String(col.headerName ?? col.field ?? "").length;
      let maxLen = headerLen;
      for (let r = 0; r < rows.length; r++) {
        const raw = rows[r] && (rows[r][col.field] !== undefined) ? rows[r][col.field] : "";
        const txt = flattenCell(raw);
        if (txt.length > maxLen) maxLen = txt.length;
      }
      return Math.max(1, maxLen);
    });

    // compute proportional widths
    const total = maxLens.reduce((s, v) => s + v, 0) || 1;
    // constraints
    const minPercent = 5; // minimum column width percent
    const maxPercent = 60; // maximum column width percent

    // initial percentages
    let percents = maxLens.map((l) => (l / total) * 100);

    // clamp and re-normalize
    percents = percents.map((p) => Math.max(minPercent, Math.min(maxPercent, p)));

    // fix rounding to sum to 100
    const sumP = percents.reduce((s, v) => s + v, 0);
    if (sumP !== 0) {
      percents = percents.map((p) => (p / sumP) * 100);
    }

    return percents; // array aligned with childColumns
  }, [childColumns, rows]);

  // helper to render a cell with break opportunities at backslashes and allow hyphenation
  const renderCell = (cell, key) => {
    const txt = String(flattenCell(cell) ?? "");
    // split at backslash and re-insert backslash + <wbr/> so browser can break there
    const parts = txt.split("\\");
    if (parts.length === 1) return txt;
    return parts.map((part, i) => (
      <React.Fragment key={`${key}-${i}`}>
        {part}
        {i < parts.length - 1 && (
          <>
            {"\\"}
            <wbr />
          </>
        )}
      </React.Fragment>
    ));
  };

  const hasGroups = columns.some(col => Array.isArray(col.children));

  return (
    <div
      style={{
        width: "210mm",
        maxWidth: "210mm",
        margin: "0 auto",
        overflowX: "auto",
        boxSizing: "border-box",
        pageBreakInside: "avoid",
        breakInside: "avoid",
        pageBreakAfter: "always"
      }}
    >
      <table
        lang="en"
        style={{
          borderCollapse: "collapse",
          width: "100%",
          tableLayout: "auto", // let browser size columns based on content
          fontFamily: "sans-serif",
          wordBreak: "normal",           // do not split characters arbitrarily
           hyphens: "auto",
           WebkitHyphens: "auto",
           MozHyphens: "auto"
         }}
       >
        {/* remove colgroup so browser auto-sizes columns */}

        {!hideColumnHeader && (
          <thead>
            {hasGroups && (
              <tr>
                {columns.map((col, i) => (
                  <th
                    key={i}
                    colSpan={Array.isArray(col.children) ? col.children.length : 1}
                    className={col.headerClass || ""}
                    style={{
                      border: "1px solid #ccc",
                      padding: "8px",
                      background: "#f2f2f2",
                      textAlign: "center",
                      hyphens: "auto"
                    }}
                  >
                    {col.headerName}
                  </th>
                ))}
              </tr>
            )}

            <tr>
              {columns.flatMap(col => Array.isArray(col.children) ? col.children : [col])
                .map((col, i) => (
                <th
                  key={i}
                  className={col.headerClass || ""}
                  style={{
                    border: "1px solid #ccc",
                    padding: "8px",
                    background: "#fafafa",
                    textAlign: "left",
                    whiteSpace: "normal",
                    overflowWrap: "break-word", // allow wrapping at word boundaries
                    wordBreak: "normal",        // avoid splitting numbers/words into characters
                    hyphens: "auto"
                  }}
                >
                  {col.headerName}
                </th>
              ))}
            </tr>
          </thead>
        )}

        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {columns.flatMap(col => Array.isArray(col.children) ? col.children : [col])
                .map((col, colIndex) => (
                <td
                  key={colIndex}
                  style={{
                    border: "1px solid #ccc",
                    padding: "8px",
                    ...(col.cellStyle || {}),
                    whiteSpace: "normal",
                    overflowWrap: "break-word", // prefer breaking at word boundaries
                    wordBreak: "normal",        // do not force-break digits/words into chars
                    hyphens: "auto"
                  }}
                >
                  {renderCell(row[col.field], `${rowIndex}-${colIndex}`)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
