import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { daysInMonth, weekdayAbbrOfDay, MONTHS_PT } from "./date-utils";

// Build the PDF matching the template layout: A4 portrait,
// yellow header/footer, red column titles, blue-tinted filled rows.
export function buildMonthPdf({ year, month, settings, monthData }) {
  const doc = new jsPDF({
    unit: "pt",
    format: "a4",
    orientation: "portrait",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 24;
  const contentWidth = pageWidth - margin * 2;

  // ==== HEADER BLOCK (yellow) ====
  const headerX = margin;
  let cursorY = margin;

  const headerHeight = 62;
  doc.setFillColor(244, 196, 48); // brand yellow
  doc.setDrawColor(51, 51, 51);
  doc.setLineWidth(0.8);
  doc.rect(headerX, cursorY, contentWidth, headerHeight, "FD");

  doc.setFont("helvetica", "bold");
  doc.setTextColor(17, 17, 17);
  doc.setFontSize(13);
  doc.text(
    `${settings.header.title} - ${MONTHS_PT[month]}`,
    pageWidth / 2,
    cursorY + 18,
    { align: "center" },
  );

  doc.setFontSize(11);
  doc.text(settings.header.community || "", pageWidth / 2, cursorY + 34, {
    align: "center",
  });

  doc.setTextColor(192, 57, 43); // red
  doc.setFontSize(11);
  const quoteLine = `${year} - ${settings.header.quote || ""}`.trim();
  doc.text(quoteLine, pageWidth / 2, cursorY + 52, { align: "center" });

  cursorY += headerHeight;

  // ==== TABLE ====
  const dim = daysInMonth(year, month);
  const body = [];
  for (let d = 1; d <= dim; d++) {
    const row = monthData?.[d] || null;
    body.push([
      String(d),
      weekdayAbbrOfDay(year, month, d),
      row?.division || "",
      row?.activity || "",
      row?.place || "",
      row?.time || "",
    ]);
  }

  autoTable(doc, {
    startY: cursorY,
    margin: { left: margin, right: margin },
    tableWidth: contentWidth,
    head: [["DATA", "", "DIVISÃO", "ATIVIDADE", "LOCAL", "HORÁRIO"]],
    body,
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 8.5,
      textColor: [17, 17, 17],
      cellPadding: 2.5,
      lineColor: [51, 51, 51],
      lineWidth: 0.4,
      overflow: "linebreak",
      valign: "middle",
    },
    headStyles: {
      fillColor: [244, 196, 48],
      textColor: [192, 57, 43],
      fontStyle: "bold",
      halign: "center",
      lineColor: [51, 51, 51],
      lineWidth: 0.5,
    },
    columnStyles: {
      0: { cellWidth: 28, halign: "center" },
      1: { cellWidth: 40 },
      2: { cellWidth: 55 },
      3: { cellWidth: "auto" },
      4: { cellWidth: 120 },
      5: { cellWidth: 50, halign: "center" },
    },
    didParseCell: (data) => {
      if (data.section === "body") {
        const row = body[data.row.index];
        const isFilled = !!(row[2] || row[3] || row[4] || row[5]);
        if (isFilled) {
          data.cell.styles.fillColor = [220, 231, 246];
        } else {
          data.cell.styles.fillColor = [255, 255, 255];
        }
      }
      // merge visual: put "DATA" header above both date & weekday columns
      if (data.section === "head" && data.column.index === 1) {
        data.cell.text = [""];
      }
    },
    didDrawPage: (data) => {
      const finalY = data.cursor.y;
      const footerText = settings.footer || "";
      if (!footerText) return;
      const footerH = 22;
      const y = Math.min(finalY + 2, doc.internal.pageSize.getHeight() - margin - footerH);
      doc.setFillColor(244, 196, 48);
      doc.setDrawColor(51, 51, 51);
      doc.setLineWidth(0.8);
      doc.rect(margin, y, contentWidth, footerH, "FD");
      doc.setTextColor(192, 57, 43);
      doc.setFont("helvetica", "bolditalic");
      doc.setFontSize(11);
      doc.text(footerText, pageWidth / 2, y + 14, { align: "center" });
    },
  });

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
