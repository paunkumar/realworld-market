import { Location } from '@angular/common';
import { Component } from '@angular/core';
import { catchError, forkJoin, map, of } from 'rxjs';
import { TRANSACTIONS_TYPE } from 'src/app/shared/Hepler/helper';
import { CopyDirective } from 'src/app/shared/directives/copy.directive';
import { Erc20ContractService } from 'src/app/shared/services/erc20-contract.service';
import { WebStorageService } from 'src/app/shared/services/web-storage.service';
import { IPagination } from 'src/app/shared/utils/common.interface';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-transactions-details',
    templateUrl: './transactions-details.component.html',
    styleUrls: ['./transactions-details.component.css']
})
export class TransactionsDetailsComponent {
    userLogs: any;
    userDetails: any = [];
    transhUrl: string = '';
    account: any;
    regulated: boolean = false;
    paginationData: IPagination;
    pageType = TRANSACTIONS_TYPE.USER_TRANSACTIONS

    constructor(
        private webStorageService: WebStorageService,
        private copyDirective: CopyDirective,
        private location: Location,
        private erc20ContractService: Erc20ContractService,

    ) {
        this.paginationData = {
            totalDocs: 0,
            limit: 10,
            totalPages: 1,
            page: 1,
            pagingCounter: 1,
            hasPrevPage: false,
            hasNext_page: false,
            prevPage: null,
            nextPage: null
        };
    }

    /**
   * on init
   */
    ngOnInit() {
        this.account = this.webStorageService.getLocalStorage('account') != null ? JSON.parse(this.webStorageService.getLocalStorage('account') || '') : this.account;
        this.transhUrl = (environment as any)[this.account.chainId].EXPLORER
        this.userDetails = JSON.parse(localStorage.getItem('user') as any);
        this.regulated = JSON.parse(this.webStorageService.getLocalStorage('regulated') || 'true');
    }

    /**
     * Gets user logs
     * @param{{[key:string]:any}}data
     */
    getUserLogs(data: { [key: string]: any }) {
        this.userLogs = data;
        this.populateContractNames();
    }

    /**
   * populate names based on the contract address
   */
    private async populateContractNames() {
        const nameRequests = this.userLogs.map((log: { [key: string]: any }) => {
            const senderName$ = log['sender']?.name
                ? of(log['sender'].name)
                : this.erc20ContractService.getContractName(this.userDetails.networkId, log['from']).pipe(
                    catchError(() => of(log['from']))
                );

            const receiverName$ = log['receiver']?.name
                ? of(log['receiver'].name)
                : this.erc20ContractService.getContractName(this.userDetails.networkId, log['to']).pipe(
                    catchError(() => of(log['to']))
                );

            return forkJoin([senderName$, receiverName$]).pipe(
                map(([senderName, receiverName]) => {
                    if (!log['sender']?.name && senderName) {
                        log['sender'] = { ...log['sender'], name: senderName };
                    }
                    if (receiverName.toLowerCase() === 'exchange') receiverName = 'Marketplace';
                    if (!log['receiver']?.name && receiverName) {
                        log['receiver'] = { ...log['receiver'], name: receiverName };
                    }
                    return log;
                })
            );
        });

        forkJoin(nameRequests).subscribe(updatedLogs => {
            this.userLogs = updatedLogs;
            console.log('Updated logs with contract names:', this.userLogs);
        });
    }



    /**
      * Track by function for ngFor loops
      * @param index
      * @param item
      */
    public trackByFn(index: number, item: any): any {
        return item._id || index;
    }

    /**
     * Copys content
     * @param content
     */
    public copy(content: string) {
        this.copyDirective.copy(content)
    }

    /**
     * Go back
     */
    public goBack() {
        this.location.back();
    }
}

