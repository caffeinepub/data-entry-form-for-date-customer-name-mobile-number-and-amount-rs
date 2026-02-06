import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, LogIn, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Entry } from '../backend';
import { calculateDaysSince } from '../utils/date';
import { useUpdateEntry, useDeleteEntry } from '../features/entries/queries';
import { validateRequired, validateMobileNumber, validateAmount } from '../utils/validation';

interface EntriesTableProps {
  entries: Entry[];
  isLoading?: boolean;
  error?: Error | null;
  onSignIn?: () => void;
}

export function EntriesTable({ entries, isLoading, error, onSignIn }: EntriesTableProps) {
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null);
  
  // Form state for editing
  const [editForm, setEditForm] = useState({
    manualDate: '',
    customerName: '',
    mobileNumber: '',
    amountRs: '',
  });

  const updateMutation = useUpdateEntry();
  const deleteMutation = useDeleteEntry();

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const formatTimestamp = (timestamp: bigint) => {
    try {
      // Convert nanoseconds to milliseconds
      const ms = Number(timestamp / BigInt(1_000_000));
      const date = new Date(ms);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'N/A';
    }
  };

  const formatAmount = (amount: bigint) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatDaysSince = (manualDate: string): string => {
    const days = calculateDaysSince(manualDate);
    if (days === null) {
      return 'N/A';
    }
    return days.toString();
  };

  const handleEditClick = (entry: Entry) => {
    setEditingEntry(entry);
    setEditForm({
      manualDate: entry.manualDate,
      customerName: entry.customerName,
      mobileNumber: entry.mobileNumber,
      amountRs: entry.amountRs.toString(),
    });
  };

  const handleEditClose = () => {
    setEditingEntry(null);
    setEditForm({
      manualDate: '',
      customerName: '',
      mobileNumber: '',
      amountRs: '',
    });
  };

  const validateEditForm = (): boolean => {
    const dateValidation = validateRequired(editForm.manualDate, 'Manual Date');
    if (!dateValidation.isValid) {
      toast.error(dateValidation.error);
      return false;
    }

    const nameValidation = validateRequired(editForm.customerName, 'Customer Name');
    if (!nameValidation.isValid) {
      toast.error(nameValidation.error);
      return false;
    }

    const mobileValidation = validateMobileNumber(editForm.mobileNumber);
    if (!mobileValidation.isValid) {
      toast.error(mobileValidation.error);
      return false;
    }

    const amountValidation = validateAmount(editForm.amountRs);
    if (!amountValidation.isValid) {
      toast.error(amountValidation.error);
      return false;
    }

    return true;
  };

  const handleEditSave = async () => {
    if (!editingEntry) return;

    if (!validateEditForm()) {
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: editingEntry.id,
        manualDate: editForm.manualDate,
        customerName: editForm.customerName,
        mobileNumber: editForm.mobileNumber,
        amountRs: editForm.amountRs,
      });
      toast.success('Entry updated successfully');
      handleEditClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update entry';
      toast.error(errorMessage);
    }
  };

  const handleDeleteClick = (entryId: string) => {
    setDeletingEntryId(entryId);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingEntryId) return;

    try {
      await deleteMutation.mutateAsync(deletingEntryId);
      toast.success('Entry deleted successfully');
      setDeletingEntryId(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete entry';
      toast.error(errorMessage);
      setDeletingEntryId(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeletingEntryId(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Saved Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            Loading entries...
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error state with sign-in prompt if there's an error
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Saved Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-destructive/10 p-3 mb-4">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <p className="text-muted-foreground mb-4">
              {error.message || 'Unable to load entries'}
            </p>
            {onSignIn && (
              <Button onClick={onSignIn} size="sm">
                <LogIn className="h-4 w-4 mr-2" />
                Sign in
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (entries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Saved Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-3 mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <p className="text-muted-foreground">
              No entries yet. Submit the form above to create your first entry.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Saved Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Manual Date</TableHead>
                  <TableHead>DAYS</TableHead>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Mobile Number</TableHead>
                  <TableHead className="text-right">Amount (Rs.)</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">
                      {formatDate(entry.manualDate)}
                    </TableCell>
                    <TableCell className="font-medium text-primary">
                      {formatDaysSince(entry.manualDate)}
                    </TableCell>
                    <TableCell>{entry.customerName}</TableCell>
                    <TableCell>{entry.mobileNumber}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatAmount(entry.amountRs)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatTimestamp(entry.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(entry)}
                          disabled={updateMutation.isPending || deleteMutation.isPending}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(entry.id)}
                          disabled={updateMutation.isPending || deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingEntry} onOpenChange={(open) => !open && handleEditClose()}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Entry</DialogTitle>
            <DialogDescription>
              Update the entry details below. Created At cannot be changed.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-manualDate">Manual Date</Label>
              <Input
                id="edit-manualDate"
                type="date"
                value={editForm.manualDate}
                onChange={(e) => setEditForm({ ...editForm, manualDate: e.target.value })}
                disabled={updateMutation.isPending}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-customerName">Customer Name</Label>
              <Input
                id="edit-customerName"
                type="text"
                value={editForm.customerName}
                onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })}
                disabled={updateMutation.isPending}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-mobileNumber">Mobile Number</Label>
              <Input
                id="edit-mobileNumber"
                type="text"
                value={editForm.mobileNumber}
                onChange={(e) => setEditForm({ ...editForm, mobileNumber: e.target.value })}
                disabled={updateMutation.isPending}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-amountRs">Amount (Rs.)</Label>
              <Input
                id="edit-amountRs"
                type="number"
                value={editForm.amountRs}
                onChange={(e) => setEditForm({ ...editForm, amountRs: e.target.value })}
                disabled={updateMutation.isPending}
              />
            </div>
            {editingEntry && (
              <div className="grid gap-2">
                <Label className="text-muted-foreground">Created At (Read-only)</Label>
                <div className="text-sm text-muted-foreground">
                  {formatTimestamp(editingEntry.createdAt)}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleEditClose}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditSave}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingEntryId} onOpenChange={(open) => !open && handleDeleteCancel()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this entry? This action is permanent and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel} disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
