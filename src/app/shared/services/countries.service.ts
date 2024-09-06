import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { COUNTRIES } from '../Hepler/countries';

@Injectable({
  providedIn: 'root'
})
export class CountryService {
  private countries:  { name: string, dialCode: string, flag: string, regionCode: string }[] = [];

  getCountries(): Observable<any[]> {
    if (!this.countries) {
      this.countries = COUNTRIES; // Load the data structure when requested for the first time
    }
    return of(this.countries);
  }
}
