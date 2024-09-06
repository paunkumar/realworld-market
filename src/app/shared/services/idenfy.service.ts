import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class IdenfyService {

  constructor(private http: HttpClient) { }

  generateToken(client: any) {
    return this.http.post(`https://ivs.idenfy.com/api/v2/token`, {clientId: client});
  }
}
