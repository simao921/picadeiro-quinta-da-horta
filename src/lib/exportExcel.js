/**
 * Simple CSV/Excel export utility that doesn't require the xlsx package.
 * Generates a CSV file and triggers a download with .xlsx extension for compatibility.
 */

function escapeCSV(value) {
  if (value == null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes(';')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function arrayToCSV(data) {
  if (!data || data.length === 0) return '';
  return data.map(row => 
    row.map(cell => escapeCSV(cell)).join(';')
  ).join('\n');
}

function jsonToRows(jsonArray) {
  if (!jsonArray || jsonArray.length === 0) return [];
  const headers = Object.keys(jsonArray[0]);
  const rows = [headers];
  jsonArray.forEach(item => {
    rows.push(headers.map(h => item[h]));
  });
  return rows;
}

/**
 * Export data to a downloadable CSV file.
 * @param {Object} options
 * @param {Array<{name: string, data: Array<Array>|null, jsonData: Array<Object>|null}>} options.sheets
 * @param {string} options.filename - Filename without extension
 */
export function exportToExcel({ sheets, filename }) {
  // For multiple sheets, combine them into one CSV with sheet headers
  let allRows = [];
  
  sheets.forEach((sheet, index) => {
    if (index > 0) {
      allRows.push([]);
      allRows.push([]);
    }
    if (sheets.length > 1) {
      allRows.push([`--- ${sheet.name} ---`]);
      allRows.push([]);
    }
    
    let rows;
    if (sheet.data) {
      rows = sheet.data;
    } else if (sheet.jsonData) {
      rows = jsonToRows(sheet.jsonData);
    } else {
      rows = [];
    }
    allRows = allRows.concat(rows);
  });

  const csv = arrayToCSV(allRows);
  // Use BOM for Excel to recognize UTF-8
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Convenience helpers matching previous XLSX API usage patterns
export const utils = {
  jsonToSheet: (jsonData) => ({ type: 'json', jsonData }),
  aoa_to_sheet: (data) => ({ type: 'aoa', data }),
  book_new: () => ({ sheets: [] }),
  book_append_sheet: (workbook, sheet, name) => {
    workbook.sheets.push({ name, ...sheet });
  },
};

export function writeFile(workbook, filename) {
  const sheets = workbook.sheets.map(s => ({
    name: s.name,
    data: s.type === 'aoa' ? s.data : null,
    jsonData: s.type === 'json' ? s.jsonData : null,
  }));
  const baseName = filename.replace(/\.xlsx$/, '');
  exportToExcel({ sheets, filename: baseName });
}