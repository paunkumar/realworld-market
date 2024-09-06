import { AfterViewInit, Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { WebStorageService } from '../../services/web-storage.service';

@Component({
  selector: 'app-progress-modal',
  templateUrl: './progress-modal.component.html',
  styleUrls: ['./progress-modal.component.css'],
})
export class ProgressModalComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  @Input() progressData: any;
  @Input() showEstimation: boolean = false;
  @Input() modalRef!: ModalDirective;
  @Output() closeModal = new EventEmitter();

  isRegulated: boolean = false;

  minutes: string = '00';
  seconds: string = '00';
  milliseconds: string = '00';
  countdownEnded: boolean = false;

  private totalDurationInS!: number;
  private totalDurationInMs!: number;
  private endTime!: number;
  private intervalId!: NodeJS.Timeout;

  imageLoading: boolean = true;

  constructor(private webStorageService: WebStorageService) {}

  ngOnInit(): void {
    this.isRegulated = JSON.parse(this.webStorageService.getLocalStorage('regulated') || 'true');
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['progressData'] && !changes['progressData'].firstChange) {
      changes['progressData'].currentValue?.image.map((image: any, index: number) => {
        changes['progressData'].currentValue.image[index] = { image };
      });
    }
  }

  ngAfterViewInit(): void {
    //Listens to this modal's onShown Event
    this.modalRef?.onShown.subscribe(() => {
      if(this.showEstimation) this.startCountDown(90);
    });
    this.modalRef?.onHidden.subscribe(()=>{
      this.resetTimer();
      this.countdownEnded = false;
    })
  }

  /**
   * Starts the countdown timer with a total duration in seconds.
   * The method calculates the end time based on the current time and the total duration.
   * It then sets up an interval that updates the remaining time every 10 milliseconds,
   * formatting the time into minutes, seconds, and milliseconds.
   * If the countdown reaches zero, the timer stops.
   * 
   * @param {number} totalDurationInS
   *
   */
  private startCountDown(totalDurationInS:number) {
    this.totalDurationInS = totalDurationInS
    this.totalDurationInMs = this.totalDurationInS * 1000;
    this.endTime = Date.now() + this.totalDurationInMs;
    this.intervalId = setInterval(() => {
      const remainingDuration: number = this.endTime - Date.now();

      if (remainingDuration > 0) {
        this.countdownEnded = false;
        const minutes = Math.floor((remainingDuration % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remainingDuration % (1000 * 60)) / 1000);

        this.minutes = String(minutes).padStart(2, '0');
        this.seconds = String(seconds).padStart(2, '0');
      } else {
        this.resetTimer();
        this.countdownEnded = true;
      }
    }, 10);
  }

  /**
   * Resets the countdown timer to its initial state.
   * The method sets the minutes, seconds, and milliseconds back to '00',
   * clears the interval that was set to update the countdown,
   * and marks the countdown as ended.
   *
   */
  private resetTimer() {
    this.minutes = '00';
    this.seconds = '00';
    this.milliseconds = '00';
    clearInterval(this.intervalId);
  }

  ngOnDestroy(): void {
    this.resetTimer();
  }
}
