import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { daysInMonth, weekdayAbbrOfDay, MONTHS_PT } from "./date-utils";

// Build the PDF matching the printable A4 table: separate DATA/DIA columns.
// Long text wraps inside the fixed A4 columns instead of being truncated.
export function buildMonthPdf({ year, month, settings, monthData }) {
  const doc = new jsPDF({
    unit: "pt",
    format: "a4",
    orientation: "portrait",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  const COLORS = {
    yellow: [244, 196, 48],
    blueRow: [220, 231, 246],
    ink: [17, 17, 17],
    border: [51, 51, 51],
    white: [255, 255, 255],
  };

  let cursorY = margin;
  const headerPadding = 6;
  const headerLineHeight = 14;
  const headerText = [
    `${settings.header.title} - ${MONTHS_PT[month]}`,
    settings.header.community || "Comunidade Exemplo",
    `${year} - ${(settings.header.quote || "").trim()}`,
  ];
  const headerHeight = headerPadding * 2 + headerLineHeight * headerText.length;

  doc.setFillColor(...COLORS.yellow);
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.8);
  doc.rect(margin, cursorY, contentWidth, headerHeight, "FD");

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.ink);
  doc.setFontSize(13);
  doc.text(headerText[0], pageWidth / 2, cursorY + headerPadding + 9, { align: "center", maxWidth: contentWidth - 12 });
  doc.setFontSize(10);
  doc.text(headerText[1], pageWidth / 2, cursorY + headerPadding + 9 + headerLineHeight, { align: "center", maxWidth: contentWidth - 12 });
  doc.text(headerText[2], pageWidth / 2, cursorY + headerPadding + 9 + headerLineHeight * 2, { align: "center", maxWidth: contentWidth - 12 });

  cursorY += headerHeight;

  const dim = daysInMonth(year, month);
  const body = [];
  const filledFlags = [];
  for (let d = 1; d <= dim; d++) {
    const entries = monthData?.[d];
    const wd = weekdayAbbrOfDay(year, month, d);
    if (Array.isArray(entries) && entries.length > 0) {
      entries.forEach((e, idx) => {
        if (idx === 0) {
          body.push([
            { content: String(d), rowSpan: entries.length },
            { content: wd, rowSpan: entries.length },
            e.division || "",
            e.activity || "",
            e.place || "",
            e.time || "",
          ]);
        } else {
          body.push([e.division || "", e.activity || "", e.place || "", e.time || ""]);
        }
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
      font: "helvetica",
      fontSize: 10,
      textColor: COLORS.ink,
      cellPadding: 1.2,
      lineColor: COLORS.border,
      lineWidth: 0.4,
      overflow: "linebreak",
      valign: "middle",
      halign: "center",
      minCellHeight: 14,
      cellWidth: "wrap",
    },
    headStyles: {
      fillColor: COLORS.yellow,
      textColor: COLORS.ink,
      fontStyle: "bold",
      fontSize: 10,
      halign: "center",
      valign: "middle",
      cellPadding: 1.5,
      minCellHeight: 16,
      lineColor: COLORS.border,
      lineWidth: 0.5,
      overflow: "linebreak",
    },
    columnStyles: Object.fromEntries(
      scaledWidths.map((cellWidth, index) => [index, { cellWidth }]),
    ),
    didParseCell: (data) => {
      if (data.section === "body") {
        data.cell.styles.fillColor = filledFlags[data.row.index]
          ? COLORS.blueRow
          : COLORS.white;
      }
    },
  });

  const finalY = doc.lastAutoTable?.finalY ?? cursorY;
  const footerText = settings.footer || "";
  if (footerText) {
    const footerLines = doc.splitTextToSize(footerText, contentWidth - 16);
    const footerH = Math.max(20, footerLines.length * 12 + 8);
    const y = Math.min(finalY + 2, pageHeight - margin - footerH);
    doc.setFillColor(...COLORS.yellow);
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.8);
    doc.rect(margin, y, contentWidth, footerH, "FD");
    doc.setTextColor(...COLORS.ink);
    doc.setFont("helvetica", "bolditalic");
    doc.setFontSize(10);
    doc.text(footerLines, pageWidth / 2, y + 13, { align: "center", maxWidth: contentWidth - 16 });
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
