import { jsPDF } from 'jspdf';
import { PDF_TEMPLATE_BG_BASE64 } from '../assets/pdfTemplateBg';

// A4 dimensions in mm
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

// Content area safe margins (respecting the template header/footer)
// Header block (logo + contact info) spans ~55mm from top
// Footer black bar occupies ~15mm from bottom
export const TEMPLATE_MARGINS = {
  top: 60,       // mm — safely below the full header block
  bottom: 20,    // mm — above the footer bar
  left: 18,      // mm
  right: 18,     // mm
};

/**
 * Adds the BristleTech branded template background to a single page.
 * The image is drawn full-bleed behind all content.
 */
function addTemplateBackground(doc: jsPDF): void {
  doc.addImage(
    PDF_TEMPLATE_BG_BASE64,
    'PNG',
    0,           // x
    0,           // y
    A4_WIDTH_MM, // width — full page
    A4_HEIGHT_MM,// height — full page
    undefined,
    'FAST'
  );
}

/**
 * Creates a new jsPDF document with the BristleTech template applied to page 1.
 * Use `addTemplatePage(doc)` whenever you call `doc.addPage()`.
 *
 * @returns A configured jsPDF document instance with the template on the first page.
 */
export function createTemplatedDoc(): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Apply template to the first page
  addTemplateBackground(doc);

  return doc;
}

/**
 * Adds a new page to the document and immediately applies the BristleTech template.
 * Call this instead of `doc.addPage()` to keep branding consistent across all pages.
 *
 * @param doc - The jsPDF document instance.
 */
export function addTemplatePage(doc: jsPDF): void {
  doc.addPage();
  addTemplateBackground(doc);
}

/**
 * Applies the BristleTech template background to ALL existing pages in the document.
 * Use this as a post-processing step if the document was built without per-page calls.
 *
 * @param doc - The jsPDF document instance.
 * @param totalPages - The total number of pages in the document.
 */
export function applyTemplateToAllPages(doc: jsPDF, totalPages: number): void {
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addTemplateBackground(doc);
  }
}

/**
 * Checks whether the current Y position would overflow the content area and,
 * if so, adds a new templated page and resets Y to the top margin.
 *
 * @param doc - The jsPDF document instance.
 * @param currentY - The current Y position in mm.
 * @param spaceNeeded - How many mm of space are needed (default 20).
 * @returns The (potentially reset) Y position.
 */
export function checkPageBreak(
  doc: jsPDF,
  currentY: number,
  spaceNeeded: number = 20
): number {
  const maxY = A4_HEIGHT_MM - TEMPLATE_MARGINS.bottom;
  if (currentY + spaceNeeded > maxY) {
    addTemplatePage(doc);
    return TEMPLATE_MARGINS.top;
  }
  return currentY;
}
