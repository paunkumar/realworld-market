import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, catchError, forkJoin, map, of } from 'rxjs';
import { environment } from 'src/environments/environment';
import { TRANSACTIONS_TYPE } from '../../Hepler/helper';
import { CopyDirective } from '../../directives/copy.directive';
import { Erc20ContractService } from '../../services/erc20-contract.service';
import { WebStorageService } from '../../services/web-storage.service';
import { IPagination } from '../../utils/common.interface';
import { ITransactionParams } from './transaction-logs.interface';

@Component({
    selector: 'app-transaction-logs',
    templateUrl: './transaction-logs.component.html',
    styleUrls: ['./transaction-logs.component.css']
})

/**
 * All Transaction Logs Component
*/
export class TransactionLogsComponent implements OnInit, OnDestroy {

    transactionLogs: { [key: string]: any }[] = [];
    private nftTokenId = '';
    private nftCollection = '';
    private nftId = '';
    private routeSubscription!: Subscription;
    private queryParamSubscription!: Subscription;
    @Output() goBackEmitter = new EventEmitter();
    userDetails: any = [];
    transhUrl: string = '';
    account: any;
    regulated: boolean = false;
    paginationData: IPagination;
    pageType = TRANSACTIONS_TYPE.NFT_TRANSACTIONS;
    nftParams: ITransactionParams;



    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private copyDirective: CopyDirective,
        private webStorageService: WebStorageService,
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
        this.nftParams = {
            nftCollection: '',
            nftTokenId: '',
            nftId: '',
        }
    }

    /**
   * on init
   */
    ngOnInit() {
        this.account = this.webStorageService.getLocalStorage('account') != null ? JSON.parse(this.webStorageService.getLocalStorage('account') || '') : this.account;
        this.transhUrl = this.account?.chainId ? (environment as any)[this.account?.chainId].EXPLORER : (environment as any)[environment.DEFAULT_CHAIN].EXPLORER
        this.regulated = JSON.parse(this.webStorageService.getLocalStorage('regulated') || 'true');
        this.routeSubscription = this.route.params.subscribe(params => {
            this.nftCollection = params['collection'];
            this.nftTokenId = params['tokenId']
            this.nftId = params['id'];
            this.nftParams = {
                nftCollection: this.nftCollection,
                nftTokenId: this.nftTokenId,
                nftId: this.nftId
            }
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
        this.queryParamSubscription = this.route.queryParams.subscribe(params => {
            let updatedParams = { ...params };
            updatedParams['showAll'] = false;

            // Navigate with the updated query parameters
            this.router.navigate([], {
                relativeTo: this.route,
                queryParams: updatedParams,
                queryParamsHandling: 'merge'
            });
        });
        this.goBackEmitter.emit();

    }

    /**
     * get all transaction logs (history)
     * @param {{[key:string]:any}} data
     */
    getNftAnalytics(data: { [key: string]: any }) {
        this.transactionLogs = data?.['transaction_logs'];
        this.populateContractNames();
    }

    /**
   * populate names based on the contract address
   */
    private async populateContractNames() {
        const nameRequests = this.transactionLogs.map((log: { [key: string]: any }) => {
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
            this.transactionLogs = updatedLogs;
        });
    }

    /**
     * on destroy
     */
    ngOnDestroy(): void {
        this.routeSubscription?.unsubscribe();
        this.queryParamSubscription?.unsubscribe();
    }


}
