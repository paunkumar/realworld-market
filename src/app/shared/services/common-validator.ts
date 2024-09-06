import { AbstractControl, ValidatorFn, ValidationErrors } from "@angular/forms";
import Web3 from "web3";

/**
 * Validates wallet address
 * @param control
 * @returns wallet address
 */
export function walletValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    let valid;
    if(control.value == ''||control.value ==null) {
      valid = true;
    } else {
      valid = Web3.utils.isAddress(control.value);
    }
    return valid ? null : { walletValidator: true };
  };
}
