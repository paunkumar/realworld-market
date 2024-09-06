import { Directive } from '@angular/core';
import { ClipboardService } from 'ngx-clipboard';
import { ToastrService } from 'ngx-toastr';

@Directive({
  selector: '[appCopy]'
})
export class CopyDirective {

  constructor(
    private toastr:ToastrService,
    private clibboard:ClipboardService,
  ){}


    /**
 * Copys
 * @param content
 * @returns
 */
  copy(content: any) {
  this.clibboard.copyFromContent(content);
  this.toastr.success('Copied successfully.');

}

}
