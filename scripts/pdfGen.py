from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
from reportlab.lib.units import inch

# Define page size and margins
PAGE_WIDTH, PAGE_HEIGHT = letter
LEFT_MARGIN = 0.1 * PAGE_WIDTH  # 10% of page width as left margin
RIGHT_MARGIN = 0.1 * PAGE_WIDTH  # 10% of page width as right margin
TABLE_WIDTH = PAGE_WIDTH - LEFT_MARGIN - RIGHT_MARGIN  # Width available for the tables
CELL_WIDTH_FACTOR = 0.12 # Adjust this to match the kind of font so that fit-content in a tables works right

table_style_1 = TableStyle([('BACKGROUND', (0, 0), (-1, -1), colors.transparent),
                              ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
                              ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                              ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
                              ('GRID', (0, 0), (-1, -1), 1, colors.black)
                          ])
    
section_1_data = [
            ['1.', 'SURNAME:', '            ', 'FIRST NAME:', '         '],
            ['', '', '', 'MIDDLE NAME(S):', '           ']
        ]
section_1_widths = ['fit-content', 'fit-content', '', 'fit-content', '']

section_2_3_data = [
        ['2.', 'DEPARTMENT/DIVISION:', 'Medicine -          '],
        ['3.', 'FACULTY:', 'Medicine']
    ]
section_2_3_widths = ['fit-content', 'fit-content', '']

# Function to specify column widths
# Percentages content options - 
# integer between 0 and 100 -> percentage of total available table width after considering all fit-content columns
# string 'fit-content' -> fits to the columns content
# default: split the remaining width evenly among all the remaining columns
def calculate_column_widths(data, percentages):
    num_cols = len(data[0])
    if num_cols != len(percentages):
        raise Exception('Percentages not specified correctly, num_cols != len(percentages)')
    col_widths = [ 0 for i in percentages ]
    width_covered = 0
    for i in range(len(percentages)):
        item = percentages[i]
        if item == 'fit-content':
            width = 0
            for row in data:
                width = max(len(row[i]) * CELL_WIDTH_FACTOR * inch, width)
            width_covered += width
            col_widths[i] = width
    for i in range(len(percentages)):
        item = percentages[i]
        if type(item) is int:
            width_covered += item/100*(TABLE_WIDTH - width_covered)
            col_widths[i] = item/100*(TABLE_WIDTH - width_covered)
    cols_left = 0        
    for i in range(len(percentages)):
        if col_widths[i] == 0:
            cols_left += 1
    width_per_remaining_col = (TABLE_WIDTH - width_covered)/cols_left
    for i in range(len(percentages)):
        if col_widths[i] == 0:
            col_widths[i] = width_per_remaining_col 
            
    return col_widths

def create_resume():
    # Create a PDF document
    doc = SimpleDocTemplate("resume.pdf", pagesize=letter, leftMargin=LEFT_MARGIN, rightMargin=RIGHT_MARGIN)
    story = []

    # Define styles for paragraphs
    styles = getSampleStyleSheet()
    normal_style = styles['Normal']
    heading_style_2 = styles['Heading2']
    heading_style_3 = styles['Heading3']
    heading_style_4 = styles['Heading4']
    heading_style_2.alignment = 1  # Center alignment for headings
    heading_style_3.alignment = 1  # Center alignment for headings
    heading_style_4.alignment = 1  # Center alignment for headings

    # Add name and contact information
    TITLE = "University of British Columbia"
    SUBTITLE = "Curriculum Vitae for Faculty Members"
    story.append(Paragraph(TITLE, heading_style_2))
    story.append(Paragraph(SUBTITLE, heading_style_4))
    right_align = styles['Heading4'].clone('right-aligned')
    right_align.alignment = 2
    story.append(Paragraph('Date:', right_align))
    story.append(Paragraph('Verification Initial:', right_align))

    story.append(Table(section_1_data, style=table_style_1, colWidths=calculate_column_widths(section_1_data, section_1_widths)))

    story.append(Spacer(1, 12))
    story.append(Table(section_2_3_data, style=table_style_1, colWidths=calculate_column_widths(section_2_3_data, section_2_3_widths)))

    # Build the PDF document
    doc.build(story)

if __name__ == "__main__":
    create_resume()
