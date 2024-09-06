import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { IApiResponse } from '../utils/common.interface';

@Injectable({
  providedIn: 'root'
})
export class ExchangeService {

  constructor(
    private http: HttpClient
  ) { }

  public exchangeOrder(params: any) {
    return this.http.post(`${environment.API_BASE_URL}/user/exchange-nft`, params);
  }

  public updateSellOrder(orderId: string, params: any) {
    return this.http.patch(`${environment.API_BASE_URL}/user/exchange-nft?id=${orderId}`, params);
  }

  public createBid(params: any) {
    return this.http.post(`${environment.API_BASE_URL}/user/nft-bid`, params);
  }

  public updateBid(bidId: string, params: any) {
    return this.http.patch(`${environment.API_BASE_URL}/user/nft-bid?id=${bidId}`, params);
  }

  public cancelBid(bidId: string, params: any) {
    return this.http.patch(`${environment.API_BASE_URL}/user/nft-bid?id=${bidId}`, params);
  }

  public acceptBid(bidId: string) {
    return this.http.patch(`${environment.API_BASE_URL}/user/nft-bid-accept?id=${bidId}`, {});
  }

  /**
   * get bids
   * @param {string} nftId
   * @param {number} page
   * @param {number} limit
   */
  public getBids(nftId: string, page: number = 1, limit: number = 5) {
    return this.http.get<IApiResponse>(`${environment.API_BASE_URL}/user/nft-bids?nft=${nftId}&page=${page}&limit=${limit}`);
  }

  public getBid(bidId: string) {
    return firstValueFrom(this.http.get(`${environment.API_BASE_URL}/user/nft-bid-status?id=${bidId}`));
  }

  async getSignature(params: any) {
    try {
      const result = firstValueFrom(this.http.post(`${environment.API_BASE_URL}/user/nft-bid-signature`, params));
      return result;
    } catch (error) {
      console.error('Error fetching data:', error);
      throw error;
    }
  }
}
