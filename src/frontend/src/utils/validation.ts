export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateRequired(value: string, fieldName: string): ValidationResult {
  if (!value || value.trim() === '') {
    return {
      isValid: false,
      error: `${fieldName} is required`
    };
  }
  return { isValid: true };
}

export function validateMobileNumber(value: string): ValidationResult {
  if (!value || value.trim() === '') {
    return {
      isValid: false,
      error: 'Mobile Number is required'
    };
  }

  // Check if contains only digits
  const digitsOnly = /^\d+$/;
  if (!digitsOnly.test(value)) {
    return {
      isValid: false,
      error: 'Mobile Number must contain only digits'
    };
  }

  // Check length (10-15 digits)
  if (value.length < 10 || value.length > 15) {
    return {
      isValid: false,
      error: 'Mobile Number must be between 10 and 15 digits'
    };
  }

  return { isValid: true };
}

export function validateAmount(value: string): ValidationResult {
  if (!value || value.trim() === '') {
    return {
      isValid: false,
      error: 'Amount is required'
    };
  }

  const numValue = parseFloat(value);
  if (isNaN(numValue)) {
    return {
      isValid: false,
      error: 'Amount must be a valid number'
    };
  }

  if (numValue <= 0) {
    return {
      isValid: false,
      error: 'Amount must be greater than 0'
    };
  }

  return { isValid: true };
}
