import { Location } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { catchError, forkJoin, map, of } from 'rxjs';
import { CopyDirective } from 'src/app/shared/directives/copy.directive';
import { AccountService } from 'src/app/shared/services/account.service';
import { DashboardService } from 'src/app/shared/services/dashboard.service';
import { Erc20ContractService } from 'src/app/shared/services/erc20-contract.service';
import { WebStorageService } from 'src/app/shared/services/web-storage.service';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-single-transaction-details',
    templateUrl: './single-transaction-details.component.html',
    styleUrls: ['./single-transaction-details.component.css']
})
export class SingleTransactionDetailsComponent {
    userLogs: any;
    userDetails: any = [];
    transhUrl: string = '';
    account: any;
    regulated: boolean = false;
    limit: number = 10;
    page: number = 1;
    userId: any;
    userData: any = [];
    loader = false;

    constructor(
        private dashboardService: DashboardService,
        private toastr: ToastrService,
        private webStorageService: WebStorageService,
        private copyDirective: CopyDirective,
        private location: Location,
        private route: ActivatedRoute,
        private accountService: AccountService,
        private erc20ContractService: Erc20ContractService,
    ) { }

    /**
   * on init
   */
    ngOnInit() {
        this.userId = this.route.snapshot.paramMap.get('id');
        this.account = this.webStorageService.getLocalStorage('account') != null ? JSON.parse(this.webStorageService.getLocalStorage('account') || '') : this.account;
        this.transhUrl = (environment as any)[this.account.chainId].EXPLORER
        this.userDetails = JSON.parse(localStorage.getItem('user') as any);
        this.regulated = JSON.parse(this.webStorageService.getLocalStorage('regulated') || 'true');
        if (this.userDetails?.wallet_address) {
            this.getUserDetails()
        }
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

    /**
     * Gets user details
     */
    async getUserDetails() {
        this.loader = true;
        this.dashboardService.logsById(this.userId).subscribe(async (response: any) => {
            this.loader = false;
            this.userData = response.data;
            if (this.userData) {
                await this.populateContractNameForLog(this.userData);
                this.userData = { ...this.userData };
            }

        },
            async (error) => {
                this.loader = false;
                if (error?.error?.status_code === 401) {
                    error.shortMessage = "Authentication failed. Login again to continue.";
                    await this.accountService.updateAuthentication(false);
                }
                this.toastr.error(error.error.message)
            }
        )
    }
    /**
   * populate names based on the contract address
   */
    private async populateContractNameForLog(log: { [key: string]: any }) {
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
        ).toPromise();
    }


}
