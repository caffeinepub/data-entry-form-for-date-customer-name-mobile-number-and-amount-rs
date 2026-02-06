import type { Entry } from '../backend';
import { buildExportRow, EXPORT_COLUMNS } from './entriesImportExport';

/**
 * Exports entries to a printable HTML page that can be saved as PDF using browser's print dialog.
 * Opens a new window with formatted table that user can print to PDF.
 */
export function exportToPDF(entries: Entry[], filename: string = 'entries.pdf'): void {
  if (entries.length === 0) {
    throw new Error('No entries to export');
  }

  try {
    // Build data rows
    const rows = entries.map(buildExportRow);
    
    // Create HTML table
    const tableRows = rows.map(row => 
      `<tr>${row.map(cell => `<td>${String(cell)}</td>`).join('')}</tr>`
    ).join('');
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Data Entries</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
            }
            h1 {
              color: #10b981;
              margin-bottom: 20px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #10b981;
              color: white;
              font-weight: bold;
            }
            tr:nth-child(even) {
              background-color: #f5f5f5;
            }
            @media print {
              body { margin: 0; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>Data Entries</h1>
          <button onclick="window.print()" style="padding: 10px 20px; background: #10b981; color: white; border: none; border-radius: 4px; cursor: pointer; margin-bottom: 10px;">Print / Save as PDF</button>
          <table>
            <thead>
              <tr>${EXPORT_COLUMNS.map(col => `<th>${col}</th>`).join('')}</tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </body>
      </html>
    `;
    
    // Open in new window
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
    } else {
      throw new Error('Please allow pop-ups to export PDF');
    }
  } catch (error) {
    console.error('PDF export error:', error);
    throw new Error('Failed to export PDF. Please try again.');
  }
}
