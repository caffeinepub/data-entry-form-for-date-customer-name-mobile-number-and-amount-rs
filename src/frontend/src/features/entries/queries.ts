import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useActor } from '../../hooks/useActor';
import type { Entry, EntryInput, CreateEntryError, UpdateEntryError, DeleteEntryError } from '../../backend';
import { isAuthorizationError, getCreateEntryAuthMessage, getUpdateEntryAuthMessage, getDeleteEntryAuthMessage } from '../../utils/authErrors';

export const ENTRIES_QUERY_KEY = ['entries'];

export interface CreateEntryInput {
  manualDate: string;
  customerName: string;
  mobileNumber: string;
  amountRs: string;
}

export interface UpdateEntryInput {
  id: string;
  manualDate: string;
  customerName: string;
  mobileNumber: string;
  amountRs: string;
}

export function useListEntries() {
  const { actor, isFetching } = useActor();

  return useQuery<Entry[]>({
    queryKey: ENTRIES_QUERY_KEY,
    queryFn: async () => {
      if (!actor) return [];
      return actor.listEntriesNewestFirst();
    },
    enabled: !!actor && !isFetching,
    retry: (failureCount, error) => {
      // Don't retry on authorization errors
      if (isAuthorizationError(error)) {
        return false;
      }
      // Retry other errors up to 3 times
      return failureCount < 3;
    },
  });
}

export function useCreateEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateEntryInput) => {
      if (!actor) {
        throw new Error('Actor not initialized');
      }

      // Generate unique ID (timestamp + random)
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Convert amount to Nat (BigInt)
      const amountRs = BigInt(Math.floor(parseFloat(input.amountRs)));

      // Create EntryInput object (without createdAt - backend sets it)
      const entryInput: EntryInput = {
        id,
        manualDate: input.manualDate,
        customerName: input.customerName,
        mobileNumber: input.mobileNumber,
        amountRs,
      };

      try {
        // Call backend with EntryInput object
        const result = await actor.createEntry(entryInput);

        // If backend returned an error, throw it with the English message
        if (result !== null) {
          let errorMessage = 'Failed to save entry. Please try again.';
          
          if (result.__kind__ === 'emptyField') {
            errorMessage = result.emptyField.message;
          } else if (result.__kind__ === 'invalidAmount') {
            errorMessage = result.invalidAmount.message;
          }
          
          throw new Error(errorMessage);
        }
      } catch (error) {
        // Check if this is an authorization error
        if (isAuthorizationError(error)) {
          throw new Error(getCreateEntryAuthMessage());
        }
        // Re-throw other errors
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate and refetch entries list
      queryClient.invalidateQueries({ queryKey: ENTRIES_QUERY_KEY });
    },
  });
}

export function useUpdateEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateEntryInput) => {
      if (!actor) {
        throw new Error('Actor not initialized');
      }

      // Convert amount to Nat (BigInt)
      const amountRs = BigInt(Math.floor(parseFloat(input.amountRs)));

      // Create EntryInput object for update
      const entryInput: EntryInput = {
        id: input.id,
        manualDate: input.manualDate,
        customerName: input.customerName,
        mobileNumber: input.mobileNumber,
        amountRs,
      };

      try {
        // Call backend update method
        const result = await actor.updateEntry(input.id, entryInput);

        // If backend returned an error, throw it with the English message
        if (result !== null) {
          let errorMessage = 'Failed to update entry. Please try again.';
          
          if (result.__kind__ === 'emptyField') {
            errorMessage = result.emptyField.message;
          } else if (result.__kind__ === 'invalidAmount') {
            errorMessage = result.invalidAmount.message;
          } else if (result.__kind__ === 'notFound') {
            errorMessage = result.notFound.message;
          } else if (result.__kind__ === 'unauthorized') {
            errorMessage = result.unauthorized.message;
          }
          
          throw new Error(errorMessage);
        }
      } catch (error) {
        // Check if this is an authorization error (trap)
        if (isAuthorizationError(error)) {
          throw new Error(getUpdateEntryAuthMessage());
        }
        // Re-throw other errors
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate and refetch entries list
      queryClient.invalidateQueries({ queryKey: ENTRIES_QUERY_KEY });
    },
  });
}

export function useDeleteEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) {
        throw new Error('Actor not initialized');
      }

      try {
        // Call backend delete method
        const result = await actor.deleteEntry(id);

        // If backend returned an error, throw it with the English message
        if (result !== null) {
          let errorMessage = 'Failed to delete entry. Please try again.';
          
          if (result.__kind__ === 'notFound') {
            errorMessage = result.notFound.message;
          } else if (result.__kind__ === 'unauthorized') {
            errorMessage = result.unauthorized.message;
          }
          
          throw new Error(errorMessage);
        }
      } catch (error) {
        // Check if this is an authorization error (trap)
        if (isAuthorizationError(error)) {
          throw new Error(getDeleteEntryAuthMessage());
        }
        // Re-throw other errors
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate and refetch entries list
      queryClient.invalidateQueries({ queryKey: ENTRIES_QUERY_KEY });
    },
  });
}
