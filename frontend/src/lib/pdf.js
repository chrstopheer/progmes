import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { daysInMonth, weekdayAbbrOfDay, MONTHS_PT } from "./date-utils";

// Build the PDF matching the printable A4 table: separate DATA/DIA columns,
// 10pt table text, compact rows and fixed widths so the complete month fits
// on one A4 portrait page without line wrapping.
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

  // ==== HEADER BLOCK (yellow) ====
  let cursorY = margin;
  const headerHeight = 58;
  doc.setFillColor(244, 196, 48);
  doc.setDrawColor(51, 51, 51);
  doc.setLineWidth(0.8);
  doc.rect(margin, cursorY, contentWidth, headerHeight, "FD");

  doc.setFont("helvetica", "bold");
  doc.setTextColor(17, 17, 17);
  doc.setFontSize(13);
  doc.text(`${settings.header.title} - ${MONTHS_PT[month]}`, pageWidth / 2, cursorY + 17, { align: "center" });
  doc.setFontSize(10);
  doc.text(settings.header.community || "", pageWidth / 2, cursorY + 32, { align: "center" });
  doc.setTextColor(192, 57, 43);
  doc.setFontSize(10);
  const quoteLine = `${year} - ${settings.header.quote || ""}`.trim();
  doc.text(quoteLine, pageWidth / 2, cursorY + 48, { align: "center" });

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

  // Keep all columns on one line while giving the most room to ACTIVITY.
  const columnWidths = [32, 42, 62, 265, 105, 46];
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
      textColor: [17, 17, 17],
      cellPadding: 1.2,
      lineColor: [51, 51, 51],
      lineWidth: 0.4,
      overflow: "ellipsize",
      valign: "middle",
      halign: "center",
      minCellHeight: 14,
    },
    headStyles: {
      fillColor: [244, 196, 48],
      textColor: [192, 57, 43],
      fontStyle: "bold",
      fontSize: 10,
      halign: "center",
      valign: "middle",
      cellPadding: 1.5,
      minCellHeight: 16,
      lineColor: [51, 51, 51],
      lineWidth: 0.5,
    },
    columnStyles: Object.fromEntries(
      scaledWidths.map((cellWidth, index) => [index, { cellWidth }]),
    ),
    didParseCell: (data) => {
      if (data.section === "body") {
        data.cell.styles.fillColor = filledFlags[data.row.index]
          ? [220, 231, 246]
          : [255, 255, 255];
      }
    },
  });

  const finalY = doc.lastAutoTable?.finalY ?? cursorY;
  const footerText = settings.footer || "";
  if (footerText) {
    const footerH = 20;
    const y = Math.min(finalY + 2, pageHeight - margin - footerH);
    doc.setFillColor(244, 196, 48);
    doc.setDrawColor(51, 51, 51);
    doc.setLineWidth(0.8);
    doc.rect(margin, y, contentWidth, footerH, "FD");
    doc.setTextColor(192, 57, 43);
    doc.setFont("helvetica", "bolditalic");
    doc.setFontSize(10);
    doc.text(footerText, pageWidth / 2, y + 13, { align: "center" });
  }

  return doc;
}

export function downloadMonthPdf(args) {
  const doc = buildMonthPdf(args);
  const fileName = `programacao_${MONTHS_PT[args.month].toLowerCase()}_${args.year}.pdf`;
  doc.save(fileName);
  return fileName;
}

// Returns a File object for sharing via Web Share API
export function buildMonthPdfFile(args) {
  const doc = buildMonthPdf(args);
  const blob = doc.output("blob");
  const fileName = `programacao_${MONTHS_PT[args.month].toLowerCase()}_${args.year}.pdf`;
  return new File([blob], fileName, { type: "application/pdf" });
}
