import ExcelJS from "exceljs";
import { writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, "../public/location_request_template.xlsx");

const ORANGE_HEADER = "FFFFC000";
const LIGHT_BLUE_HEADER = "FFBDD7EE";
const RED_HEADER = "FFFF0000";
const YELLOW_ZONE = "FFFFFF00";
const GRID_BORDER = "FFD9D9D9";
const BLACK_BOLD = { bold: true, color: { argb: "FF000000" }, size: 11 };
const WHITE_BOLD = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };

const COLUMN_CONFIG = [
  { header: "No", width: 6, headerFill: ORANGE_HEADER, headerFont: BLACK_BOLD },
  { header: "Branch", width: 14, headerFill: ORANGE_HEADER, headerFont: BLACK_BOLD },
  {
    header: "Location Type",
    width: 36,
    headerFill: ORANGE_HEADER,
    headerFont: BLACK_BOLD,
  },
  {
    header: "Zone",
    width: 8,
    headerFill: ORANGE_HEADER,
    headerFont: BLACK_BOLD,
    dataFill: YELLOW_ZONE,
  },
  { header: "Row", width: 8, headerFill: ORANGE_HEADER, headerFont: BLACK_BOLD },
  { header: "F/B", width: 8, headerFill: ORANGE_HEADER, headerFont: BLACK_BOLD },
  { header: "Bay", width: 8, headerFill: ORANGE_HEADER, headerFont: BLACK_BOLD },
  { header: "Level", width: 8, headerFill: ORANGE_HEADER, headerFont: BLACK_BOLD },
  { header: "", width: 4, headerFill: LIGHT_BLUE_HEADER, headerFont: BLACK_BOLD },
  {
    header: "Branch Short C",
    width: 14,
    headerFill: ORANGE_HEADER,
    headerFont: BLACK_BOLD,
  },
  { header: "Type", width: 8, headerFill: ORANGE_HEADER, headerFont: BLACK_BOLD },
  {
    header: "Location Code",
    width: 22,
    headerFill: RED_HEADER,
    headerFont: WHITE_BOLD,
  },
];

const thinBorder = {
  top: { style: "thin", color: { argb: GRID_BORDER } },
  bottom: { style: "thin", color: { argb: GRID_BORDER } },
  left: { style: "thin", color: { argb: GRID_BORDER } },
  right: { style: "thin", color: { argb: GRID_BORDER } },
};

const saleType = "Top stock_Middle shelve & Wall shelve";
const sampleBranch = "Satsan";
const sampleShort = "SS";
const buildCode = (bay) => `${sampleShort}S_B_27_F_${bay}_01`;
const sampleRows = [
  [1, sampleBranch, saleType, "B", "27", "F", "01", "01", "", sampleShort, "S", buildCode("01")],
  [2, sampleBranch, saleType, "B", "27", "F", "02", "01", "", sampleShort, "S", buildCode("02")],
  [3, sampleBranch, saleType, "B", "27", "F", "03", "01", "", sampleShort, "S", buildCode("03")],
];

const workbook = new ExcelJS.Workbook();
workbook.creator = "Warehouse";
const sheet = workbook.addWorksheet("Locations");

COLUMN_CONFIG.forEach((col, index) => {
  sheet.getColumn(index + 1).width = col.width;
});

const headerRow = sheet.getRow(1);
headerRow.height = 22;
COLUMN_CONFIG.forEach((col, index) => {
  const cell = headerRow.getCell(index + 1);
  cell.value = col.header;
  cell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: col.headerFill },
  };
  cell.font = col.headerFont;
  cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  cell.border = thinBorder;
});

sampleRows.forEach((rowValues) => {
  const row = sheet.addRow(rowValues);
  row.height = 20;
  COLUMN_CONFIG.forEach((col, index) => {
    const cell = row.getCell(index + 1);
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = thinBorder;
    if (col.dataFill) {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: col.dataFill },
      };
    }
  });
});

sheet.views = [{ state: "frozen", ySplit: 1, activeCell: "A2" }];

const buffer = await workbook.xlsx.writeBuffer();
writeFileSync(outPath, Buffer.from(buffer));
console.log(`Wrote ${outPath} (${buffer.byteLength} bytes)`);
