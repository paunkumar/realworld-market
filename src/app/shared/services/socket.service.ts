import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import io from 'socket.io-client';
import { environment } from 'src/environments/environment';
import { WebStorageService } from './web-storage.service';

@Injectable({
  providedIn: 'root'
})
export class SocketService {

  private socket: any;
  public notification$: BehaviorSubject<string> = new BehaviorSubject('');
  public marketPrice$: BehaviorSubject<number> = new BehaviorSubject(0);
  private deliveryStatus$: BehaviorSubject<{[key:string]:any}[]> = new BehaviorSubject([{}]);
  private currentDeliveryStatus$: BehaviorSubject<{[key:string]:any}> = new BehaviorSubject({});

  constructor(
    private webStorageService: WebStorageService
  ) { }

  connect() {
    let user: any = JSON.parse(this.webStorageService.getLocalStorage('user') || 'null');
    let regulated = this.webStorageService.getLocalStorage('regulated');
    if(user != null) {
      this.socket = io(`${environment.SOCKET_BASE_URL}?id=${user._id}&regulated=${regulated}`);
    } else this.socket = io(`${environment.SOCKET_BASE_URL}?regulated=${regulated}`)
  }

  disconnect() {
    if(this.socket) {
      // unsubscribe to events
      this.unsubscribeEvents();
      // disconnect socket
      this.socket.disconnect();
    }
  }

  unsubscribeEvents() {
    if(this.socket) {
      // unsubscribe to gold value update event and clear its value
      this.socket.off('GOLD_VALUE_UPDATED')
      this.marketPrice$.next(0);
    }
  }

  getNotification() {
    this.socket?.on('NOTIFICATION', (notification: any) => {
      this.notification$.next(notification);
    })

    return this.notification$.asObservable();
  }

  getDeliveryStatus() {
    this.socket?.on('DELIVERY_STATUS_UPDATE', (status: any) => {
      this.deliveryStatus$.next(status);
    })

    return this.deliveryStatus$.asObservable();
  }

  /**
   * get current delivery status of the nft
   */
  getCurrentDeliveryStatus() {
    this.socket?.on('NFT_DELIVERY_STATUS', (status: any) => {
      this.currentDeliveryStatus$.next(status);
    })

    return this.currentDeliveryStatus$.asObservable();
  }

  getMarketPrice() {
    this.socket?.on('GOLD_VALUE_UPDATED', ({gold_value}: any) => {
      this.marketPrice$.next(Number(gold_value));
    })

    return this.marketPrice$.asObservable();
  }
}
