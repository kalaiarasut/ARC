import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export type ExportFormat = 'png' | 'pdf';

export interface MapExportOptions {
  format: ExportFormat;
  /** Title printed on the PDF header. Defaults to "Civil Alert – Live Map Snapshot" */
  title?: string;
  filename?: string;
}

/**
 * Captures the Leaflet map container as PNG or A4-landscape PDF.
 *
 * Usage:
 *   const container = document.getElementById('leaflet-map-container');
 *   await exportMap(container, { format: 'pdf', title: 'Live Hazard Map' });
 */
export async function exportMap(
  mapContainer: HTMLElement,
  options: MapExportOptions
): Promise<void> {
  const { format, title = 'Civil Alert – Live Map Snapshot' } = options;
  const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const safeTitle = (options.filename ?? `arc_map_${Date.now()}`).replace(/\s+/g, '_');

  // 1. Capture the map canvas
  const canvas = await html2canvas(mapContainer, {
    useCORS: true,          // allow cross-origin tile images
    allowTaint: true,
    logging: false,
    scale: 2,               // 2× for retina-quality output
    backgroundColor: '#1a1a2e',
  });

  if (format === 'png') {
    // --- PNG export ---
    const link = document.createElement('a');
    link.download = `${safeTitle}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    return;
  }

  // --- PDF export (A4 landscape) ---
  const PDF_W = 297; // mm
  const PDF_H = 210; // mm
  const MARGIN = 12; // mm
  const HEADER_H = 18; // mm reserved for title + timestamp

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  // Background
  pdf.setFillColor(15, 23, 42); // slate-900
  pdf.rect(0, 0, PDF_W, PDF_H, 'F');

  // Header bar
  pdf.setFillColor(30, 41, 59); // slate-800
  pdf.rect(0, 0, PDF_W, HEADER_H, 'F');

  // Title text
  pdf.setTextColor(241, 245, 249); // slate-100
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  pdf.text(title, MARGIN, HEADER_H / 2 + 2);

  // Timestamp (right-aligned)
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(148, 163, 184); // slate-400
  pdf.text(`Generated: ${timestamp}`, PDF_W - MARGIN, HEADER_H / 2 + 2, { align: 'right' });

  // Map image
  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  const imgX = MARGIN;
  const imgY = HEADER_H + 4;
  const imgW = PDF_W - MARGIN * 2;
  const imgH = PDF_H - HEADER_H - MARGIN - 4;

  pdf.addImage(imgData, 'JPEG', imgX, imgY, imgW, imgH);

  // Footer watermark
  pdf.setFontSize(7);
  pdf.setTextColor(71, 85, 105); // slate-600
  pdf.text('ARC – Alert · Report · Coordinate | Civil Alert System', PDF_W / 2, PDF_H - 4, {
    align: 'center',
  });

  pdf.save(`${safeTitle}.pdf`);
}
