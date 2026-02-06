/**
 * Utility functions for detecting and handling authorization errors
 */

/**
 * Checks if an error is an authorization failure
 * @param error - The error to check
 * @returns true if the error is an authorization failure
 */
export function isAuthorizationError(error: unknown): boolean {
  if (!error) return false;
  
  const errorMessage = error instanceof Error ? error.message : String(error);
  return errorMessage.toLowerCase().includes('unauthorized');
}

/**
 * Returns a user-friendly sign-in prompt message for authorization errors
 * @returns English message instructing the user to sign in
 */
export function getAuthPromptMessage(): string {
  return 'Please sign in with Internet Identity to access this feature.';
}

/**
 * Returns a user-friendly message for creating entries when not authenticated
 * @returns English message for entry creation
 */
export function getCreateEntryAuthMessage(): string {
  return 'Please sign in with Internet Identity to save entries.';
}

/**
 * Returns a user-friendly message for viewing entries when not authenticated
 * @returns English message for viewing entries
 */
export function getViewEntriesAuthMessage(): string {
  return 'Please sign in with Internet Identity to view entries.';
}

/**
 * Returns a user-friendly message for updating entries when not authenticated
 * @returns English message for updating entries
 */
export function getUpdateEntryAuthMessage(): string {
  return 'Please sign in with Internet Identity to update entries.';
}

/**
 * Returns a user-friendly message for deleting entries when not authenticated
 * @returns English message for deleting entries
 */
export function getDeleteEntryAuthMessage(): string {
  return 'Please sign in with Internet Identity to delete entries.';
}
