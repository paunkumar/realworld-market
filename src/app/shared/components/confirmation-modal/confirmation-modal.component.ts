import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-confirmation-modal',
  templateUrl: './confirmation-modal.component.html',
  styleUrls: ['./confirmation-modal.component.css']
})
export class ConfirmationModalComponent {
  @Input() confirmationData: any;
  @Output() closeModal = new EventEmitter();
  @Output() confirmPurchase = new EventEmitter();
  imageLoading: boolean = true;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['confirmationData'] && !changes['confirmationData'].firstChange) {
      changes['confirmationData'].currentValue?.image.map((image: any, index: number) => {
        changes['confirmationData'].currentValue.image[index] = {image}
      })
    }
  }
}
