import { Component } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { loanStatus } from 'src/app/shared/Hepler/helper';
import { AccountService } from 'src/app/shared/services/account.service';
import { BorrowLendService } from 'src/app/shared/services/borrow-lend.service';
import { CommonService } from 'src/app/shared/services/common.service';
import { WebStorageService } from 'src/app/shared/services/web-storage.service';

@Component({
    selector: 'app-lend',
    templateUrl: './lend.component.html',
    styleUrls: ['./lend.component.css']
})
export class LendComponent {
    Math: any = Math;
    loanRequests: any;
    user: any;
    account: any;
    imageLoading: boolean = true;
    public loanStatusDetail!: any;
    public isGridView = true;
    loader: boolean = true;
    showoverlay: boolean = false;
    tooltipLeft: any;
    tooltipTop: any;
    currencyConversions: any[] = [];
    regulated: boolean = false;
    currencies: any[] = [];
    page = 1;
    limit = 10;
    disableInfiniteScroll = false;
    scrollLoader = false;


    constructor(
        private commonService: CommonService,
        private borrowLendService: BorrowLendService,
        private webStorageService: WebStorageService,
        private toastr: ToastrService,
        private accountService: AccountService
    ) { }

    ngOnInit(): void {
        this.account = this.webStorageService.getLocalStorage('account') != null ? JSON.parse(this.webStorageService.getLocalStorage('account') || '') : this.account;
        this.user = this.webStorageService.getLocalStorage('user') != null ? JSON.parse(this.webStorageService.getLocalStorage('user') || 'undefined') : this.user;
        this.regulated = JSON.parse(this.webStorageService.getLocalStorage('regulated') || 'true');
        this.getCurrencies();

        this.loanStatusDetail = loanStatus;
        this.commonService.showGridViewObservable.subscribe((response: boolean) => {
            if (response) {
                this.isGridView = response;
            } else {
                this.isGridView = response;
            }
        })
        this.commonService.showmodaloverlayObservable.subscribe((response: boolean) => this.showoverlay = response)
    }
    closeOverlay() {
        this.showoverlay = false;
        this.commonService.setOverlay(false)
    }

    onClick(nftData: any) {
        localStorage.setItem('loan_status', nftData.loanStatusShow);
    }

    getCurrencies() {
        this.commonService.getCurrencies().subscribe({
            next: async (response: any) => {
                this.currencies = response.data;
                this.getAllLoanRequests()
            },
            error: (error) => {
                this.handleError(error);
            }
        })
    }

    getAllLoanRequests() {
        if (this.page != null) {
            if (this.page === 1) {
                this.loanRequests = [];
                this.loader = true;
            } else {
                this.scrollLoader = true;
            }
            this.disableInfiniteScroll = true;
            if (this.user?._id) {
                this.borrowLendService.getLoanRequestsById(this.user?._id, this.page, this.limit).subscribe({
                    next: async (res: any) => {
                        if (this.page === 1) this.loanRequests = [];
                        res.data.nfts ? this.loanRequests.push(...res.data.nfts) : this.loanRequests = [];
                        this.page = res?.data.next_page;
                        this.scrollLoader = false;
                        this.disableInfiniteScroll = false;
                        for (const loanRequest of this.loanRequests) {
                            let appraisalValue = 0;
                            for (const [index, asset] of loanRequest.collateral_assets.entries()) {
                                let attribute = asset.attributes.find((item: any) => item.key.toLowerCase() === 'appraisal value');
                                appraisalValue += await this.setExchangePrice(asset, attribute.value);
                                asset.fileType = asset.preview_image ? asset?.preview_image.split('.')[asset?.preview_image.split('.').length - 1] : asset?.primary_media.split('.')[asset?.primary_media.split('.').length - 1]
                                if (index === loanRequest.collateral_assets.length - 1) loanRequest.appraisalValue = appraisalValue > 0 ? appraisalValue : '-';
                            }
                        }
                        this.setTooltip(this?.loanRequests);
                        this.loader = false;
                    },
                    error: (error: any) => {
                        this.scrollLoader = false;
                        this.disableInfiniteScroll = false;
                        this.handleError(error);
                    }
                })
            } else {
                this.borrowLendService.getLoanRequests(this.page, this.limit).subscribe({
                    next: async (res: any) => {
                        if (this.page === 1) this.loanRequests = [];
                        res.data.nfts ? this.loanRequests.push(...res.data.nfts) : this.loanRequests = [];
                        this.page = res?.data.next_page;
                        this.scrollLoader = false;
                        this.disableInfiniteScroll = false;
                        for (const loanRequest of this.loanRequests) {
                            let appraisalValue = 0;
                            for (const [index, asset] of loanRequest.collateral_assets.entries()) {
                                let attribute = asset.attributes.find((item: any) => item.key.toLowerCase() === 'appraisal value');
                                appraisalValue += await this.setExchangePrice(asset, attribute.value);
                                asset.fileType = asset.preview_image ? asset?.preview_image.split('.')[asset?.preview_image.split('.').length - 1] : asset?.primary_media.split('.')[asset?.primary_media.split('.').length - 1]
                                console.log('index', index, appraisalValue)
                                if (index === loanRequest.collateral_assets.length - 1) loanRequest.appraisalValue = appraisalValue > 0 ? appraisalValue : '-';
                            }
                        }
                        this.setTooltip(this?.loanRequests);
                        this.loader = false;
                    },
                    error: (error: any) => {
                        this.scrollLoader = false;
                        this.disableInfiniteScroll = false;
                        this.handleError(error);
                    }
                })
            }
        }
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

    /**
     * on clicking borrow tab
     */
    onClickingLend() {
        this.commonService.setTabEmitter({ type: 'lend' });
    }

    /**
     * Sets tooltip
     * @param {any} allNfts
     */
    public setTooltip(allNfts: any) {
        setTimeout(() => {
            allNfts.forEach((_response: any, index: any) => {
                (<HTMLElement>document.getElementById(`tooltip-title${index}`)).classList.remove('add-content');
                const contentHeight = (<HTMLElement>document.getElementById(`tooltip-title${index}`)).scrollHeight;
                (<HTMLElement>document.getElementById(`tooltip-title${index}`)).classList.add('add-content');
                if (contentHeight > 59) {
                    (<HTMLElement>document.getElementById(`tooltip-head${index}`)).classList.add('tooltip-details');
                }
                else {
                    (<HTMLElement>document.getElementById(`tooltip-head${index}`)).classList.remove('tooltip-details');
                }
            })
        }, 1000);
    }

    /**
     * Sets tooltip based on screen size
     * @param {number} index
     */
    public setTooltipSize(index: number) {
        (<HTMLElement>document.getElementById(`tooltip-title${index}`)).classList.remove('add-content');
        const contentHeight = (<HTMLElement>document.getElementById(`tooltip-title${index}`)).scrollHeight;
        (<HTMLElement>document.getElementById(`tooltip-title${index}`)).classList.add('add-content');
        if (contentHeight > 59) {
            (<HTMLElement>document.getElementById(`tooltip-head${index}`)).classList.add('tooltip-details');
        }
        else {
            (<HTMLElement>document.getElementById(`tooltip-head${index}`)).classList.remove('tooltip-details')
        }
    }

    handleError = async (error: any) => {
        if (error?.error?.status_code === 401) {
            error.shortMessage = "Authentication failed. Login again to continue.";
            await this.accountService.updateAuthentication(false);
        }
        if (error?.error?.message?.includes('was not mined within 50 blocks')) error.shortMessage = "Transaction timeout. Please initiate transaction again.";
        error = await JSON.stringify(error, null, 2);
        error = await JSON.parse(error);
        if (error?.shortMessage?.includes('reverted with the following reason:')) {
            let errorMessage = error?.shortMessage?.split('reverted with the following reason:');
            error.shortMessage = errorMessage[errorMessage.length - 1]
        }
        this.toastr.error(error.shortMessage || "Something went wrong, try again later.");
    }
}
