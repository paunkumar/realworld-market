import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({
  name: 'safeHtml'
})
export class SafeHtmlPipe implements PipeTransform {
  constructor(private domsanstizer: DomSanitizer){

  }
  transform(url: any) {
    return this.domsanstizer.bypassSecurityTrustHtml(url);
  }
}
