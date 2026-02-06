# Specification

## Summary
**Goal:** Replace the existing Import/Export controls on the Data Entry page with XLSX import and XLSX/PDF export capabilities.

**Planned changes:**
- Update the DataEntryPage “Import / Export” action area to show exactly three controls: “Export XLSX”, “Export PDF”, and “Import XLSX” (xlsx-only file picker), removing the current CSV/Text controls.
- Implement client-side “Export XLSX” to download an .xlsx built from the currently loaded entries shown in the table, using columns: Manual Date, DAYS, Customer Name, Mobile Number, Amount (Rs.), Created At.
- Implement client-side “Export PDF” to download a PDF containing a readable table of the currently loaded entries with the same columns as the XLSX export.
- Implement “Import XLSX” to parse an .xlsx file into entries, validate rows using existing frontend validation rules, and create entries via the existing createEntry mutation (with existing authentication gating).
- Add English-only, robust toast/error handling for empty/unsupported files, parse errors, and per-row validation failures; refresh the entries list after import so new rows appear.

**User-visible outcome:** The Import/Export section provides Export XLSX, Export PDF, and Import XLSX; users can export the currently loaded entries to XLSX/PDF and import entries from an XLSX file with clear English feedback on success/failures.
