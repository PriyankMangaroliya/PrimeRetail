import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

/**
 * Export report data to CSV
 * @param {Array} data - Array of objects
 * @param {String} fileName - Desired file name
 */
export const exportToCSV = (data, fileName = 'report') => {
  if (!data || data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvRows = [];

  // Add headers
  csvRows.push(headers.join(','));

  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header];
      const escaped = ('' + val).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${fileName}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Export report data to Excel
 * @param {Array} data - Array of objects
 * @param {String} fileName - Desired file name
 */
export const exportToExcel = (data, fileName = 'report') => {
  if (!data || data.length === 0) return;

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

/**
 * Export report data to PDF
 * @param {Array} data - Array of objects
 * @param {String} title - Report title
 * @param {String} fileName - Desired file name
 */
export const exportToPDF = (data, title = 'Report', fileName = 'report') => {
  if (!data || data.length === 0) return;

  const doc = new jsPDF();
  const headers = Object.keys(data[0]);
  const rows = data.map(obj => Object.values(obj));

  doc.text(title, 14, 15);
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 20,
    theme: 'grid',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [66, 133, 244] } // PrimeRetail primary-ish color
  });

  doc.save(`${fileName}.pdf`);
};

const ExportUtils = {
  exportToCSV,
  exportToExcel,
  exportToPDF
};

export default ExportUtils;
