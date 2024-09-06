import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'thousandSeparator'
})

/**
 * Thousand Separator Pipe
 */
export class ThousandSeparatorPipe implements PipeTransform {

  /**
   *
   * @param{number} value
   * @param{string} separator
   * @return {number}
   */

  transform(value: any): string {
    if (value == null || value === undefined) {
      return 'NA';
    }

    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  }


}
