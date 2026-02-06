import type { Entry } from '../backend';
import { calculateDaysSince } from './date';

// Column definitions for export
export const EXPORT_COLUMNS = [
  'Manual Date',
  'DAYS',
  'Customer Name',
  'Mobile Number',
  'Amount (Rs.)',
  'Created At',
];

// Helper to format a timestamp to readable date string
function formatTimestamp(timestamp: bigint): string {
  const date = new Date(Number(timestamp) / 1_000_000); // Convert nanoseconds to milliseconds
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Helper to escape CSV field
function escapeCSVField(field: string | number): string {
  const str = String(field);
  // If field contains comma, quote, or newline, wrap in quotes and escape quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// Helper to build export row from entry
export function buildExportRow(entry: Entry): (string | number)[] {
  const days = calculateDaysSince(entry.manualDate);
  
  return [
    entry.manualDate,
    days !== null ? days : '',
    entry.customerName,
    entry.mobileNumber,
    Number(entry.amountRs),
    formatTimestamp(entry.createdAt),
  ];
}

// CSV Export (works without external dependencies)
export function exportToCSV(entries: Entry[], filename: string = 'entries.csv'): void {
  if (entries.length === 0) {
    throw new Error('No entries to export');
  }

  try {
    // Build CSV content
    const rows = entries.map(buildExportRow);
    const csvRows = [
      EXPORT_COLUMNS.map(escapeCSVField).join(','),
      ...rows.map(row => row.map(escapeCSVField).join(','))
    ];
    const csvContent = csvRows.join('\n');
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('CSV export error:', error);
    throw new Error('Failed to export CSV file. Please try again.');
  }
}

// Simple text-based table export as fallback for "PDF"
export function exportToText(entries: Entry[], filename: string = 'entries.txt'): void {
  if (entries.length === 0) {
    throw new Error('No entries to export');
  }

  try {
    // Build text table
    const rows = entries.map(buildExportRow);
    
    // Calculate column widths
    const colWidths = EXPORT_COLUMNS.map((header, i) => {
      const maxDataWidth = Math.max(...rows.map(row => String(row[i]).length));
      return Math.max(header.length, maxDataWidth);
    });
    
    // Build header
    const headerRow = EXPORT_COLUMNS.map((header, i) => 
      header.padEnd(colWidths[i])
    ).join(' | ');
    
    const separator = colWidths.map(w => '-'.repeat(w)).join('-+-');
    
    // Build data rows
    const dataRows = rows.map(row =>
      row.map((cell, i) => String(cell).padEnd(colWidths[i])).join(' | ')
    );
    
    const textContent = [
      'Data Entries',
      '='.repeat(headerRow.length),
      '',
      headerRow,
      separator,
      ...dataRows
    ].join('\n');
    
    // Create blob and download
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Text export error:', error);
    throw new Error('Failed to export text file. Please try again.');
  }
}
