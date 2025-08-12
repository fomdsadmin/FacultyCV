# HTML CV Builder

This module provides HTML conversion functionality that exactly replicates the LaTeX CV generation system. The HTML output maintains the same structure, layout, and conditional logic as the original LaTeX implementation.

## Files

- **HtmlTableBuilder.js** - Core table building functions for HTML (equivalent to LatexTableBuilder.js)
- **HtmlBuilder.js** - Main HTML CV builder (equivalent to LatexBuilder.js)  
- **HtmlExporter.js** - Utility functions for exporting/viewing HTML output

## Key Features

### Exact Structure Preservation
- All conditional statements from the LaTeX version are preserved
- Table structure and layout match LaTeX output exactly
- No gaps between table rows (border-collapse: collapse)
- Same data filtering and sorting logic

### Visual Consistency
- Font sizes and styling match LaTeX output
- Color schemes preserved (headerGray, subHeaderGray, columnGray)
- Proper text formatting (bold, links, etc.)
- Responsive column widths based on ratios

### Functionality Mapping

| LaTeX Function | HTML Equivalent | Purpose |
|----------------|-----------------|---------|
| `cellRowBuilder()` | `cellRowBuilder()` | Creates table rows with styling |
| `generateColumnFormatViaRatioArray()` | `generateColumnFormatViaRatioArray()` | Calculates column widths |
| `sanitizeLatex()` | `sanitizeHtml()` | Escapes special characters |
| `textOptions()` | `textOptions()` | Text formatting options |
| `buildLatex()` | `buildHtml()` | Main builder function |

## Usage

```javascript
import { buildHtml } from './HtmlFunctions/HtmlBuilder.js';
import { generateHtmlCV, downloadHtmlCV, previewHtmlCV } from './HtmlFunctions/HtmlExporter.js';

// Generate HTML CV
const htmlContent = await buildHtml(userInfo, template);

// Download as HTML file
await downloadHtmlCV(userInfo, template, 'my-cv.html');

// Preview in new window
await previewHtmlCV(userInfo, template);
```

## Conditional Logic Preservation

All conditional statements that control table structure are preserved:

- **Date Range Filtering**: `filterDateRanges()` - Same logic as LaTeX
- **Section Sorting**: `sortSectionData()` - Identical sorting behavior  
- **Subsection Handling**: `buildSubSections()` - Same conditional rendering
- **Publication Logic**: `buildPublicationRowArray()` - Author bolding and DOI links
- **Row Merging**: `mergeCells` parameter - Same merging behavior
- **Note Display**: `buildNotes()` - Identical conditional note rendering

## Styling

The HTML uses inline styles and a small CSS block to ensure:
- No external dependencies
- Consistent rendering across browsers
- Exact visual match to LaTeX output
- Print-friendly layout

## Differences from LaTeX

The only differences are in implementation details:

1. **Character Escaping**: HTML entities instead of LaTeX commands
2. **Table Structure**: HTML `<table>` tags instead of LaTeX `tabular`
3. **Styling**: CSS styles instead of LaTeX packages
4. **Links**: HTML `<a>` tags instead of LaTeX `\href`

The visual output and data structure remain identical.
