import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EntriesTable } from '../components/EntriesTable';
import { AnalyticsSection } from '../components/AnalyticsSection';
import { AuthStatusBar } from '../components/AuthStatusBar';
import { useCreateEntry, useListEntries, ENTRIES_QUERY_KEY } from '../features/entries/queries';
import { validateRequired, validateMobileNumber, validateAmount } from '../utils/validation';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Heart, FileDown, FileUp, FileText } from 'lucide-react';
import { getCreateEntryAuthMessage, isAuthorizationError, getViewEntriesAuthMessage } from '../utils/authErrors';
import { exportToXLSX } from '../utils/entriesXlsxExport';
import { exportToPDF } from '../utils/entriesPdfExport';
import { parseXLSXFile } from '../utils/entriesXlsxImport';

interface FormData {
  manualDate: string;
  customerName: string;
  mobileNumber: string;
  amountRs: string;
}

interface FormErrors {
  manualDate?: string;
  customerName?: string;
  mobileNumber?: string;
  amountRs?: string;
}

export function DataEntryPage() {
  const [formData, setFormData] = useState<FormData>({
    manualDate: '',
    customerName: '',
    mobileNumber: '',
    amountRs: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<keyof FormData, boolean>>({
    manualDate: false,
    customerName: false,
    mobileNumber: false,
    amountRs: false,
  });

  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { identity, login, clear } = useInternetIdentity();
  const queryClient = useQueryClient();
  const createEntryMutation = useCreateEntry();
  const { data: entries = [], isLoading: isLoadingEntries, error: entriesError } = useListEntries();

  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  const validateField = (name: keyof FormData, value: string): string | undefined => {
    switch (name) {
      case 'manualDate':
        return validateRequired(value, 'Manual Date').error;
      case 'customerName':
        return validateRequired(value, 'Customer Name').error;
      case 'mobileNumber':
        return validateMobileNumber(value).error;
      case 'amountRs':
        return validateAmount(value).error;
      default:
        return undefined;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (touched[name as keyof FormData]) {
      const error = validateField(name as keyof FormData, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name as keyof FormData, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {
      manualDate: validateField('manualDate', formData.manualDate),
      customerName: validateField('customerName', formData.customerName),
      mobileNumber: validateField('mobileNumber', formData.mobileNumber),
      amountRs: validateField('amountRs', formData.amountRs),
    };

    setErrors(newErrors);
    setTouched({
      manualDate: true,
      customerName: true,
      mobileNumber: true,
      amountRs: true,
    });

    return !Object.values(newErrors).some((error) => error !== undefined);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check authentication before validation
    if (!isAuthenticated) {
      toast.error(getCreateEntryAuthMessage());
      return;
    }

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    try {
      await createEntryMutation.mutateAsync(formData);
      
      // Reset form
      setFormData({
        manualDate: '',
        customerName: '',
        mobileNumber: '',
        amountRs: '',
      });
      setErrors({});
      setTouched({
        manualDate: false,
        customerName: false,
        mobileNumber: false,
        amountRs: false,
      });

      toast.success('Entry saved successfully!');
    } catch (error) {
      console.error('Failed to create entry:', error);
      // Display the backend-provided error message
      const errorMessage = error instanceof Error ? error.message : 'Failed to save entry. Please try again.';
      toast.error(errorMessage);
    }
  };

  const handleSignIn = async () => {
    try {
      await login();
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.message === 'User is already authenticated') {
        await clear();
        setTimeout(() => login(), 300);
      }
    }
  };

  // Export handlers
  const handleExportXLSX = () => {
    try {
      if (entries.length === 0) {
        toast.error('No entries to export');
        return;
      }
      exportToXLSX(entries, 'data-entries.csv');
      toast.success('CSV file downloaded successfully! (Excel compatible)');
    } catch (error) {
      console.error('Export error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to export file';
      toast.error(errorMessage);
    }
  };

  const handleExportPDF = () => {
    try {
      if (entries.length === 0) {
        toast.error('No entries to export');
        return;
      }
      exportToPDF(entries);
      toast.success('Print window opened! Use Print > Save as PDF');
    } catch (error) {
      console.error('Export PDF error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to export PDF';
      toast.error(errorMessage);
    }
  };

  // Import handler
  const handleImportClick = () => {
    if (!isAuthenticated) {
      toast.error(getCreateEntryAuthMessage());
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset file input
    e.target.value = '';

    if (!isAuthenticated) {
      toast.error(getCreateEntryAuthMessage());
      return;
    }

    // Check file type - accept both .xlsx and .csv
    const validExtensions = ['.xlsx', '.csv'];
    const hasValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    
    if (!hasValidExtension) {
      toast.error('Please select a valid XLSX or CSV file');
      return;
    }

    setIsImporting(true);

    try {
      // Parse file
      const { validRows, errors: parseErrors } = await parseXLSXFile(file);

      if (validRows.length === 0) {
        if (parseErrors.length > 0) {
          toast.error('No valid rows found in the file. Please check the file format and data.');
        } else {
          toast.error('The file is empty or contains no data rows.');
        }
        setIsImporting(false);
        return;
      }

      // Import valid rows
      let successCount = 0;
      let failCount = 0;

      for (const row of validRows) {
        try {
          await createEntryMutation.mutateAsync(row);
          successCount++;
        } catch (error) {
          console.error('Failed to import row:', error);
          failCount++;
        }
      }

      // Refresh entries list
      queryClient.invalidateQueries({ queryKey: ENTRIES_QUERY_KEY });

      // Show summary
      if (successCount > 0 && failCount === 0) {
        toast.success(`Successfully imported ${successCount} ${successCount === 1 ? 'entry' : 'entries'}!`);
      } else if (successCount > 0 && failCount > 0) {
        toast.warning(`Imported ${successCount} ${successCount === 1 ? 'entry' : 'entries'}. ${failCount} ${failCount === 1 ? 'row' : 'rows'} failed.`);
      } else {
        toast.error(`Failed to import entries. ${parseErrors.length > 0 ? 'Please check the file format.' : ''}`);
      }

      // Log parse errors for debugging
      if (parseErrors.length > 0) {
        console.warn('Import validation errors:', parseErrors);
      }
    } catch (error) {
      console.error('Import error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to import file';
      toast.error(errorMessage);
    } finally {
      setIsImporting(false);
    }
  };

  // Determine if entries error is an auth error
  const isEntriesAuthError = entriesError && isAuthorizationError(entriesError);
  const entriesErrorToShow = isEntriesAuthError 
    ? new Error(getViewEntriesAuthMessage()) 
    : entriesError || null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold tracking-tight">Data Entry System</h1>
          <p className="text-muted-foreground mt-1">
            Manage customer transactions and records
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Auth Status Bar */}
        <div className="mb-8">
          <AuthStatusBar />
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Form Section */}
          <div>
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>New Entry</CardTitle>
                <CardDescription>
                  Fill in the details below to create a new entry
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Manual Date */}
                  <div className="space-y-2">
                    <Label htmlFor="manualDate">
                      Manual Date <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="manualDate"
                      name="manualDate"
                      type="date"
                      value={formData.manualDate}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={!isAuthenticated}
                      className={errors.manualDate && touched.manualDate ? 'border-destructive' : ''}
                    />
                    {errors.manualDate && touched.manualDate && (
                      <p className="form-error">{errors.manualDate}</p>
                    )}
                  </div>

                  {/* Customer Name */}
                  <div className="space-y-2">
                    <Label htmlFor="customerName">
                      Customer Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="customerName"
                      name="customerName"
                      type="text"
                      placeholder="Enter customer name"
                      value={formData.customerName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={!isAuthenticated}
                      className={errors.customerName && touched.customerName ? 'border-destructive' : ''}
                    />
                    {errors.customerName && touched.customerName && (
                      <p className="form-error">{errors.customerName}</p>
                    )}
                  </div>

                  {/* Mobile Number */}
                  <div className="space-y-2">
                    <Label htmlFor="mobileNumber">
                      Mobile Number <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="mobileNumber"
                      name="mobileNumber"
                      type="tel"
                      placeholder="Enter mobile number"
                      value={formData.mobileNumber}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={!isAuthenticated}
                      className={errors.mobileNumber && touched.mobileNumber ? 'border-destructive' : ''}
                    />
                    {errors.mobileNumber && touched.mobileNumber && (
                      <p className="form-error">{errors.mobileNumber}</p>
                    )}
                  </div>

                  {/* Amount */}
                  <div className="space-y-2">
                    <Label htmlFor="amountRs">
                      Amount (Rs.) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="amountRs"
                      name="amountRs"
                      type="number"
                      step="0.01"
                      placeholder="Enter amount"
                      value={formData.amountRs}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={!isAuthenticated}
                      className={errors.amountRs && touched.amountRs ? 'border-destructive' : ''}
                    />
                    {errors.amountRs && touched.amountRs && (
                      <p className="form-error">{errors.amountRs}</p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={!isAuthenticated || createEntryMutation.isPending}
                  >
                    {createEntryMutation.isPending 
                      ? 'Saving...' 
                      : !isAuthenticated 
                      ? 'Sign in to Submit' 
                      : 'Submit Entry'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Entries List Section */}
          <div className="lg:col-span-1 space-y-4">
            {/* Import/Export Actions */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="text-lg">Import / Export</CardTitle>
                <CardDescription>
                  Download or upload entry data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportXLSX}
                    disabled={entries.length === 0}
                    className="flex items-center gap-2"
                  >
                    <FileDown className="h-4 w-4" />
                    Export XLSX
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportPDF}
                    disabled={entries.length === 0}
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Export PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleImportClick}
                    disabled={!isAuthenticated || isImporting}
                    className="flex items-center gap-2"
                  >
                    <FileUp className="h-4 w-4" />
                    {isImporting ? 'Importing...' : 'Import XLSX'}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </CardContent>
            </Card>

            <EntriesTable 
              entries={entries} 
              isLoading={isLoadingEntries} 
              error={entriesErrorToShow}
              onSignIn={isEntriesAuthError ? handleSignIn : undefined}
            />
          </div>
        </div>

        {/* Analytics Section */}
        <div className="mt-8">
          <AnalyticsSection entries={entries} />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-muted-foreground">
            © 2026. Built with <Heart className="inline h-4 w-4 text-primary fill-primary" /> using{' '}
            <a
              href="https://caffeine.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground hover:text-primary transition-colors"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
