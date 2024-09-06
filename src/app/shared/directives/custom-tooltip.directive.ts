import { Directive, ElementRef, HostListener, Input, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appCustomTooltip]'
})
export class CustomTooltipDirective {

  @Input() appTooltip: string = '';

  private tooltipElement!: HTMLElement;

  constructor(private el: ElementRef, private renderer: Renderer2) {
    this.createTooltip();
  }

  private createTooltip() {
    this.tooltipElement = this.renderer.createElement('div');
    this.renderer.addClass(this.tooltipElement, 'custom-tooltip');
    this.renderer.appendChild(this.tooltipElement, this.renderer.createText(this.appTooltip));
    this.renderer.appendChild(document.body, this.tooltipElement);
    this.renderer.setStyle(this.tooltipElement, 'display', 'none');
  }

  @HostListener('mouseenter') onMouseEnter() {
    const rect = this.el.nativeElement.getBoundingClientRect();
    const top = rect.bottom + 5;
    const left = rect.left + (rect.width - this.tooltipElement.offsetWidth) / 2;

    this.renderer.setStyle(this.tooltipElement, 'top', `${top}px`);
    this.renderer.setStyle(this.tooltipElement, 'left', `${left}px`);
    this.renderer.setStyle(this.tooltipElement, 'display', 'block');
  }

  @HostListener('mouseleave') onMouseLeave() {
    this.renderer.setStyle(this.tooltipElement, 'display', 'none');
  }

}
