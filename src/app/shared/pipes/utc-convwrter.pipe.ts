import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'utcConverter'
})

export class UtcConverterPipe implements PipeTransform {
  transform(localTime: string): string {
    const localDate = new Date(localTime);
    const utcDate = new Date(localDate.toUTCString());

    // Format the UTC date as needed
    const formattedUtcDate = utcDate.toISOString().slice(0, 19).replace("T", " ");

    return formattedUtcDate;
  }
}
