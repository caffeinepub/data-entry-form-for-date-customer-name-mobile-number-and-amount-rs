import { validateRequired, validateMobileNumber, validateAmount } from './validation';

export interface ParsedRow {
  manualDate: string;
  customerName: string;
  mobileNumber: string;
  amountRs: string;
}

export interface ImportResult {
  validRows: ParsedRow[];
  errors: Array<{ row: number; message: string }>;
}

// Map of supported column headers (case-insensitive)
const COLUMN_MAPPINGS: Record<string, keyof ParsedRow> = {
  'manual date': 'manualDate',
  'manualdate': 'manualDate',
  'date': 'manualDate',
  'customer name': 'customerName',
  'customername': 'customerName',
  'name': 'customerName',
  'mobile number': 'mobileNumber',
  'mobilenumber': 'mobileNumber',
  'mobile': 'mobileNumber',
  'phone': 'mobileNumber',
  'amount (rs.)': 'amountRs',
  'amount': 'amountRs',
  'amountrs': 'amountRs',
  'amount rs': 'amountRs',
};

function normalizeColumnName(header: string): keyof ParsedRow | null {
  const normalized = header.toLowerCase().trim();
  return COLUMN_MAPPINGS[normalized] || null;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

function validateRow(row: ParsedRow, rowIndex: number): string | null {
  const dateValidation = validateRequired(row.manualDate, 'Manual Date');
  if (dateValidation.error) {
    return `Row ${rowIndex}: ${dateValidation.error}`;
  }

  const nameValidation = validateRequired(row.customerName, 'Customer Name');
  if (nameValidation.error) {
    return `Row ${rowIndex}: ${nameValidation.error}`;
  }

  const mobileValidation = validateMobileNumber(row.mobileNumber);
  if (mobileValidation.error) {
    return `Row ${rowIndex}: ${mobileValidation.error}`;
  }

  const amountValidation = validateAmount(row.amountRs);
  if (amountValidation.error) {
    return `Row ${rowIndex}: ${amountValidation.error}`;
  }

  return null;
}

/**
 * Parses an XLSX/CSV file and returns valid rows and errors.
 * Accepts both .xlsx and .csv files, treating them as CSV format.
 */
export async function parseXLSXFile(file: File): Promise<ImportResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) {
          reject(new Error('Failed to read file'));
          return;
        }

        // Split into lines
        const lines = text.split(/\r?\n/).filter(line => line.trim());
        
        if (lines.length === 0) {
          reject(new Error('File is empty'));
          return;
        }

        // Parse header
        const headerLine = lines[0];
        const headers = parseCSVLine(headerLine);
        
        // Map headers to field names
        const fieldMapping: Array<keyof ParsedRow | null> = headers.map(normalizeColumnName);
        
        // Check if we have at least some valid columns
        if (!fieldMapping.some(f => f !== null)) {
          reject(new Error('No recognized columns found in the file'));
          return;
        }

        // Parse data rows
        const validRows: ParsedRow[] = [];
        const errors: Array<{ row: number; message: string }> = [];

        for (let i = 1; i < lines.length; i++) {
          const rowNumber = i + 1;
          const line = lines[i].trim();
          
          if (!line) continue;
          
          try {
            const values = parseCSVLine(line);
            const parsedRow: Partial<ParsedRow> = {};
            let hasAnyField = false;
            
            for (let j = 0; j < Math.min(values.length, fieldMapping.length); j++) {
              const fieldName = fieldMapping[j];
              if (fieldName) {
                parsedRow[fieldName] = values[j].trim();
                hasAnyField = true;
              }
            }
            
            if (!hasAnyField) continue;
            
            const completeRow: ParsedRow = {
              manualDate: parsedRow.manualDate || '',
              customerName: parsedRow.customerName || '',
              mobileNumber: parsedRow.mobileNumber || '',
              amountRs: parsedRow.amountRs || '',
            };
            
            const validationError = validateRow(completeRow, rowNumber);
            if (validationError) {
              errors.push({ row: rowNumber, message: validationError });
            } else {
              validRows.push(completeRow);
            }
          } catch (error) {
            errors.push({
              row: rowNumber,
              message: `Row ${rowNumber}: Failed to parse row - ${error instanceof Error ? error.message : 'Unknown error'}`,
            });
          }
        }

        if (validRows.length === 0 && errors.length === 0) {
          reject(new Error('No data rows found in the file'));
          return;
        }

        resolve({ validRows, errors });
      } catch (error) {
        reject(new Error(`Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}
