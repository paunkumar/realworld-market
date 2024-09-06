import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { IApiResponse } from '../utils/common.interface';


@Injectable({
    providedIn: 'root'
})
export class FaqManagementService {

    constructor(private http: HttpClient) { }

    /**
     * Gets faq
     * @param {string} search
     * @param {string} categoryId
     * @param {string} selected
     * @returns
     */
    getFaq(search: string, categoryId: string, selected: string): Observable<IApiResponse> {
        return this.http.get<IApiResponse>(`${environment.API_BASE_URL}/user/faq-list?search=${search}&categoryId=${categoryId}&selected=${selected}`);
    }

    /**
     * Gets Category
     * @returns
     */
    getCategory() {
        return this.http.get(`${environment.API_BASE_URL}/user/faq-categories`);
    }

}
