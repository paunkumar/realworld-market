import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {

  constructor(
    private http: HttpClient
  ) { }

  getTransactions(id: any, keyword: string = '') {
    return this.http.get(`${environment.API_BASE_URL}/user/list-transaction-logs-by-id?id=${id}&search=${keyword}`);
  }

  createTransaction(data: any, id: any = '') {
    if(id !== '') return firstValueFrom(this.http.post(`${environment.API_BASE_URL}/user/create-transaction-log?id=${id}`, data));
    else return firstValueFrom(this.http.post(`${environment.API_BASE_URL}/user/create-transaction-log`, data));
  }

  /**
   * Gets view transactions
   * @param {string} id 
   * @returns  
   */
  getViewTransactions(id:string){
    return this.http.get(`${environment.API_BASE_URL}/user/view-transaction-log?id=${id}`);
  }

  /**
   * Updates view transactions
   * @param {object} data 
   * @returns  
   */
  updateViewTransactions(data:object){
    return this.http.post(`${environment.API_BASE_URL}/user/view-transaction-log`,data);
  }

}
