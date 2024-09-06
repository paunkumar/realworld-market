import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import pinataClient, { PinataPinOptions } from '@pinata/sdk';
import { environment } from 'src/environments/environment';
const pinata = new pinataClient(environment.PINATA_KEY, environment.PINATA_SECRET);

const options: PinataPinOptions = {
  pinataMetadata: {
    name: 'Metadata',
  },
  pinataOptions: {
    cidVersion: 0,
  },
};

@Injectable({
  providedIn: 'root'
})
export class ImageConversionService {
  // will remove this url when client enabled cors for crewines
  private corsAnywhereUrl = 'https://cors-anywhere.herokuapp.com/';

  constructor(private http: HttpClient) { }

  /**
   * Gets image file
   * @param imageUrl
   * @returns image file
   */
  public getImageFile(imageUrl: string) {
    return this.http.get(`${environment.API_BASE_URL}/admin/retrieve-url-data?url=${imageUrl}`);
  }

  /**
 * Uploads file
 * @param {file} file
 * @return {httpresponse}
 */
  public uploadFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
      headers: {
        'pinata_api_key': environment.PINATA_KEY,
        'pinata_secret_api_key': environment.PINATA_SECRET
      }
    });
  }

  /**
 * Upload Json
 * @param {object} data
 * @return {Observable}
 */
  public uploadJson(data: any) {
    return pinata.pinJSONToIPFS(data, options);
  }




}
