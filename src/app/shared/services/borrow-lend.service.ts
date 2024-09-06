import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { WebStorageService } from './web-storage.service';

@Injectable({
    providedIn: 'root'
})
export class BorrowLendService {

    constructor(
        private http: HttpClient,
        private webStorageService: WebStorageService
    ) { }

    public counterOffer(counterOfferData: any) {
        return this.http.post(`${environment.API_BASE_URL}/user/loan-request-bid`, counterOfferData);
    }

    public getActiveNegotiationById(id: string) {
        return this.http.get(`${environment.API_BASE_URL}/user/bids/user-loan-requests?id=${id}`);
    }

    public getLendingActivity(id: string, sort: string) {
        return this.http.get(`${environment.API_BASE_URL}/user/list-loan-details?id=${id}&loan_details=${sort}`);
    }

    public getLoanRequestsById(userId: string, page: number, limit: number) {
        return this.http.get(`${environment.API_BASE_URL}/user/active-loan-requests?id=${userId}&page=${page}&limit=${limit}`);
    }


    public getLoanRequests(page: number, limit: number) {
        return this.http.get(`${environment.API_BASE_URL}/user/active-loan-requests?page=${page}&limit=${limit}`);
    }

    public getUsersLiveBorrowing(userId: string, sort: string) {
        return this.http.get(`${environment.API_BASE_URL}/user/borrowers-accepted-unaccepted-loans?id=${userId}&action=${sort}`);
    }

    public getLenderLiveBorrowing(userId: string) {
        return this.http.get(`${environment.API_BASE_URL}/user/lender-live-loans?id=${userId}`);
    }

    public getRepayedAndForceClosedLoans(userId: string, sort: string) {
        return this.http.get(`${environment.API_BASE_URL}/user/repayed-closed-loans?id=${userId}&action=${sort}`);
    }

    public getNftsNotRequestedForLoan(borrowerId: string, collectionAddress: string, tokenId: number) {
        return this.http.get(`${environment.API_BASE_URL}/user/check-nft-available?address=${collectionAddress}&token_id=${tokenId}&id=${borrowerId}`);
    }

    public repayLoan(params: any) {
        return this.http.post(`${environment.API_BASE_URL}/user/repay-force-close-loan-request`, params);
    }

    async getSignature(params: any) {
        try {
            let user = JSON.parse(this.webStorageService.getLocalStorage('user') || '{}');
            params.accountId = user.fire_block_address;
            const result = await this.http.post(`${environment.API_BASE_URL}/user/fireblock-signature`, params).toPromise();
            return result;
        } catch (error) {
            console.error('Error fetching data:', error);
            throw error;
        }
    }

    async getLoanOfferSignature(params: any) {
        try {
            let user = JSON.parse(this.webStorageService.getLocalStorage('user') || '{}');
            params.accountId = user.fire_block_address;
            const result = await this.http.post(`${environment.API_BASE_URL_V2}/open-loan-request-bid-signature`, params).toPromise();
            return result;
        } catch (error) {
            console.error('Error fetching data:', error);
            throw error;
        }
    }

    public getUserLendingStatus(id: string) {
        return this.http.get(`${environment.API_BASE_URL}/user/is-lending-activity?id=${id}`);
    }

    public getUserBorrowStatus(id: string) {
        return this.http.get(`${environment.API_BASE_URL}/user/user-live-loans/?id=${id}`);
    }

    async getLoanStatus(id: string) {
        let loanStatus: any = await this.http.get(`${environment.API_BASE_URL}/user/is-loan-completed?id=${id}`).toPromise();
        return loanStatus.data.is_loan_completed
    }
}
