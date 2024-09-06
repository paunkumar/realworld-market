import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OnboardAssetService {

  constructor(private http: HttpClient) { }

  /**
   * Determines whether board asset on
   * @param params
   * @returns
   */
  public onBoardAsset(params: any) {
    return this.http.post(`${environment.API_BASE_URL}/user/contact-us`, params);
  }

  /**
   * Gets all traits
   * @returns
   */
  public getAllTraits() {
    return this.http.get(`${environment.API_BASE_URL}/user/nfttraits`);
  }
}
