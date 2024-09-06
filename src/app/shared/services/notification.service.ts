import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor(
    private http: HttpClient
  ) { }

  getNotifications(userId: string) {
    return this.http.get(`${environment.API_BASE_URL}/user/list-notification?id=${userId}`);
  }

  readNotification(data: any) {
    return this.http.patch(`${environment.API_BASE_URL}/user/read-notification`, data);
  }

  deleteNotification(notificationId: any) {
    return this.http.get(`${environment.API_BASE_URL}/user/delete-notification?id=${notificationId}`);
  }
}
