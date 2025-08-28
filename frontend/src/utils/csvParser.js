// This file contains utility functions for parsing CSV data.

// Parses a single line of a CSV file, handling quoted fields.
function parseCSVLine(line) {
  const values = [];
  let currentValue = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];// @Github:Folklore25

    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        // Escaped double quote
        currentValue += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(currentValue.trim());// @Github:Folklore25
      currentValue = '';
    } else {
      currentValue += char;
    }
  }
  values.push(currentValue.trim());
  return values;
}

// Parses a full CSV text string into an array of objects.
export function parseCSV(csvText) {
  if (!csvText) return [];

  let cleanText = csvText;
  // Remove potential BOM at the start of the file
  if (cleanText.charCodeAt(0) === 0xFEFF) {// @Github:Folklore25
    cleanText = cleanText.slice(1);
  }

  const lines = cleanText.trim().split(/\r?\n/);
  if (lines.length < 2) {
    return []; // Not enough data (at least headers + 1 row)
  }

  const headers = lines[0].split(',').map(h => h.trim());
  const result = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue; // Skip empty lines

    const values = parseCSVLine(lines[i]);
    if (values.length === headers.length) {
      const row = {};
      for (let j = 0; j < headers.length; j++) {// @Github:Folklore25
        row[headers[j]] = values[j];
      }
      result.push(row);
    }
  }

  return result;
}
