import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { IApiResponse } from '../utils/common.interface';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AnnouncementService {

  constructor(private http:HttpClient) { }
  getAnnouncement():Observable<IApiResponse>{
    return this.http.get<IApiResponse>(`${environment.API_BASE_URL}/user/announcement`);
  }
}
