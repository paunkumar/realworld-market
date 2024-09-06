import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import moment from 'moment';
import { OwlOptions } from 'ngx-owl-carousel-o';
import { ToastrService } from 'ngx-toastr';
import { catchError, forkJoin, from, map, of, switchMap } from 'rxjs';
import { CopyDirective } from 'src/app/shared/directives/copy.directive';
import { AccountService } from 'src/app/shared/services/account.service';
import { BorrowLendService } from 'src/app/shared/services/borrow-lend.service';
import { CommonService } from 'src/app/shared/services/common.service';
import { DashboardService } from 'src/app/shared/services/dashboard.service';
import { Erc20ContractService } from 'src/app/shared/services/erc20-contract.service';
import { WebStorageService } from 'src/app/shared/services/web-storage.service';
import { environment } from 'src/environments/environment';
import Web3 from 'web3';

const web3 = new Web3((environment as any)[environment.DEFAULT_CHAIN].PROVIDER);

@Component({
    selector: 'app-new-dashboard',
    templateUrl: './new-dashboard.component.html',
    styleUrls: ['./new-dashboard.component.css']
})
export class NewDashboardComponent implements OnInit {
    menuList = ['Borrowing.', 'Lending.'];
    menuview: any;
    userDetails: any = [];
    nftCounts: any;
    borrowingHistoryDetails: any = [];
    lendingHistoryDetails: any = [];
    userLogs: any;
    regulated: boolean = false;
    transhUrl: string = '';
    account: any;
    allLogsDetailsLength!: number;
    isLoadingData: boolean = false;
    borrowingHistoryDetailsLength!: number;
    lendingHistoryDetailsLength!: number;
    borrowLoader: boolean = false;
    lendLoader: boolean = false;
    user: any;

    constructor(
        private dashboardService: DashboardService,
        private toastr: ToastrService,
        private webStorageService: WebStorageService,
        private accountService: AccountService,
        private copyDirective: CopyDirective,
        private commonService: CommonService,
        private borrowLendService: BorrowLendService,
        private router: Router,
        private erc20ContractService: Erc20ContractService,
    ) { }

    /**
     * on init
     */

    async ngOnInit() {
        this.user = this.webStorageService.getLocalStorage('user') != null ? JSON.parse(this.webStorageService.getLocalStorage('user') || 'undefined') : this.user;
        this.menuview = this.menuList[0];
        this.account = this.webStorageService.getLocalStorage('account') != null ? JSON.parse(this.webStorageService.getLocalStorage('account') || '') : this.account;
        this.userDetails = JSON.parse(localStorage.getItem('user') as any);
        // let c = await this.erc20ContractService.getContractName(this.account.networkId, '0xd22d6c15c59a55ac9eb24784737294653cb534aa');

        this.regulated = JSON.parse(this.webStorageService.getLocalStorage('regulated') || 'true');
        this.commonService.setTabEmitter({ type: 'dashboard' })
        if (this.userDetails?.wallet_address) {
            this.nftDetailsCount();
            this.borrowingHistory();
            this.lendingHistory();
            this.getUserLogs();
            this.transhUrl = (environment as any)[this.account.chainId].EXPLORER
        }
    }

    /**
     * Borrows lend
     * @param menu
     */
    borrowLend(menu: any) {
        this.menuview = menu;
    }
    customOptions: OwlOptions = {
        loop: false,
        margin: 10,
        autoplay: true,
        autoWidth: true,
        autoHeight: true,
        dots: true,
        nav: false,
        items: 1,
    }

    /**
     * Nfts details count
     */
    nftDetailsCount() {
        this.dashboardService.nftDetailsCountById(this.userDetails?._id).subscribe((response: any) => {
            this.nftCounts = response.data;
        },
            (error: any) => {
                this.handleError(error);
            }
        )
    }

    /**
     * Borrowing history
     */
    borrowingHistory() {
        this.borrowLoader = true;
        this.dashboardService.borrowingHistoryById(this.userDetails?._id).subscribe((response: any) => {
            if (response?.data?.docs?.length === 0) this.menuview = this.menuList[1]
            this.borrowLoader = false;
            this.borrowingHistoryDetails = response.data.docs;
            this.borrowingHistoryDetailsLength = response.data.totalDocs;
        },
            (error: any) => {
                this.borrowLoader = false;
                this.handleError(error);
            }
        )
    }

    /**
     * Lending history
     */
    lendingHistory() {
        this.lendLoader = true;
        this.dashboardService.lendingHistoryById(this.userDetails?._id).subscribe((response: any) => {
            if (response?.data?.docs?.length === 0) this.menuview = this.menuList[0]
            this.lendLoader = false;
            this.lendingHistoryDetails = response.data.docs;
            this.lendingHistoryDetailsLength = response.data.totalDocs;
        },
            (error: any) => {
                this.lendLoader = false;
                this.handleError(error);
            }
        )
    }

    /**
     * Gets user logs
     */
    getUserLogs() {
        this.isLoadingData = true;
        this.dashboardService.logsByUser(this.userDetails.wallet_address, 1, 8).subscribe((response: any) => {
            this.isLoadingData = false;
            this.userLogs = response.data.docs;
            this.allLogsDetailsLength = this.userLogs.length;
            this.populateContractNames();
        },
            (error) => {
                this.handleError(error);
                this.isLoadingData = false;
            }
        )
    }

    /**
     * populate names based on the contract address
     */
    private async populateContractNames() {
        const nameRequests = this.userLogs.map((log: { [key: string]: any }) => {
            const senderName$ = log['sender']?.name
                ? of(log['sender'].name)
                : this.erc20ContractService.getContractName(this.account.networkId, log['from']).pipe(
                    switchMap((code) => {
                        if (code !== '0x') {
                            return this.erc20ContractService.getContractName(this.account.networkId, log['from']).pipe(
                                catchError((err) => {
                                    return of(log['from']);  // Return the 'to' address on error
                                })
                            );
                        } else {
                            return of(log['from']);  // Return the 'to' address if the code is '0x'
                        }
                    }),
                    catchError((err) => {
                        return of(log['from']);  // Return the 'to' address on outer observable error
                    })
                );

            const receiverName$ = log['receiver']?.name
                ? of(log['receiver'].name)
                : from(web3.eth.getCode(log['to'])).pipe(
                    switchMap((code) => {
                        if (code !== '0x') {
                            return this.erc20ContractService.getContractName(this.account.networkId, log['to']).pipe(
                                catchError((err) => {
                                    return of(log['to']);  // Return the 'to' address on error
                                })
                            );
                        } else {
                            return of(log['to']);  // Return the 'to' address if the code is '0x'
                        }
                    }),
                    catchError((err) => {
                        return of(log['to']);  // Return the 'to' address on outer observable error
                    })
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
     * Connects wallet
     */
    async connectWallet() {
        await this.accountService.enableMetaMaskConnection(true)
    }

    /**
    * Copys content
    * @param content
    */
    public copy(content: string) {
        this.copyDirective.copy(content)
    }

    /**
     * Calculates diff
     * @param {any} dateSent
     * @returns
     */
    calculateDiff(dateSent: any) {
        let currentDate = new Date();
        dateSent = new Date(dateSent);
        const seconds = Math.floor((currentDate.getTime() - dateSent.getTime()) / 1000);
        let className;
        if (seconds <= 86400) {
            className = 'dueDetail';
        }
        else if (seconds <= 604800) {
            className = 'forloanDetail';
        }
        else {
            className = '';
        }
        return className;

    }

    /**
     * Determines whether menu click on
     * @param {string} menu
     */
    onMenuClick(menu: string) {
        this.commonService.setTabEmitter({ type: menu });
    }

    setRoute() {
        this.webStorageService.setItem('previousRoute', this.router.url)
    }

    redirectToLend() {
        this.commonService.setTabEmitter({ type: 'lend' });
        if (this.user?._id) {
            this.borrowLendService.getUserLendingStatus(this.user?._id).subscribe({
                next: async (res: any) => {
                    const url = res.data?.is_lender_activity ? '/lending-history' : '/lend';
                    this.openUrlInNewTab(url);
                },
                error: async (error: any) => {
                    if (error?.error?.status_code === 401) {
                        error.shortMessage = "Authentication failed. Login again to continue.";
                        await this.accountService.updateAuthentication(false);
                    } else this.openUrlInNewTab('/lend');
                }
            })
        } else {
            this.openUrlInNewTab('/lend');
        }
    }

    redirectToBorrow() {
        this.commonService.setTabEmitter({ type: 'borrow' });
        if (this.user?._id) {
            this.borrowLendService.getUserBorrowStatus(this.user?._id).subscribe({
                next: async (res: any) => {
                    if (!res.data?.hasLiveLoans) this.router.navigate(['/loan-request']);
                    else this.router.navigate(['/borrow']);
                },
                error: (error: any) => {
                    this.router.navigate(['/borrow']);
                }
            })
        } else {
            this.router.navigate(['/borrow']);
        }
    }

    async handleError(error: any) {
        if (error?.error?.status_code === 401) {
            error.shortMessage = "Authentication failed. Login again to continue.";
            await this.accountService.updateAuthentication(false);
        }
        this.toastr.error(error?.error?.message || error?.error?.data?.message || error.shortMessage || "Something went wrong, try again later.");
    }

    private openUrlInNewTab(url: string) {
        const win = window.open(url, '_blank');
        win?.focus(); // Focus the new tab for better user experience
    }

    isLiveLoan(loan: any) {
        let LOAN_IN_DAYS = this.account.chainId ? (environment as any)[this.account.chainId].LOAN_IN_DAYS : (environment as any)['DEFAULT_NETWORK'].LOAN_IN_DAYS;
        if (environment.ENVNAME === 'DEVELOPMENT') loan.end_date = moment(loan.start_date).clone().add(loan.loan_duration_days, LOAN_IN_DAYS ? 'days' : 'hours').toISOString()
        return moment(moment().format("YYYY-MM-DD, hh:mm a"), 'YYYY-MM-DD, hh:mm a').isBefore(moment(moment(loan?.end_date).format("YYYY-MM-DD, hh:mm a"), 'YYYY-MM-DD, hh:mm a'))
    }

}
