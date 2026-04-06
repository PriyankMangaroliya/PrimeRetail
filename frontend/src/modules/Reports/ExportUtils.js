import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

/**
 * Helper to determine if a column should be summed
 */
const isSummable = (col) => {
  const key = col.key.toLowerCase();
  const title = col.title.toLowerCase();
  
  if (key.includes('id') || key.includes('_at') || key.includes('date') || key.includes('phone') || key.includes('email')) {
    return false;
  }

  const numericKeywords = /price|revenue|total|sold|quantity|qty|amount|count|usage_count|attachments|user_count|active_user_count|store_count|warehouse_count/i;
  
  return numericKeywords.test(key) || numericKeywords.test(title);
};

/**
 * Get header text, appending (Sum) for totaled columns
 */
const getTableHeader = (col) => {
  return isSummable(col) ? `${col.title} (Sum)` : col.title;
};

/**
 * Helper to calculate sum or count for a column
 */
const calculateSummaryRow = (data, columns) => {
  const summaryRow = {};
  
  columns.forEach((col, index) => {
    const key = col.key;
    const title = getTableHeader(col);
    
    if (isSummable(col)) {
      const sum = data.reduce((acc, row) => {
        const val = parseFloat(row[key]) || 0;
        return acc + val;
      }, 0);
      
      const formattedSum = Number(sum.toFixed(2));
      
      if (/price|revenue|amount/i.test(key) || /price|revenue|amount/i.test(col.title)) {
        summaryRow[title] = `${formattedSum.toLocaleString()}`;
      } else {
        summaryRow[title] = `${formattedSum.toLocaleString()}`;
      }
    } else if (index === 0) {
      summaryRow[title] = `Total Records: ${data.length}`;
    } else {
      summaryRow[title] = '';
    }
  });
  
  return summaryRow;
};

/**
 * PDF Text Wrapping Helper
 */
const renderWrappedText = (doc, text, x, y, maxWidth, lineHeight = 5) => {
  const lines = doc.splitTextToSize(text, maxWidth);
  lines.forEach((line, index) => {
    doc.text(line, x, y + (index * lineHeight));
  });
  return lines.length * lineHeight;
};

/**
 * Common Header Generator for Excel/CSV (Interleaved 2-column)
 */
const generateHeaderData = (stats = [], metadata = {}) => {
  const metaList = [];
  if (metadata.filters) {
    metadata.filters.forEach(f => metaList.push({ label: f.label, value: f.value }));
  }
  metaList.push({ label: 'Search Query', value: metadata.search || 'None' });
  metaList.push({ label: 'Exported On', value: metadata.exportedOn });

  const rows = [];
  const max = Math.max(stats.length, metaList.length);
  
  for (let i = 0; i < max; i++) {
    const s = stats[i] || { label: '', value: '' };
    const m = metaList[i] || { label: '', value: '' };
    rows.push([s.label, s.value, "", m.label, m.value]);
  }
  
  return rows;
};

/**
 * Helper to ensure display data uses the augmented headers as keys
 */
const filteredDataForSpreadsheet = (data, columns, displayData) => {
  if (displayData && displayData.length > 0) {
    return displayData.map(row => {
      const augmentedRow = {};
      columns.forEach(col => {
        const oldKey = col.title;
        const newKey = getTableHeader(col);
        augmentedRow[newKey] = row[oldKey];
      });
      return augmentedRow;
    });
  }

  return data.map(row => {
    const obj = {};
    columns.forEach(col => {
      obj[getTableHeader(col)] = row[col.key];
    });
    return obj;
  });
};

export const exportToCSV = (data, columns, title = 'Report', fileName = 'report', stats = [], metadata = {}, displayData = []) => {
  if (!data || data.length === 0) return;

  const csvRows = [];
  
  // 0. Title
  csvRows.push(`"${title.toString().replace(/"/g, '""')}","","",""`);
  csvRows.push('');

  // 1. Report Metadata (Interleaved)
  csvRows.push(`"STATISTICS","","","FILTERS & CONFIGURATION"`);
  const headerInfo = generateHeaderData(stats, metadata);
  headerInfo.forEach(row => {
    csvRows.push(row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(','));
  });
  csvRows.push('');

  // 2. Main Table
  const headers = columns.map(c => getTableHeader(c));
  csvRows.push(headers.join(','));

  const finalRows = filteredDataForSpreadsheet(data, columns, displayData);
  finalRows.forEach((row) => {
    const values = headers.map(h => {
      const val = row[h];
      const escaped = ('' + (val !== undefined && val !== null ? val : '')).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  });

  // 3. Totals
  const summary = calculateSummaryRow(data, columns);
  const summaryValues = headers.map(h => `"${summary[h].toString().replace(/"/g, '""')}"`);
  csvRows.push(summaryValues.join(','));

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${fileName}.csv`);
  link.click();
};

export const exportToExcel = (data, columns, title = 'Report', fileName = 'report', stats = [], metadata = {}, displayData = []) => {
  if (!data || data.length === 0) return;

  // 1. Title and Header Section (AOA)
  const headerRows = [
    [title],
    [""], // Blank separating row
    ["SUMMARY STATISTICS", "", "", "FILTER CONFIGURATION"], // Headers
  ];
  const headerInfo = generateHeaderData(stats, metadata);
  headerInfo.forEach(row => headerRows.push(row));

  // Initialize worksheet with header block
  const worksheet = XLSX.utils.aoa_to_sheet(headerRows);
  
  // 2. Prepare and add table data
  const finalRows = filteredDataForSpreadsheet(data, columns, displayData);
  const summary = calculateSummaryRow(data, columns);
  finalRows.push(summary);

  // Table starts after a 1-row gap from the header block
  const tableOrigin = `A${headerRows.length + 2}`;
  XLSX.utils.sheet_add_json(worksheet, finalRows, { origin: tableOrigin });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

export const exportToPDF = (data, columns, title = 'Report', fileName = 'report', stats = [], metadata = {}, displayData = []) => {
  if (!data || data.length === 0) return;

  const doc = new jsPDF();
  const headers = columns.map(c => getTableHeader(c));
  
  const finalRows = displayData.length > 0 
    ? displayData.map(row => columns.map(c => row[c.title]))
    : data.map(row => columns.map(c => row[c.key]));
  
  const summary = calculateSummaryRow(data, columns);
  const footerRow = headers.map(h => summary[h]);

  doc.setFontSize(22);
  doc.setTextColor(40);
  doc.text(title, 14, 20);
  
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text("SUMMARY STATISTICS", 14, 30);
  doc.setLineWidth(0.1);
  doc.line(14, 32, 60, 32);
  
  let leftY = 38;
  stats.forEach(s => {
    const label = `${s.label}:`;
    doc.setFont("helvetica", "bold");
    doc.text(label, 14, leftY);
    
    const labelWidth = doc.getTextWidth(label);
    doc.setFont("helvetica", "normal");
    const height = renderWrappedText(doc, `${s.value}`, 14 + labelWidth + 3, leftY, 70 - labelWidth);
    leftY += Math.max(6, height);
  });

  const rightX = 110;
  doc.setFontSize(9);
  doc.text("FILTER CONFIGURATION", rightX, 30);
  doc.line(rightX, 32, 196, 32);
  
  let rightY = 38;
  if (metadata.filters) {
    metadata.filters.forEach(f => {
      const label = `${f.label}:`;
      doc.setFont("helvetica", "bold");
      doc.text(label, rightX, rightY);
      
      const labelWidth = doc.getTextWidth(label);
      doc.setFont("helvetica", "normal");
      const height = renderWrappedText(doc, `${f.value}`, rightX + labelWidth + 3, rightY, 196 - (rightX + labelWidth + 3));
      rightY += Math.max(6, height);
    });
  }
  
  const searchLabel = "Search Query:";
  doc.setFont("helvetica", "bold");
  doc.text(searchLabel, rightX, rightY);
  const sw = doc.getTextWidth(searchLabel);
  doc.setFont("helvetica", "normal");
  let h = renderWrappedText(doc, metadata.search || "None", rightX + sw + 3, rightY, 196 - (rightX + sw + 3));
  rightY += Math.max(6, h);
  
  const exportLabel = "Exported On:";
  doc.setFont("helvetica", "bold");
  doc.text(exportLabel, rightX, rightY);
  const ew = doc.getTextWidth(exportLabel);
  doc.setFont("helvetica", "normal");
  h = renderWrappedText(doc, metadata.exportedOn, rightX + ew + 3, rightY, 196 - (rightX + ew + 3));
  rightY += Math.max(6, h);

  const startY = Math.max(leftY, rightY) + 10;

  autoTable(doc, {
    head: [headers],
    body: finalRows,
    foot: [footerRow],
    startY: startY,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
    footStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [250, 250, 250] }
  });

  doc.save(`${fileName}.pdf`);
};

const ExportUtils = {
  exportToCSV,
  exportToExcel,
  exportToPDF
};

export default ExportUtils;
