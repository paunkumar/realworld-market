import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[appPreventNegative]'
})
export class PreventNegativeDirective {


  constructor(private el: ElementRef) { }

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    this.preventNegativeValues();
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === '-' || event.key === 'Subtract') {
      event.preventDefault();
    }
  }
  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    const clipboardData = event.clipboardData!;
    const pastedText = clipboardData.getData('text');
    if (pastedText.includes('-')) {
      event.preventDefault();
    }
  }

  private preventNegativeValues(): void {
    const input = this.el.nativeElement.value;
    if (input.includes('-')) {
      this.el.nativeElement.value = input.replace(/-/g, '');
    }
  }

}
