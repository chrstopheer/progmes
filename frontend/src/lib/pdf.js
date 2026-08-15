import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { daysInMonth, weekdayAbbrOfDay, MONTHS_PT } from "./date-utils";

// Build the PDF matching the printable A4 table: separate DATA/DIA columns.
// Long text and manual line breaks are preserved in the header, table and footer.
export function buildMonthPdf({ year, month, settings, monthData }) {
  const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  const COLORS = {
    yellow: [244, 196, 48], blueRow: [220, 231, 246], ink: [17, 17, 17], border: [51, 51, 51], white: [255, 255, 255],
  };

  let cursorY = margin;
  const headerPadding = 6;
  const headerWidth = contentWidth - 12;
  const headerEntries = [
    { text: `${settings.header.title} - ${MONTHS_PT[month]}`, size: 13, gap: 3 },
    { text: settings.header.community || "Comunidade Exemplo", size: 10, gap: 3 },
    { text: `${year} - ${(settings.header.quote || "").trim()}`, size: 10, gap: 3 },
  ];
  const headerLines = headerEntries.map((entry) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(entry.size);
    return { ...entry, lines: doc.splitTextToSize(entry.text, headerWidth) };
  });
  const headerLineHeight = 12;
  const headerHeight = headerPadding * 2 + headerLines.reduce((sum, entry) => sum + entry.lines.length * headerLineHeight + entry.gap, 0) - 3;

  doc.setFillColor(...COLORS.yellow);
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.8);
  doc.rect(margin, cursorY, contentWidth, headerHeight, "FD");

  let textY = cursorY + headerPadding + 9;
  headerLines.forEach((entry) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(entry.size);
    doc.setTextColor(...COLORS.ink);
    doc.text(entry.lines, pageWidth / 2, textY, { align: "center", maxWidth: headerWidth });
    textY += entry.lines.length * headerLineHeight + entry.gap;
  });
  cursorY += headerHeight;

  const dim = daysInMonth(year, month);
  const body = [];
  const filledFlags = [];
  for (let d = 1; d <= dim; d++) {
    const entries = monthData?.[d];
    const wd = weekdayAbbrOfDay(year, month, d);
    if (Array.isArray(entries) && entries.length > 0) {
      entries.forEach((e, idx) => {
        if (idx === 0) body.push([{ content: String(d), rowSpan: entries.length }, { content: wd, rowSpan: entries.length }, e.division || "", e.activity || "", e.place || "", e.time || ""]);
        else body.push([e.division || "", e.activity || "", e.place || "", e.time || ""]);
        filledFlags.push(true);
      });
    } else {
      body.push([String(d), wd, "", "", "", ""]);
      filledFlags.push(false);
    }
  }

  const columnWidths = [32, 42, 62, 255, 105, 56];
  const widthSum = columnWidths.reduce((sum, width) => sum + width, 0);
  const widthScale = contentWidth / widthSum;
  const scaledWidths = columnWidths.map((width) => width * widthScale);

  autoTable(doc, {
    startY: cursorY,
    margin: { left: margin, right: margin, top: margin, bottom: margin },
    tableWidth: contentWidth,
    head: [["DATA", "DIA", "DIVISÃO", "ATIVIDADE", "LOCAL", "HORÁRIO"]],
    body,
    theme: "grid",
    styles: {
      font: "helvetica", fontSize: 10, textColor: COLORS.ink, cellPadding: 1.2, lineColor: COLORS.border,
      lineWidth: 0.4, overflow: "linebreak", valign: "middle", halign: "center", minCellHeight: 14, cellWidth: "wrap",
    },
    headStyles: {
      fillColor: COLORS.yellow, textColor: COLORS.ink, fontStyle: "bold", fontSize: 10, halign: "center", valign: "middle",
      cellPadding: 1.5, minCellHeight: 16, lineColor: COLORS.border, lineWidth: 0.5, overflow: "linebreak",
    },
    columnStyles: Object.fromEntries(scaledWidths.map((cellWidth, index) => [index, { cellWidth }])),
    didParseCell: (data) => {
      if (data.section === "body") data.cell.styles.fillColor = filledFlags[data.row.index] ? COLORS.blueRow : COLORS.white;
    },
  });

  const finalY = doc.lastAutoTable?.finalY ?? cursorY;
  const footerText = settings.footer || "";
  if (footerText) {
    doc.setFont("helvetica", "bolditalic");
    doc.setFontSize(10);
    const footerLines = doc.splitTextToSize(footerText, contentWidth - 16);
    const footerLineHeight = 12;
    const footerH = Math.max(20, footerLines.length * footerLineHeight + 8);
    const y = finalY + 2;
    if (y + footerH <= pageHeight - margin) {
      doc.setFillColor(...COLORS.yellow);
      doc.setDrawColor(...COLORS.border);
      doc.setLineWidth(0.8);
      doc.rect(margin, y, contentWidth, footerH, "FD");
      doc.setTextColor(...COLORS.ink);
      doc.text(footerLines, pageWidth / 2, y + 13, { align: "center", maxWidth: contentWidth - 16 });
    } else {
      doc.addPage();
      const pageY = margin;
      doc.setFillColor(...COLORS.yellow);
      doc.setDrawColor(...COLORS.border);
      doc.rect(margin, pageY, contentWidth, footerH, "FD");
      doc.setTextColor(...COLORS.ink);
      doc.setFont("helvetica", "bolditalic");
      doc.setFontSize(10);
      doc.text(footerLines, pageWidth / 2, pageY + 13, { align: "center", maxWidth: contentWidth - 16 });
    }
  }

  return doc;
}

export function downloadMonthPdf(args) {
  const doc = buildMonthPdf(args);
  const fileName = `programacao_${MONTHS_PT[args.month].toLowerCase()}_${args.year}.pdf`;
  doc.save(fileName);
  return fileName;
}

export function buildMonthPdfFile(args) {
  const doc = buildMonthPdf(args);
  const blob = doc.output("blob");
  const fileName = `programacao_${MONTHS_PT[args.month].toLowerCase()}_${args.year}.pdf`;
  return new File([blob], fileName, { type: "application/pdf" });
}
