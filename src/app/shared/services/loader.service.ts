import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoaderService {

  private loading = new BehaviorSubject<boolean>(false);

  public loadingObserve = this.loading.asObservable()
  
  constructor() {}

  show() {
    this.loading.next(true);
  }

  hide() {
    this.loading.next(false);
  }
}
