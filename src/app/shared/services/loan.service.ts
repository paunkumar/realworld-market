import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root'
})
export class LoanService {

    constructor(
        private http: HttpClient
    ) { }

    public getLoanRequestDays() {
        return this.http.get(`${environment.API_BASE_URL}/user/days`);
    }

    public requestLoan(params: any) {
        return this.http.post(`${environment.API_BASE_URL}/user/loan-request`, params);
    }

    public editRequestLoan(id: string, params: any) {
        return this.http.patch(`${environment.API_BASE_URL}/user/loan-request?id=${id}`, params);
    }

    public getLoanRequestHistory(id: string) {
        return this.http.get(`${environment.API_BASE_URL}/user/not-bidded-loan-requests?id=${id}`);
    }

    public cancelLoan(id: any) {
        return this.http.delete(`${environment.API_BASE_URL}/user/loan-request?id=${id}`);
    }

    public getLoanRequest(id: any) {
        return this.http.get(`${environment.API_BASE_URL}/user/bids-for-loan-request?id=${id}`);
    }

    public getLoanRequestByNftId(id: any) {
        return this.http.get(`${environment.API_BASE_URL}/user/active-loan-request-by-nft-id?id=${id}`);
    }

    public createLoanOffer(params: any) {
        return this.http.post(`${environment.API_BASE_URL_V2}/open-loan-request-bid`, params);
    }

    public getLoanOffers(id: any) {
        return this.http.get(`${environment.API_BASE_URL_V2}/open-loan-request-bids?nft_id=${id}`);
    }

    public updateLoanOffer(id: string, params: any) {
        return this.http.patch(`${environment.API_BASE_URL_V2}/accept-cancel-open-loan-request-bid?id=${id}`, params);
    }

    public editLoanOffer(id: string, params: any) {
        return this.http.patch(`${environment.API_BASE_URL_V2}/open-loan-request-bid?id=${id}`, params);
    }
}
