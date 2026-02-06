import type { Entry } from '../backend';
import { buildExportRow, EXPORT_COLUMNS } from './entriesImportExport';

/**
 * Exports entries to a CSV file with .xlsx extension for Excel compatibility.
 * Uses CSV format which Excel can open directly.
 */
export function exportToXLSX(entries: Entry[], filename: string = 'entries.xlsx'): void {
  if (entries.length === 0) {
    throw new Error('No entries to export');
  }

  try {
    // Build CSV content (Excel can open CSV files)
    const rows = entries.map(buildExportRow);
    
    // Escape CSV field
    const escapeCSVField = (field: string | number): string => {
      const str = String(field);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
    
    const csvRows = [
      EXPORT_COLUMNS.map(escapeCSVField).join(','),
      ...rows.map(row => row.map(escapeCSVField).join(','))
    ];
    const csvContent = csvRows.join('\n');
    
    // Add BOM for Excel UTF-8 compatibility
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Create download link
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename.replace('.xlsx', '.csv'));
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Export error:', error);
    throw new Error('Failed to export file. Please try again.');
  }
}
