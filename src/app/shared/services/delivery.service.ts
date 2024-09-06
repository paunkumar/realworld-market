import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { IApiResponse } from '../utils/common.interface';

 interface DeliveryObject {
  user_id: string;
  address: string;
  nft_id: string;
  house_number: string;
  street: string;
  city: string;
  country: string;
  postal_code: number;
  quantity: number;
  status: string;
}

@Injectable({
  providedIn: 'root'
})

/**
 * Redeem/Delivery Service
 */
export class DeliveryService {



/**
 * constructor
 */
  constructor(
    private http: HttpClient
  ) { }


  /**
   * create redeem/delivery request
   * @param{RedeemObject} data
   * @returns
   */
    createDeliveryRequest(data: DeliveryObject):Observable<IApiResponse> {
      return this.http.post<IApiResponse>(`${environment.API_BASE_URL}/user/delivery-request`, data);
    }


  /**
   * cancel delivery
   * @param{string}id
   */
  cancelDeliveryRequest(id: string,payload:{user_id:string,status:number}):Observable<IApiResponse> {
    return this.http.post<IApiResponse>(`${environment.API_BASE_URL}/user/delivery-request?id=${id}`,payload);
  }

  /**
   * track delivery
   */
  trackDeliveryRequest(id: string): Observable<IApiResponse> {
    return this.http.get<IApiResponse>(`${environment.API_BASE_URL}/user/delivery-tracking?id=${id}`);
  }

}
