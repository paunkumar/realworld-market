import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ManageDocumentService {

  constructor(
    private http:HttpClient
  ) { }
 
  /**
   * Gets document
   * * @param {string} service_type 
   * @returns  
   */
  getDocument(service_type:string){
    return this.http.get(`${environment.API_BASE_URL}/file-upload/policy-document`, {
      headers: {
        'service_type': service_type
      }
    }
    );
  }

}
