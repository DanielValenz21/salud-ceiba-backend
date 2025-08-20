import path              from 'path';
import { fileURLToPath }  from 'url';
import pug                from 'pug';
import puppeteer          from 'puppeteer';
import ExcelJS            from 'exceljs';
import { stringify }      from 'csv-stringify/sync';
import { pool }           from '../config/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tplDir    = path.join(__dirname, '../../templates');

/* ---------------- PDF ---------------- */
export async function generatePdf(tplName, data = {}) {
  const html = pug.renderFile(path.join(tplDir, `${tplName}.pug`), data);
  const browser = await puppeteer.launch({ args:['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil:'networkidle0' });
    const buffer = await page.pdf({
      format      : 'A4',
      landscape   : true,
      printBackground: true,
      margin:{ top:20, right:20, bottom:20, left:20 }
    });
    return buffer;
  } finally { await browser.close(); }
}

/* ---------------- Excel ---------------- */
export async function generateExcel({ sheets = [] }) {
  const wb = new ExcelJS.Workbook();
  for (const sht of sheets) {
    const ws = wb.addWorksheet(sht.name);
    ws.columns = sht.columns;
    ws.addRows(sht.rows);

    /* encabezado negrita + autofit */
    ws.getRow(1).font = { bold:true };
    ws.columns.forEach(c => { c.width = Math.max(10, c.header.length + 2); });
    if (sht.autoFilter) ws.autoFilter = 'A1:' + ws.getRow(1).lastCell.address;
    if (sht.totalsRow) {
      const last = ws.lastRow.number + 1;
      ws.addRow(sht.totalsRow);
      ws.getRow(last).font = { bold:true };
    }
  }
  return wb.xlsx.writeBuffer();
}

/* ---------------- CSV ---------------- */
export async function exportCsv({ sql, params = [] }) {
  const [rows] = await pool.execute(sql, params);
  const csv = stringify(rows, { header:true });
  return Buffer.from(csv, 'utf8');
}
