import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * A custom password validator function that checks the strength of a password.
 * It ensures that the password meets the following criteria:
 * - Contains at least one uppercase letter.
 * - Contains at least one lowercase letter.
 * - Contains at least one numeric digit.
 * - Contains at least one special character (e.g., !@#$%^&*).
 * - Has a minimum length of 12 characters.
 *
 * @returns {ValidatorFn} A ValidatorFn that returns a ValidationErrors object
 *                        if the password does not meet the criteria, or null if it does.
 */
export function customPasswordValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) {
      return null;
    }

    const hasUpperCase = /[A-Z]+/.test(value);
    const hasLowerCase = /[a-z]+/.test(value);
    const hasNumeric = /[0-9]+/.test(value);
    const hasSpecialCharacters = /[!@#$%^&*]+/.test(value);
    const hasMinLength = value.length >= 12;
    const passwordValid = hasUpperCase && hasLowerCase && hasNumeric && hasSpecialCharacters && hasMinLength;
    return !passwordValid
      ? {
          passwordStrength: {
            hasUpperCase: hasUpperCase,
            hasLowerCase: hasLowerCase,
            hasNumeric: hasNumeric,
            hasSpecialCharacters: hasSpecialCharacters,
            hasMinlength: hasMinLength,
          },
        }
      : null;
  };
}
