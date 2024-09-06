import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { IApiResponse } from '../utils/common.interface';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  constructor(
    private http: HttpClient
  ) {}

  /**
   * Nft Details Count by id
   * @param {string} id
   */
  nftDetailsCountById(id:string){
    return this.http.get(`${environment.API_BASE_URL}/user/nft-transaction-details?id=${id}`);
  }

  /**
   * Borrowing history by id
   * @param {string} id
   */
  borrowingHistoryById(id:string){
    return this.http.get(`${environment.API_BASE_URL}/user/borrowing-history?id=${id}`);
  }

  /**
   * Lending history by id
   * @param {string} id
   * @returns
   */
  lendingHistoryById(id:string){
    return this.http.get(`${environment.API_BASE_URL}/user/lending-history?id=${id}`);
  }

  /**
   * Logs by user
   * @param {string} walletAddress
   * @param {number} page
   * @param {number} limit
   */
  logsByUser(walletAddress:string,page:number,limit:number):Observable<IApiResponse>{
    return this.http.get<IApiResponse>(`${environment.API_BASE_URL}/user/list-logs-by-user?wallet_address=${walletAddress}&page=${page}&limit=${limit}`);
  }

  /**
   * Logs by id
   * @param {string} id
   */
  logsById(id:string){
    return this.http.get(`${environment.API_BASE_URL}/logs?id=${id}`);
  }

}
