import { toCanvas, toPng } from 'html-to-image';
import jsPDF from 'jspdf';

/**
 * PDF Canvas Sanitizer & Generator Utility
 * Powered by html-to-image (SVG foreignObject) & jsPDF.
 * Eliminates html2canvas "Unable to find element in cloned iframe" and Tailwind v4 oklch() color issues.
 */

export const sanitizeClonedDocForCanvas = (clonedDoc: Document, targetId?: string) => {
  // Hide all .no-print elements
  clonedDoc.querySelectorAll('.no-print').forEach((el) => {
    const htmlEl = el as HTMLElement;
    if (htmlEl && htmlEl.style) {
      htmlEl.style.display = 'none';
      htmlEl.style.visibility = 'hidden';
      htmlEl.style.height = '0px';
      htmlEl.style.overflow = 'hidden';
    }
  });

  // Reset any parent zoom/scale transforms in preview containers
  clonedDoc.querySelectorAll('*').forEach((node) => {
    const htmlEl = node as HTMLElement;
    if (htmlEl && htmlEl.style && htmlEl.style.transform && htmlEl.style.transform.includes('scale')) {
      htmlEl.style.transform = 'none';
    }
  });

  // Ensure target element is visible and styled as a standard document
  if (targetId) {
    const targetEl = clonedDoc.getElementById(targetId);
    if (targetEl) {
      targetEl.style.display = 'block';
      targetEl.style.visibility = 'visible';
      targetEl.style.opacity = '1';
      targetEl.style.backgroundColor = '#ffffff';
      targetEl.style.color = '#0f172a';
      targetEl.style.transform = 'none';
      
      const isA5 = targetEl.getAttribute('data-paper-size') === 'A5';
      targetEl.style.width = isA5 ? '148mm' : '210mm';
      targetEl.style.maxWidth = '100%';
      targetEl.style.margin = '0 auto';
      targetEl.style.boxSizing = 'border-box';
    }
  }
};

/**
 * Downloads a jsPDF instance as a Blob in browser / iframe environments
 */
const savePdfBlob = (pdf: jsPDF, pdfFileName: string) => {
  const pdfBlob = pdf.output('blob');
  const blobUrl = URL.createObjectURL(pdfBlob);
  
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = pdfFileName;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  
  setTimeout(() => {
    if (document.body.contains(link)) {
      document.body.removeChild(link);
    }
    URL.revokeObjectURL(blobUrl);
  }, 10000);
};

/**
 * Converts a raster image data URL into a multi-page A4/A5 jsPDF document
 * with precise page bounds and dynamic Page X of Y stamping.
 */
const buildPdfFromImageData = (
  imgData: string,
  imgWidthPx: number,
  imgHeightPx: number,
  paper: 'a4' | 'a5' | 'thermal',
  isLandscape: boolean,
  pdfFileName: string,
  docTitle?: string
) => {
  if (paper === 'thermal') {
    const pageWidth = 80;
    const pageHeight = Math.max(80, Math.ceil((imgHeightPx * pageWidth) / imgWidthPx) + 5);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [pageWidth, pageHeight]
    });
    pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, (imgHeightPx * pageWidth) / imgWidthPx, undefined, 'FAST');
    savePdfBlob(pdf, pdfFileName);
    return;
  }

  const pageWidth = paper === 'a5' ? (isLandscape ? 210 : 148) : (isLandscape ? 297 : 210);
  const pageHeight = paper === 'a5' ? (isLandscape ? 148 : 210) : (isLandscape ? 210 : 297);

  const pdf = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: paper
  });

  const imgWidthMm = pageWidth;
  const imgHeightMm = (imgHeightPx * imgWidthMm) / imgWidthPx;
  
  // Calculate total pages
  const totalPages = Math.max(1, Math.ceil(imgHeightMm / pageHeight));
  let heightLeft = imgHeightMm;
  let position = 0;
  let currentPage = 1;

  // Add first page
  pdf.addImage(imgData, 'PNG', 0, position, imgWidthMm, imgHeightMm, undefined, 'FAST');
  
  // Add running footer stamp
  stampPageFooter(pdf, currentPage, totalPages, pageWidth, pageHeight, docTitle);
  
  heightLeft -= pageHeight;

  // Add subsequent pages (up to 20+ pages)
  while (heightLeft > 2) {
    currentPage++;
    position = -(pageHeight * (currentPage - 1));
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidthMm, imgHeightMm, undefined, 'FAST');
    stampPageFooter(pdf, currentPage, totalPages, pageWidth, pageHeight, docTitle);
    heightLeft -= pageHeight;
  }

  savePdfBlob(pdf, pdfFileName);
};

/**
 * Stamps a clean, professional UAE FTA standard Page X of Y footer on each PDF page
 */
const stampPageFooter = (
  pdf: jsPDF, 
  pageNum: number, 
  totalPages: number, 
  pageWidth: number, 
  pageHeight: number,
  docTitle?: string
) => {
  if (totalPages <= 1) return; // Keep clean on single-page docs
  try {
    pdf.setFontSize(7.5);
    pdf.setTextColor(148, 163, 184); // Slate-400
    
    // Left: Brand / Title
    const leftText = docTitle ? `${docTitle} • Hisaab Pro UAE FTA Standard` : 'Hisaab Pro • UAE FTA Standard Compliance';
    pdf.text(leftText, 10, pageHeight - 4);
    
    // Right: Page X of Y
    const rightText = `Page ${pageNum} of ${totalPages}`;
    pdf.text(rightText, pageWidth - 25, pageHeight - 4);
  } catch (e) {
    // ignore
  }
};

/**
 * Multi-Sheet PDF Generator
 * Renders each .multi-page-doc-sheet individually for 100% pixel-perfect page boundaries
 */
const renderMultiSheetDocToPdf = async (
  sheets: HTMLElement[],
  paper: 'a4' | 'a5' | 'thermal',
  isLandscape: boolean,
  pdfFileName: string,
  docTitle?: string
): Promise<boolean> => {
  if (paper === 'thermal') {
    // Thermal is continuous single roll
    return false;
  }
  const pageWidth = paper === 'a5' ? (isLandscape ? 210 : 148) : (isLandscape ? 297 : 210);
  const pageHeight = paper === 'a5' ? (isLandscape ? 148 : 210) : (isLandscape ? 210 : 297);

  const pdf = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: paper
  });

  const totalSheets = sheets.length;

  for (let i = 0; i < totalSheets; i++) {
    const sheet = sheets[i];
    if (i > 0) {
      pdf.addPage();
    }

    try {
      const res = await renderElementWithHtmlToImage(sheet, false);
      const imgWidthMm = pageWidth;
      const imgHeightMm = (res.height * imgWidthMm) / res.width;
      
      pdf.addImage(res.dataUrl, 'PNG', 0, 0, imgWidthMm, Math.min(imgHeightMm, pageHeight), undefined, 'FAST');
    } catch (e) {
      // Fallback with skipFonts
      const res = await renderElementWithHtmlToImage(sheet, true);
      const imgWidthMm = pageWidth;
      const imgHeightMm = (res.height * imgWidthMm) / res.width;
      pdf.addImage(res.dataUrl, 'PNG', 0, 0, imgWidthMm, Math.min(imgHeightMm, pageHeight), undefined, 'FAST');
    }
  }

  savePdfBlob(pdf, pdfFileName);
  return true;
};

/**
 * Primary Canvas/PNG Generator using html-to-image
 */
const renderElementWithHtmlToImage = async (
  element: HTMLElement,
  skipFonts = false
): Promise<{ dataUrl: string; width: number; height: number }> => {
  // Temporary style adjustments on element if scaled
  const prevTransform = element.style.transform;
  if (prevTransform && prevTransform.includes('scale')) {
    element.style.transform = 'none';
  }

  try {
    const filterFn = (domNode: HTMLElement) => {
      if (domNode.classList && domNode.classList.contains('no-print')) {
        return false;
      }
      return true;
    };

    const canvas = await toCanvas(element, {
      pixelRatio: 2.0,
      backgroundColor: '#ffffff',
      filter: filterFn,
      skipFonts,
      cacheBust: true,
    });

    const dataUrl = canvas.toDataURL('image/png');
    return {
      dataUrl,
      width: canvas.width,
      height: canvas.height
    };
  } finally {
    if (prevTransform) {
      element.style.transform = prevTransform;
    }
  }
};

/**
 * Universal PDF Generator & Downloader
 * Guarantees crisp multi-page A4/A5 PDF generation and direct file download in iframe/sandbox environments.
 */
export const generateAndDownloadPDF = async (
  element: HTMLElement,
  fileName: string,
  options?: { targetId?: string; isLandscape?: boolean; paperSize?: 'a4' | 'a5' | 'thermal'; docTitle?: string }
): Promise<boolean> => {
  const paper = options?.paperSize || 'a4';
  const isLandscape = options?.isLandscape || false;
  const docTitle = options?.docTitle || fileName.replace(/[_-]/g, ' ');
  const pdfFileName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
  const pageWidth = paper === 'a5' ? (isLandscape ? 210 : 148) : (isLandscape ? 297 : 210);

  // Check for explicit multi-sheet structure
  const multiSheets = Array.from(element.querySelectorAll('.multi-page-doc-sheet')) as HTMLElement[];
  if (multiSheets.length > 1) {
    try {
      return await renderMultiSheetDocToPdf(multiSheets, paper, isLandscape, pdfFileName, docTitle);
    } catch (sheetErr) {
      console.warn("Multi-sheet individual render failed, falling back to full-canvas generation:", sheetErr);
    }
  }

  // 1. Primary Attempt: High fidelity html-to-image with embedded fonts
  try {
    const res = await renderElementWithHtmlToImage(element, false);
    buildPdfFromImageData(res.dataUrl, res.width, res.height, paper, isLandscape, pdfFileName, docTitle);
    return true;
  } catch (err1) {
    console.warn("Primary html-to-image font embedding failed, retrying with system fonts:", err1);

    // 2. Secondary Attempt: html-to-image with skipFonts (avoids CORS webfont blocks)
    try {
      const res = await renderElementWithHtmlToImage(element, true);
      buildPdfFromImageData(res.dataUrl, res.width, res.height, paper, isLandscape, pdfFileName, docTitle);
      return true;
    } catch (err2) {
      console.warn("Secondary html-to-image failed, trying direct toPng method:", err2);

      // 3. Tertiary Attempt: Direct toPng
      try {
        const dataUrl = await toPng(element, {
          pixelRatio: 2.0,
          backgroundColor: '#ffffff',
          filter: (node) => !(node instanceof HTMLElement && node.classList.contains('no-print')),
          skipFonts: true
        });

        // Load image to get true pixel dimensions
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = reject;
          img.src = dataUrl;
        });

        buildPdfFromImageData(dataUrl, img.width || 800, img.height || 1130, paper, isLandscape, pdfFileName, docTitle);
        return true;
      } catch (err3) {
        console.warn("Direct toPng failed, initiating jsPDF vector fallback:", err3);

        // 4. Quaternary Attempt: jsPDF html vector renderer
        try {
          const pdf = new jsPDF({
            orientation: isLandscape ? 'landscape' : 'portrait',
            unit: 'mm',
            format: paper
          });

          await new Promise<void>((resolve, reject) => {
            pdf.html(element, {
              callback: (doc) => {
                savePdfBlob(doc, pdfFileName);
                resolve();
              },
              x: 5,
              y: 5,
              width: paper === 'a5' ? 138 : 200,
              windowWidth: 800,
              autoPaging: 'text'
            }).catch(reject);
          });

          return true;
        } catch (vectorError) {
          console.error("Vector PDF fallback failed, exporting structured text document:", vectorError);

          // 5. Final Safety Net: Plain text document
          try {
            const pdf = new jsPDF({
              orientation: isLandscape ? 'landscape' : 'portrait',
              unit: 'mm',
              format: paper
            });
            pdf.setFontSize(10);
            const textLines = pdf.splitTextToSize(element.innerText || 'Document Export', pageWidth - 20);
            pdf.text(textLines, 10, 15);
            savePdfBlob(pdf, pdfFileName);
            return true;
          } catch (finalError) {
            console.error("All PDF generation pathways failed:", finalError);
            return false;
          }
        }
      }
    }
  }
};
