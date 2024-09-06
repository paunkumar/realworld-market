import { Component } from '@angular/core';
import { Router } from '@angular/router';
import moment from 'moment';
import { ToastrService } from 'ngx-toastr';
import { AccountService } from 'src/app/shared/services/account.service';
import { BorrowLendService } from 'src/app/shared/services/borrow-lend.service';
import { CommonService } from 'src/app/shared/services/common.service';
import { WebStorageService } from 'src/app/shared/services/web-storage.service';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-lending-history',
    templateUrl: './lending-history.component.html',
    styleUrls: ['./lending-history.component.css']
})
export class LendingHistoryComponent {
    Math: any = Math;
    public isGridView: boolean = true;
    activity: any[] = [];
    user: any;
    account: any;
    imageLoading: boolean = true;
    regulated: boolean = false;
    sortValue: string = '';
    loader: boolean = false;
    showoverlay: boolean = false;
    currencyConversions: any[] = [];
    currencies: any[] = []

    constructor(
        private commonService: CommonService,
        private borrowLendService: BorrowLendService,
        private webStorageService: WebStorageService,
        private toastr: ToastrService,
        private accountService: AccountService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.account = this.webStorageService.getLocalStorage('account') != null ? JSON.parse(this.webStorageService.getLocalStorage('account') || '') : this.account;
        this.user = this.webStorageService.getLocalStorage('user') != null ? JSON.parse(this.webStorageService.getLocalStorage('user') || 'undefined') : this.user;
        this.regulated = JSON.parse(this.webStorageService.getLocalStorage('regulated') || 'true');

        if (this.user) {
            this.loader = true;
            this.getCurrencies();
        }

        this.commonService.showGridViewObservable.subscribe((response: boolean) => {
            if (response) {
                this.isGridView = response;
            } else {
                this.isGridView = response;
            }
        })
        this.commonService.setTabEmitter({ type: 'lend' });
        this.commonService.showmodaloverlayObservable.subscribe((response: boolean) => this.showoverlay = response)
    }

    closeOverlay() {
        this.showoverlay = false;
        this.commonService.setOverlay(false)
    }

    getLendingActivity() {
        this.borrowLendService.getLendingActivity(this.user?._id, this.sortValue).subscribe({
            next: async (res: any) => {
                this.activity = res.data;
                for (const loanRequest of this.activity) {
                    let appraisalValue = 0;
                    for (const [index, asset] of loanRequest.collateral_assets.entries()) {
                        let attribute = asset.attributes.find((item: any) => item.key.toLowerCase() === 'appraisal value');
                        appraisalValue += await this.setExchangePrice(asset, attribute.value);
                        asset.fileType = asset.preview_image ? asset?.preview_image.split('.')[asset?.preview_image.split('.').length - 1] : asset?.primary_media.split('.')[asset?.primary_media.split('.').length - 1]
                        if (index === loanRequest.collateral_assets.length - 1) loanRequest.appraisalValue = appraisalValue > 0 ? appraisalValue : '-';
                    }
                }
                this.setTooltip(this?.activity);
                this.loader = false;
            },
            error: async (error: any) => {
                this.handleError(error);
            }
        })
    }

    getCurrencies() {
        this.commonService.getCurrencies().subscribe({
            next: async (response: any) => {
                this.currencies = response.data;
                this.getLendingActivity()
            },
            error: (error) => {
                this.handleError(error);
            }
        })
    }

    setExchangePrice = async (nft: any, item: any) => {
        let index = this.currencyConversions.findIndex((item) => item.address === nft.currency?.address);
        let value: number;
        if (index >= 0) {
            value = this.currencyConversions[index].value === 0 ? Math.ceil(item) : Math.ceil(item / this.currencyConversions[index].value);
        } else {
            let storedUsdPrice: any = JSON.parse(await this.webStorageService.getLocalStorage('usdPrice') || '{}');
            let usdPrice = 0;
            try {
                let response: any = await this.commonService.getTokenPrice(nft.currency?.address);
                usdPrice = response[nft.currency?.address.toLowerCase()]?.usd || 1;
                console.log('try', nft.currency?.address)
            } catch (error) {
                if (Object.keys(storedUsdPrice).length > 0 && storedUsdPrice[nft.currency?.address.toLowerCase()] > 0) {
                    usdPrice = storedUsdPrice[nft.currency?.address.toLowerCase()];
                } else {
                    let currency = this.currencies.find((currency) => currency.address.toLowerCase() === nft.currency?.address.toLowerCase());
                    usdPrice = currency.usd_value || 1
                }
            }
            storedUsdPrice[nft.currency?.address.toLowerCase()] = usdPrice || 1
            this.webStorageService.setLocalStorage('usdPrice', JSON.stringify(storedUsdPrice));
            this.currencyConversions.push({ address: nft.currency?.address, value: usdPrice });
            value = Math.ceil(item * usdPrice);
        }
        return value;
    }

    async connectWallet() {
        await this.accountService.enableMetaMaskConnection(true)
    }

    sort(event: any) {
        this.sortValue = event.target.value;
        this.getLendingActivity();
    }

    /**
     * Sets tooltip
     * @param {any} allNfts
     */
    public setTooltip(allNfts: any) {
        setTimeout(() => {
            allNfts.forEach((_response: any, index: any) => {
                if ((<HTMLElement>document.getElementById(`tooltiptitle${index}`)).scrollHeight > 59) {
                    (<HTMLElement>document.getElementById(`tooltipdescription${index}`)).style.display = 'block';
                    (<HTMLElement>document.getElementById(`tooltiphead${index}`)).classList.add('text-content');

                }
                else {
                    (<HTMLElement>document.getElementById(`tooltipdescription${index}`)).style.display = 'none';
                    (<HTMLElement>document.getElementById(`tooltiphead${index}`)).classList.remove('text-content');
                }
            })
        }, 1000);
    }

    /**
     * Sets tooltip based on screen size
     * @param {number} index
     */
    public setTooltipSize(index: number) {
        if ((<HTMLElement>document.getElementById(`tooltiptitle${index}`)).scrollHeight > 59) {
            (<HTMLElement>document.getElementById(`tooltipdescription${index}`)).style.display = 'block';
            (<HTMLElement>document.getElementById(`tooltiphead${index}`)).classList.add('text-content');

        }
        else {
            (<HTMLElement>document.getElementById(`tooltipdescription${index}`)).style.display = 'none';
            (<HTMLElement>document.getElementById(`tooltiphead${index}`)).classList.remove('text-content');
        }
    }

    setRoute() {
        this.webStorageService.setItem('previousRoute', this.router.url)
    }

    async handleError(error: any) {
        if (error?.error?.status_code === 401) {
            error.shortMessage = "Authentication failed. Login again to continue.";
            await this.accountService.updateAuthentication(false);
        }
        this.toastr.error(error?.error?.data?.message || error.shortMessage || "Something went wrong, try again later.");
    }

    isLiveLoan(loan: any) {
        let LOAN_IN_DAYS = this.account.chainId ? (environment as any)[this.account.chainId].LOAN_IN_DAYS : (environment as any)['DEFAULT_NETWORK'].LOAN_IN_DAYS;
        if (environment.ENVNAME === 'DEVELOPMENT') loan.end_date = moment(loan.start_date).clone().add(loan.loan_duration_days, LOAN_IN_DAYS ? 'days' : 'hours').toISOString()
        return moment(moment().format("YYYY-MM-DD, hh:mm a"), 'YYYY-MM-DD, hh:mm a').isBefore(moment(moment(loan?.end_date).format("YYYY-MM-DD, hh:mm a"), 'YYYY-MM-DD, hh:mm a'))
    }

}
