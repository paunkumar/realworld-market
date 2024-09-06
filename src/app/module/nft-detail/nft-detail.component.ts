import { Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { DomSanitizer, Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { signTypedData } from '@wagmi/core';
import moment from 'moment';
import {
    ApexAxisChartSeries,
    ApexChart,
    ApexDataLabels,
    ApexGrid,
    ApexStroke,
    ApexTitleSubtitle,
    ApexXAxis,
    ApexYAxis,
    ChartComponent
} from "ng-apexcharts";
import { ModalDirective } from 'ngx-bootstrap/modal';
import { ClipboardService } from 'ngx-clipboard';
import { OwlOptions } from 'ngx-owl-carousel-o';
import { ToastrService } from 'ngx-toastr';
import { Subscription, catchError, forkJoin, map, of } from 'rxjs';
import { TRANSACTIONS_TYPE } from 'src/app/shared/Hepler/helper';
import { AccessControlContractService } from 'src/app/shared/services/access-control-contract.service';
import { AccountService } from 'src/app/shared/services/account.service';
import { BorrowLendService } from 'src/app/shared/services/borrow-lend.service';
import { CollectionContractService } from 'src/app/shared/services/collection-contract.service';
import { CommonService } from 'src/app/shared/services/common.service';
import { DeliveryService } from 'src/app/shared/services/delivery.service';
import { Erc20ContractService } from 'src/app/shared/services/erc20-contract.service';
import { ExchangeContractService } from 'src/app/shared/services/exchange-contract.service';
import { ExchangeService } from 'src/app/shared/services/exchange.service';
import { FaqManagementService } from 'src/app/shared/services/faq-management.service';
import { ImageConversionService } from 'src/app/shared/services/image-conversion.service';
import { LendBorrowContractService } from 'src/app/shared/services/lend-borrow-contract.service';
import { LoanService } from 'src/app/shared/services/loan.service';
import { NftContractService } from 'src/app/shared/services/nft-contract.service';
import { NftService } from 'src/app/shared/services/nft.service';
import { SocketService } from 'src/app/shared/services/socket.service';
import { TokenService } from 'src/app/shared/services/token.service';
import { TransactionService } from 'src/app/shared/services/transaction.service';
import { WebStorageService } from 'src/app/shared/services/web-storage.service';
import { IApiResponse } from 'src/app/shared/utils/common.interface';
import { ContractUtils } from 'src/app/shared/utils/contract-utils';
import { environment } from 'src/environments/environment';
import { encodeAbiParameters, fromHex, getAddress, keccak256, parseAbiParameters } from 'viem';
import Web3 from 'web3';

const web3 = new Web3((environment as any)[environment.DEFAULT_CHAIN].PROVIDER);

export type ChartOptions = {
    series: ApexAxisChartSeries;
    chart: ApexChart;
    xaxis: ApexXAxis;
    yaxis: ApexYAxis;
    dataLabels: ApexDataLabels;
    grid: ApexGrid;
    stroke: ApexStroke;
    title: ApexTitleSubtitle;
};

@Component({
    selector: 'app-nft-detail',
    templateUrl: './nft-detail.component.html',
    styleUrls: ['./nft-detail.component.css']
})
export class NftDetailComponent implements OnInit, OnDestroy {
    [x: string]: any;

    @ViewChild('listSaleNFT', { static: false }) listSaleNFT?: ModalDirective;
    @ViewChild('progressModal', { static: false }) progressModal?: ModalDirective;
    @ViewChild('confirmationModal', { static: false }) confirmationModal?: ModalDirective;
    @ViewChild('verificationModal', { static: false }) verificationModal?: ModalDirective;
    @ViewChild('transferModal', { static: false }) transferModal?: ModalDirective;
    @ViewChild("chart") chart?: ChartComponent;
    public chartOptions: Partial<ChartOptions>;

    Math: any = Math
    nftTokenId!: string;
    nftCollection!: string;
    collection!: string;
    account: any;
    user: any;
    regulated: boolean = false;
    nft: any;
    progressData: any = {};
    confirmationData: any = {};
    counter: number = 0;
    selectedImage!: string;
    sellOrderForm: FormGroup = this.formBuilder.group({
        price: ['', [Validators.required, Validators.min(0)]],
        currencyId: [{}, [Validators.required]],
        currency: [{}, [Validators.required]],
    });
    loanOffer: any;
    nftQuantity: any;
    currencies: any;
    loader: boolean = true;
    // pinata base url
    pinataBaseUrl = environment.PINATA_BASE_URL;
    saleProcessing: boolean = false;
    cancelProcessing: boolean = false;
    buyProcessing: boolean = false;
    showoverlay: boolean = false;
    imageLoading: boolean = true;
    transferNftForm!: FormGroup;
    transferNftFormSubmitted: boolean = false;
    transferNftProcessing: boolean = false;
    faqData: any = [];
    nftId: any = '';
    routeSubscription: any;
    tranasacationlog: boolean = true;
    detailsshow: boolean = false;
    transactionLogs: any[] = [];
    txBaseUrl: string = '';
    showtransactiondetail: boolean = false;
    bettingoffer: boolean = true;
    contractview: boolean = true;
    selectbid: boolean = true;

    // sale bid variables
    userBid: any = {};
    bidProcessing: boolean = false;
    bids: any[] = [];
    cancelBidProcessing: boolean = false;
    bidSubmitted: boolean = false;
    bidForm: FormGroup = this.formBuilder.group({
        amount: ['', [Validators.required, Validators.min(0)]],
        currencyId: [{}, [Validators.required]],
        currency: [{}, [Validators.required]],
    });

    // loan offer variables
    userOffer: any = {};
    loanOffers: any[] = [];
    loanOfferForm: FormGroup = this.formBuilder.group({
        requested_loan_amount: ['', Validators.required],
        currency: ['', Validators.required],
        currencyId: [{}, [Validators.required]],
        loan_percentage: ['', Validators.required],
        loan_duration_days: ['', Validators.required],
        interest_amount: ['', Validators.required],
        total_amount: ['', Validators.required],
        collateral_assets: ['', Validators.required]
    })
    loanOfferSubmitted: boolean = false;
    loanOfferProcessing: boolean = false;
    loanOfferDays: any[] = [];
    cancelLoanOfferProcessing: boolean = false;

    showAllTransactions = false;
    queryParamSubscription!: Subscription;
    logsLoader = false;
    isModalVisible: boolean = false;
    currentImage: string = '';
    redeemshow: boolean = true;
    pageType = TRANSACTIONS_TYPE.OFFERS_LIST;
    acceptedBid: any = {};
    loanRequest: any;
    deliveryData!: { [key: string]: any }[];
    isCancellingDelivery = false;
    category: any = {};
    isOrderDelivered = false;
    marketPrice: number = 0;
    processedImage: any = {};
    saleoffers: boolean = true;
    createloanoffer: boolean = true;
    loancreate: boolean = false;
    goldValue: number = 0;
    checkStockBeforeBuy:boolean = true;  // Flag indicating whether to check if the NFT stock is available.

    constructor(
        private route: ActivatedRoute,
        private nftService: NftService,
        private webStorageService: WebStorageService,
        private toastr: ToastrService,
        private erc20ContractService: Erc20ContractService,
        private commonService: CommonService,
        private exchangeContractService: ExchangeContractService,
        private accountService: AccountService,
        private collectionContractService: CollectionContractService,
        private exchangeService: ExchangeService,
        private formBuilder: FormBuilder,
        private contractUtils: ContractUtils,
        private router: Router,
        private imageConversionService: ImageConversionService,
        private nftContractService: NftContractService,
        private accessControlContractService: AccessControlContractService,
        private location: Location,
        private sanitizer: DomSanitizer,
        private faqManagementService: FaqManagementService,
        private clibboard: ClipboardService,
        private toast: ToastrService,
        private titleService: Title,
        private transactionService: TransactionService,
        private tokenService: TokenService,
        private borrowLendContractService: LendBorrowContractService,
        private loanService: LoanService,
        private deliveryService: DeliveryService,
        private socketService: SocketService,
        private borrowLendService: BorrowLendService
    ) {
        this.chartOptions = {
            chart: {
                height: 250,
                type: "line",
                zoom: {
                    enabled: false
                }
            },
            dataLabels: {
                enabled: true
            },
            stroke: {
                curve: "straight"
            },
            title: {
                text: "Price history",
                align: "left"
            },
            grid: {
                row: {
                    colors: ["#f3f3f3", "transparent"],
                    opacity: 0.5
                }
            },
            yaxis: {
                min: 0,
                forceNiceScale: true,
                stepSize: 10,
                title: {
                    text: "Price"
                }
            }
        };
    }

    ngOnInit(): void {
        this.account = this.webStorageService.getLocalStorage('account') != null ? JSON.parse(this.webStorageService.getLocalStorage('account') || '') : this.account;
        this.user = this.webStorageService.getLocalStorage('user') != null ? JSON.parse(this.webStorageService.getLocalStorage('user') || 'undefined') : this.user;
        this.regulated = JSON.parse(this.webStorageService.getLocalStorage('regulated') || 'true');
        this.commonService.setTabEmitter({ type: 'all-items' });
        this.txBaseUrl = this.account?.chainId ? (environment as any)[this.account?.chainId].EXPLORER : (environment as any)[environment.DEFAULT_CHAIN].EXPLORER
        this.bettingoffer = this.getParsedItemFromStorage('isOfferTableCollpased', this.bettingoffer);
        this.contractview = this.getParsedItemFromStorage('isContractTableCollpased', this.contractview);
        this.tranasacationlog = this.getParsedItemFromStorage('isActivityTableCollpased', this.tranasacationlog);
        this.routeSubscription = this.route.params.subscribe(async (params) => {
            this.nftCollection = params['collection'];
            this.nftTokenId = params['tokenId']
            this.nftId = params['id'];

            if (this.nftTokenId) {
                let isAddress = await web3.utils.isAddress(this.nftCollection)
                if (isAddress) {
                    try {
                        let code = await web3.eth.getCode(this.nftCollection);
                        let response = await this.collectionContractService.supportsInterface(this.account?.networkId, this.nftCollection);
                        let nextTokenId = await this.collectionContractService.getNextMintableToken(this.account?.networkId, this.nftCollection);
                        if (code != "0x" && response && Number(this.nftTokenId) < Number(nextTokenId)) {
                            this.getCurrencies();
                        } else this.router.navigate(['**']);
                    } catch (error) {
                        this.router.navigate(['**']);
                    }
                } else this.router.navigate(['**']);
            } else this.getCurrencies();
        });
        this.getloanOfferDays();
        this.queryParamSubscription = this.route.queryParams.subscribe((param) => {
            this.showAllTransactions = param['showAll'] === 'true';
        })
        this.socketService.getDeliveryStatus().subscribe({
            next: (response: { [key: string]: any }[]) => {
                if (Object.keys(response[0]).length > 0) {
                    this.deliveryData = response;
                    this.isOrderDelivered = this.deliveryData.some(delivery => delivery['is_completed'] && delivery['status'].status === 5);
                }
            },
            error: (error: any) => {
                console.log('error');

            }
        })

        this.commonService.showmodaloverlayObservable.subscribe((response: boolean) => this.showoverlay = response)
        this.commonService.closeModalsObservable.subscribe((response: boolean) => {
            if (response) {
                this.progressModal?.hide();
                this.confirmationModal?.hide();
                this.verificationModal?.hide();
                this.transferModal?.hide();
                this.listSaleNFT?.hide();
            }
        })
        this.getFaq('', '', 'true');

        this.transferNftForm = this.formBuilder.group({
            walletAddress: ['', [Validators.required]]
        }, { validators: this.validateWallet })

        this.getMarketPrice();
    }
    
    /**
     * Getter for accessing the `nftActions`.
     * 
     * @returns {typeof nftActions} The `nftActions` object.
     */
    get _nftActions():typeof nftActions{
        return nftActions
    }

    getMarketPrice() {
        this.socketService.getMarketPrice().subscribe(async (marketPrice: any) => {
            if (marketPrice > 0) {
                this.goldValue = marketPrice;
                await this.categoryBasedValidation();
                if (this.nft?.in_sale && this.nft?.lazy_mint) {
                    // convert price in usd to currency
                    await this.convertValueInUsdToCurrency();
                }
            }
        });
    }

    validateWallet: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
        let walletAddress = group.get('walletAddress')?.value;
        return Web3.utils.isAddress(walletAddress) ? web3.utils.toChecksumAddress(this.account.walletAddress) !== web3.utils.toChecksumAddress(walletAddress) ? null : { sameAddress: true } : { notValidAddress: true }
    }

    /**
     * @param{string}key
     * @param{boolean}defaultValue
     */
    getParsedItemFromStorage(key: string, defaultValue: boolean): boolean {
        const item = this.webStorageService.getItem(key);
        return item !== null ? JSON.parse(item) : defaultValue;
    }

    ngOnDestroy() {
        this.titleService.setTitle('RealWorld.fi - Marketplace');
        this.routeSubscription.unsubscribe();
        this.queryParamSubscription.unsubscribe();
        this.socketService?.unsubscribeEvents();
    }

    closeOverlay() {
        this.showoverlay = false;
        this.commonService.setOverlay(false);
    }

    getNft() {
        let api;
        if (this.nftCollection && this.nftTokenId) api = this.nftService.getNft(this.nftCollection, this.nftTokenId)
        else api = this.nftService.getNftById(this.nftId)

        api?.subscribe({
            next: async (response: any) => {
                this.nft = response.data;
                this.category = (this.nft?.attributes?.find((data: any) => data?.key?.toLowerCase() == 'category'))?.value?.toLowerCase();
                this.nftQuantity = this.nft?.attributes?.find((data: any) => data?.key?.toLowerCase() == 'quantity');
                this.checkStockBeforeBuy = this.nft?.lazy_mint && this.category === 'gems'

                if (this.nft.on_loan) {
                    this.nft.defaulted = this.nft?.loan_details?.status === 1 && !this.isLiveLoan(this.nft.loan_details)
                }
                this.nft.fileType = this.nft.preview_image ? this.nft?.preview_image.split('.')[this.nft?.preview_image.split('.').length - 1] : this.nft?.primary_media.split('.')[this.nft?.primary_media.split('.').length - 1]

                if (!this.nft?.lazy_mint) {
                    this.listBids();
                    this.listLoanOffers();
                }

                // NOTE: Displays a toastr notification if the NFT is out of stock.
                if(this.checkStockBeforeBuy){
                    const isAvailable = Number(this.nftQuantity.value) > 0;
                    if(!isAvailable) this.toastr.error(response.message)
                }

                this.titleService.setTitle(this.nft.name);
                this.setTooltip();
                let images = [this.nft?.primary_media, ...this.nft.secondary_media];
                this.nft.images = [];
                if (this.nft.delivery_status > 0 && this.nft?.delivery_id) this.getDeliveryDetails(this.nft?.delivery_id);

                // set images
                images.map(async (imageUrl: any, index: number) => {
                    let splitUrl = imageUrl.split('.');
                    if (splitUrl[splitUrl.length - 1] === 'html') {
                        this.nft.images[index] = { url: imageUrl, fileType: splitUrl[splitUrl.length - 1], preview: this.nft?.preview_image };
                    } else {
                        let data: any = await this.commonService.getImage(imageUrl);
                        if (data) this.nft.images[index] = { url: imageUrl, fileType: data?.contentType?.split('/')[1], preview: this.nft?.preview_image };
                        else this.nft.images[index] = { url: imageUrl, preview: this.nft?.preview_image };
                    }
                })

                // category based validations
                await this.categoryBasedValidation();

                let priceIndex = this.nft.attributes.findIndex((attribute: any) => attribute?.key?.toLowerCase() === 'price');
                if (priceIndex > -1) this.nft.attributes.splice(priceIndex, 1);
                if (this.nft?.in_sale) {
                    if (this.nft?.lazy_mint) {
                        // convert price in usd to currency
                        await this.convertValueInUsdToCurrency();
                    } else this.sellOrderForm.patchValue({ price: Math.ceil(this.nft?.sell_order.price), currency: this.nft?.sell_order.currency, currencyId: this.nft?.sell_order.currency?._id })
                }
                this.loader = false;
            },
            error: (error: any) => {
                if (error?.error?.status_code === 404) this.router.navigate(['/**']);
                else this.handleError(error);
            }
        })
    }

    async categoryBasedValidation() {
        this.category = (this.nft?.attributes?.find((data: any) => data?.key?.toLowerCase() == 'category'))?.value?.toLowerCase();
        if (this.category === 'gold' && this.nft.lazy_mint) {
            let markupFee = this.nft?.attributes?.find((data: any) => data?.key?.toLowerCase() == 'markup fee');
            let size = this.nft?.attributes?.find((data: any) => data.key.toLowerCase() == 'size');
            let { price, priceWithFee }: any = await this.commonService.calculateGoldValue(size.value, markupFee.value, this.goldValue);
            this.marketPrice = price;
            this.nft.sell_order.price = priceWithFee;
            let quantityIndex = this.nft.attributes.findIndex((attribute: any) => attribute?.key?.toLowerCase() === 'quantity');
            if (quantityIndex > -1) this.nft.attributes.splice(quantityIndex, 1);
        }
    }

    convertValueInUsdToCurrency() {
        // convert price in usd to currency
        let response: any = this.commonService.getTokenPrice(this.nft?.sell_order.currency.address);
        let usdPrice = response[this.nft?.sell_order.currency.address.toLowerCase()]?.usd || 0;
        let currencyPrice = usdPrice === 0 ? this.nft?.sell_order.price : this.nft?.sell_order.price / usdPrice;
        this.sellOrderForm.patchValue({ price: Math.ceil(currencyPrice) || 0, currency: this.currencies[0], currencyId: this.currencies[0]._id });
        if (this.category === 'gold') {
            let index = this.nft?.attributes?.findIndex((data: any) => data?.key?.toLowerCase() == 'appraisal value');
            this.nft.attributes[index].value = usdPrice === 0 ? this.marketPrice : this.marketPrice / usdPrice;
        }
    }

    getNftAnalytics() {
        this.logsLoader = true;
        this.nftService.getNftAnalytics(this.nftCollection, this.nftTokenId, this.nftId).subscribe({
            next: async (res: any) => {
                this.logsLoader = false;
                this.transactionLogs = res.data.docs.transaction_logs || [];
                this.populateContractNames();

                //NOTE : Price History Data - Sorted  by date
                const priceHistory:IPriceHistory[] = res.data.docs.sale_history.sort((a:IPriceHistory,b:IPriceHistory)=>{
                    return moment(a.updatedAt).diff(b.updatedAt)
                })
                let prices:number [] = priceHistory.map((item: IPriceHistory) => Math.ceil(item.price));
                let dates:string [] = priceHistory.map((item: IPriceHistory) => moment(item.updatedAt).format("DD MMM "));
                this.chartOptions = Object.assign(this.chartOptions,
                    {
                        series: [
                            {
                                name: "Price",
                                data: prices
                            }
                        ],
                        xaxis: {
                            type: "datetime",
                            categories: dates
                        }
                    })
            },
            error: (error) => {
                this.logsLoader = false;
                if (error?.error?.status_code === 404) this.router.navigate(['/**']);
                this.handleError(error);
            }
        })

    }

    /**
   * populate names based on the contract address
   */
    private async populateContractNames() {
        const nameRequests = this.transactionLogs.map((log: { [key: string]: any }) => {
            const senderName$ = log['sender']?.name
                ? of(log['sender'].name)
                : this.erc20ContractService.getContractName(this.user?.networkId, log['from']).pipe(
                    catchError(() => of(log['from']))
                );

            const receiverName$ = log['receiver']?.name
                ? of(log['receiver'].name)
                : this.erc20ContractService.getContractName(this.user?.networkId, log['to']).pipe(
                    catchError(() => of(log['to']))
                );

            return forkJoin([senderName$, receiverName$]).pipe(
                map(([senderName, receiverName]) => {
                    if (!log['sender']?.name && senderName) {
                        log['sender'] = { ...log['sender'], name: senderName };
                    }
                    if (receiverName?.toLowerCase() === 'exchange') receiverName = 'Marketplace';
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

    getCurrencies() {
        this.commonService.getCurrencies().subscribe({
            next: async (response: any) => {
                this.currencies = await response.data.filter((currency: any) => !currency.is_deleted);
                this.sellOrderForm.patchValue({ currency: this.currencies[0], currencyId: this.currencies[0]._id });
                this.loanOfferForm.patchValue({ currency: this.currencies[0], currencyId: this.currencies[0]._id })
                this.getNft();
                this.getNftAnalytics();
            },
            error: (error) => {
                this.handleError(error);
            }
        })
    }

    getloanOfferDays() {
        this.loanService.getLoanRequestDays().subscribe({
            next: (response: any) => {
                this.loanOfferDays = response.data;
            },
            error: (error) => {
                this.handleError(error);
            }
        })
    }

    async listForSale() {
        if (this.regulated) {
            const kycStatus: any = await this.accountService.getKycStatus(this.account?.walletAddress);
            if (kycStatus?.data?.admin_kyc_enable && kycStatus?.data?.kyc_enable && kycStatus?.data?.kyc_verified !== 1) {
                this.toastr.warning("Identity confirmation needed. Please wait while you are redirected to our identification platform.");
                this.setRoute();
                return this.router.navigate(['kyc'])
            }
        }
        if (!this.regulated) {
            if (!this.user) {
                this.setRoute();
                this.toastr.warning("Register to continue.")
                return this.router.navigate(['sign-up'])
            }
        }

        this.listSaleNFT?.show();
    }

    /**
     * Fetchs image
      @param {string} imageUrl
     * @returns
     */
    private async fetchImage(imageUrl: string) {
        return new Promise((resolve, reject) => {
            this.imageConversionService.getImageFile(imageUrl).subscribe({
                next: async (response: any) => {
                    resolve({ status: true, data: response.data.hash_data });
                },
                error: (error: any) => {
                    this.handleError(error);
                    reject({ status: false, data: error });
                }
            });
        });
    }

    async buyNftOrder() {
        if (this.regulated) {
            const kycStatus: any = await this.accountService.getKycStatus(this.account?.walletAddress);
            if (kycStatus?.data?.admin_kyc_enable && kycStatus?.data?.kyc_enable && kycStatus?.data?.kyc_verified !== 1) {
                this.toastr.warning("Identity confirmation needed. Please wait while you are redirected to our identification platform.");
                this.setRoute();
                return this.router.navigate(['kyc'])
            }
        }
        this.user = this.webStorageService.getLocalStorage('user') != null ? JSON.parse(this.webStorageService.getLocalStorage('user') || 'undefined') : this.user;
        if (!this.regulated) {
            if (!this.user) {
                this.setRoute();
                this.toastr.warning("Register to continue.")
                return this.router.navigate(['sign-up'])
            } else if (!this.user.email_verified || !this.user?.is_valid) {
                this.verificationModal?.show();
                return
            }
        }

        try {
            let isBlocked = await this.accessControlContractService.isBlocked(this.account);
            if (isBlocked) return this.toastr.error("User blocked. Please contact the admin regarding your status.");

            if (this.regulated) {
                this.confirmationData = {
                    image: [this.processImage()],
                    content: `Are you sure you want to proceed with purchase of ` + `${this.category != 'gold' ? '<b>1 </b>' : ''}` + `${this.nft?.collections?.unit_type != null ? `<b>${this.nft?.collections?.unit_type}, </b>` : ''}` + `<b>${this.nft?.name}</b> for <b>${Math.ceil(this.sellOrderForm?.value?.price)} ${this.sellOrderForm?.value?.currency?.symbol}</b>?`
                }
                this.confirmationModal?.show();
            } else this.confirmSalePurchase();

        } catch (error: any) {
            this.buyProcessing = false;
            this.handleError(error);
        }
    }

    confirmSalePurchase() {
        this.confirmationModal?.hide();
        this.buyProcessing = true;
        if (this.nft.lazy_mint) this.lazyMintBuy()
        else this.buy();
    }

    async buy() {
        this.progressData = {
            title: "Processing.",
            currentStep: 0,
            steps: [
                {
                    title: "Approve currency.",
                    status: 1
                },
                {
                    title: "Buy order.",
                    status: 0
                }
            ],
            failed: false,
            successTitleHtml: this.sanitizer.bypassSecurityTrustHtml("Item purchased and moved to your <a href='/my-wallet' class='text-decoration-underline cursor-pointer'>wallet</a>."),
            image: [this.processImage()]
        }
        this.progressModal?.show();

        let txResp: any;
        let tx: any;
        try {
            let { price, currency, nonce } = this.nft.sell_order;
            const decimal = await this.erc20ContractService.getDecimal(this.account?.networkId, currency.address);
            let priceDecimal = this.contractUtils.decimalMultipler(Number(decimal), Number(price))

            // Step 1 - check balance
            let balance = await this.erc20ContractService.getBalance(this.account?.networkId, currency.address, this.account?.walletAddress);
            let formattedBalance = this.contractUtils.decimalDivider(Number(decimal), balance);
            if (Number(balance) < Number(priceDecimal)) {
                this.toastr.error(this.regulated ? `Insufficient balance to purchase. You have ${Number(formattedBalance).toFixed(4)} ${currency.symbol} in your wallet, but you need ${price} ${currency.symbol}. To fund your wallet, please contact your account manager.` : `Insufficient balance to purchase. You have ${Number(formattedBalance).toFixed(4)} ${currency.symbol} in your wallet, but you need ${price} ${currency.symbol}.`);
                this.progressData.steps[this.progressData.currentStep].status = 3;
                this.progressData.failed = true;
                this.buyProcessing = false;
                return;
            }

            // Step 1 - approve currency
            let spender = (environment as any)[this.account.chainId]['EXCHANGE_CONTRACT'];
            let approvedAmount = await this.erc20ContractService.getAllowance(this.account?.networkId, currency.address, this.account.walletAddress, spender);
            if (approvedAmount < priceDecimal) {
                // Create increase allowance tx
                let txData: any = {
                    from: this.account.walletAddress,
                    to: currency.address,
                    from_id: this.user._id,
                    transaction_name: 'Approve currency',
                    nft_id: this.nft._id,
                    status: 0,
                    amount: 0,
                    currency_symbol: "-"
                }
                txResp = await this.transactionService.createTransaction(txData);
                let transactionData = {
                    status: true,
                    count: 0
                }

                this.commonService.transactionEmitter(transactionData);


                // increase allowance contract call
                let args = { functionName: 'increaseAllowance', args: [spender, priceDecimal], abiType: 'erc20' }
                let { approveAbi, requiredGas } = await this.erc20ContractService.approve(this.account, currency.address, args);
                tx = await this.commonService.sendTransaction(this.account, currency.address, approveAbi, requiredGas, args);

                // update increase allowance tx
                if (this.regulated) tx = JSON.parse(tx.data);
                txData = {
                    status: 1,
                    transaction_hash: tx.transactionHash
                }
                await this.transactionService.createTransaction(txData, txResp.data._id);
                transactionData = {
                    status: true,
                    count: 1
                }
                this.commonService.transactionEmitter(transactionData);

            }
            // step 1 status update
            this.progressData.steps[this.progressData.currentStep].status = 2;
            this.progressData.steps[this.progressData.currentStep + 1].status = 1;
            this.progressData.currentStep = 1;

            // Step 2 - complete order
            // create complete sell order tx
            let txData: any = {
                from: this.account.walletAddress,
                to: (environment as any)[this.account.chainId]['EXCHANGE_CONTRACT'],
                from_id: this.user._id,
                transaction_name: 'Complete order',
                nft_id: this.nft._id,
                status: 0,
                amount: 0,
                currency_symbol: "-"
            }
            txResp = await this.transactionService.createTransaction(txData);
            let transactionData = {
                status: true,
                count: 0
            }
            this.commonService.transactionEmitter(transactionData);


            // complete order contract call
            let order = await this.exchangeContractService.organizeSellOrder(this.account?.networkId, this.nft.sell_order?.seller.wallet_address, this.nft.collections.collection_address, this.nft.token_id, currency?.address, price, nonce);
            let args = { functionName: 'completeOrder', args: [order], abiType: 'exchange' }
            let { orderAbi, requiredGas } = await this.exchangeContractService.createExchangeAbi(this.account, args);
            tx = await this.commonService.sendTransaction(this.account, (environment as any)[this.account.chainId]['EXCHANGE_CONTRACT'], orderAbi, requiredGas, args);

            // update complete order tx
            if (this.regulated) tx = JSON.parse(tx.data);
            txData = {
                status: 1,
                transaction_hash: tx.transactionHash
            }
            await this.transactionService.createTransaction(txData, txResp.data._id);
            transactionData = {
                status: true,
                count: 1
            }
            this.commonService.transactionEmitter(transactionData);


            // Step 2 - Api to purchase sell order in db
            await this.purchaseOrder(this.nft.sell_order._id);
        } catch (error) {
            console.log('error', error)
            this.buyProcessing = false;
            this.handleError(error, txResp?.data?._id);
        }
    }

    async lazyMintBuy() {
        this.progressData = {
            title: "Processing.",
            currentStep: 0,
            steps: [
                {
                    title: "Approve currency.",
                    status: 1
                },
                {
                    title: "Mint item.",
                    status: 0
                },
                {
                    title: "Purchase item.",
                    status: 0
                }
            ],
            failed: false,
            successTitleHtml: this.sanitizer.bypassSecurityTrustHtml("Item purchased and moved to your <a href='/my-wallet' class='text-decoration-underline cursor-pointer'>wallet</a>."),
            image: [this.processImage()]
        }
        this.progressModal?.show();
        let txResp: any;
        let getTx: any;
        try {
            let { nonce } = this.nft.sell_order;
            let { price, currency } = this.sellOrderForm.value;
            const decimal = await this.erc20ContractService.getDecimal(this.account?.networkId, currency.address);
            let priceDecimal = this.contractUtils.decimalMultipler(Number(decimal), Number(price))

            // After implemented Transaction logs works will do it.
            const tokenDetails = await this.tokenService.getTokenDetails(this.account.chainId || environment.DEFAULT_NETWORK, currency.address);

            // Step 1 - check balance
            if (!this.nft?.primary_media || this.nft?.primary_media === '') {
                this.toastr.error("Something wrong with nft image, please try again later.");
                this.progressData.steps[this.progressData.currentStep].status = 3;
                this.progressData.failed = true;
                this.buyProcessing = false;
                return;
            }

            let balance = await this.erc20ContractService.getBalance(this.account?.networkId, currency.address, this.account?.walletAddress);
            let formattedBalance = this.contractUtils.decimalDivider(Number(decimal), balance);
            if (Number(balance) < Number(priceDecimal)) {
                this.toastr.error(this.regulated ? `Insufficient balance to purchase. You have ${Number(formattedBalance).toFixed(4)} ${currency.symbol} in your wallet, but you need ${price} ${currency.symbol}. To fund your wallet, please contact your account manager.` : `Insufficient balance to purchase. You have ${Number(formattedBalance).toFixed(4)} ${currency.symbol} in your wallet, but you need ${price} ${currency.symbol}.`);
                this.progressData.steps[this.progressData.currentStep].status = 3;
                this.progressData.failed = true;
                this.buyProcessing = false;
                return;
            }

            // Step 1 - approve currency
            let spender = this.nft.collections.collection_address;
            let approvedAmount = await this.erc20ContractService.getAllowance(this.account?.networkId, currency.address, this.account.walletAddress, spender);
            if (approvedAmount < priceDecimal) {
                // before approve tx record in db
                let txData: any = {
                    from: this.account.walletAddress,
                    to: currency.address,
                    from_id: this.user._id,
                    transaction_name: 'Approve currency',
                    nft_id: this.nft._id,
                    status: 0,
                    amount: price,
                    currency_symbol: "USDC"
                }
                txResp = await this.transactionService.createTransaction(txData);
                let transactionData = {
                    status: true,
                    count: 0
                }
                this.commonService.transactionEmitter(transactionData);

                let args = { functionName: 'increaseAllowance', args: [spender, priceDecimal], abiType: 'erc20' }
                let { approveAbi, requiredGas } = await this.erc20ContractService.approve(this.account, currency.address, args);
                getTx = await this.commonService.sendTransaction(this.account, currency.address, approveAbi, requiredGas, args);

                // after approve tx update tx hash & status
                if (this.regulated) getTx = JSON.parse(getTx.data);
                txData = {
                    status: 1,
                    transaction_hash: getTx.transactionHash
                }
                await this.transactionService.createTransaction(txData, txResp.data._id);
                transactionData = {
                    status: true,
                    count: 1
                }
                this.commonService.transactionEmitter(transactionData);
            }


            this.progressData.steps[this.progressData.currentStep].status = 2;
            this.progressData.steps[this.progressData.currentStep + 1].status = 1;
            this.progressData.currentStep = 1;

            let order = await this.exchangeContractService.organizeSellOrder(this.account?.networkId, this.nft.sell_order?.seller.wallet_address, this.nft.collections.collection_address, this.nft.token_id, currency?.address, price, nonce);

            // Step 2 - mint nft
            let platformFee: any = await this.collectionContractService.getPlatformFee(this.account, this.nft?.collections?.collection_address);
            let nativeBalance: any = await this.commonService.getNativeBalance(this.account);
            if (nativeBalance.formatted <= Number(platformFee) / 100) {
                this.toastr.error(this.regulated ? "Insufficient native currency for minting fee + gas. To fund your wallet, please contact your account manager." : "Insufficient native currency for minting fee + gas.");
                this.progressData.steps[this.progressData.currentStep].status = 3;
                this.progressData.failed = true;
                this.buyProcessing = false;
                return;
            }

            let imageHash: string
            if (this.category !== 'gold') {
                // get nft primary image from our backend service , image url -> blob -> fileObject
                let IpfsHashData: any = await this.fetchImage(this.nft?.primary_media)
                imageHash = this.pinataBaseUrl + IpfsHashData.data
            } else imageHash = this.nft.primary_media

            // prepare metadata for ipfs & token uri
            const obj = {
                collection: this.nft.collections.name,
                name: this.nft.name,
                description: this.nft.description,
                image: imageHash,
                secondaryImages: [],
                date: Date.now(),
                attributes: this.nft.attributes,
                currency: currency._id,
                tokenId: this.nft?.token_id
            };

            let pinataUri = await this.imageConversionService.uploadJson(obj);

            let nextTokenId = await this.collectionContractService.getNextMintableToken(this.account?.networkId, this.nft.collections.collection_address);

            // generate signature
            let param = {
                collectionAddress: this.nft.collections.collection_address,
                tokenId: Number(nextTokenId),
                price: order.price,
                uri: `${environment.PINATA_BASE_URL}${pinataUri.IpfsHash}`,
                buyer: this.account.walletAddress,
                currencyAddress: currency.address,
                seller: order.seller,
            }
            const signature = await this.generateSignature(param) as any;

            const { collectionAddress, tokenId, uri, buyer, currencyAddress, seller } = param;

            let mintValue = {
                tokenId, price: param.price, uri, buyer, 'signature': signature.data.data.signature, currencyAddress, seller
            }
            // before create lazy mint tx record in db
            let lazyMintTxData: any = {
                from: this.account.walletAddress,
                to: collectionAddress,
                from_id: this.user._id,
                transaction_name: 'Partner purchase',
                nft_id: this.nft._id,
                status: 0,
                amount: 0,
                currency_symbol: "-"
            }
            txResp = await this.transactionService.createTransaction(lazyMintTxData);
            let transactionData = {
                status: true,
                count: 0
            }
            this.commonService.transactionEmitter(transactionData);

            let lazyMintArgs: any = { functionName: 'safeMint', args: [mintValue], abiType: 'lazyMint', value: Number(platformFee) / 100 }
            let { orderAbi, requiredGas: mintGas }: any = await this.nftContractService.lazyMint(this.account, lazyMintArgs, collectionAddress);
            let tx: any = await this.commonService.sendTransaction(this.account, collectionAddress, orderAbi, mintGas, lazyMintArgs);
            if (this.regulated) {
                tx = JSON.parse(tx?.data)
            }
            let lazyMintUpdateTxData = {
                status: 1,
                transaction_hash: tx.transactionHash
            }
            await this.transactionService.createTransaction(lazyMintUpdateTxData, txResp.data._id);
            transactionData = {
                status: true,
                count: 1
            }
            this.commonService.transactionEmitter(transactionData);

            this.progressData.steps[this.progressData.currentStep].status = 2;
            this.progressData.steps[this.progressData.currentStep + 1].status = 1;
            this.progressData.currentStep = 2;

            // Step 2 - Api to purchase sell order in db
            let eventSignature = web3.eth.abi.encodeEventSignature('LazyMint(address,address,address,uint256,uint256)')
            let log: any = tx.logs.find((log: any) => log.topics[0] === eventSignature);
            await this.purchaseOrder(this.nft.sell_order._id, fromHex(log?.topics[3], "number"));

        } catch (error) {
            this.buyProcessing = false;
            this.handleError(error, txResp.data._id);
        }
    }

    // get signature from backend with this data's for verify it from contract.
    // (Identification for user safeminting from our platform)
    private async generateSignature(param: any) {
        return new Promise((resolve, reject) => {
            this.nftService.getSignatureForLazyMintOrder(param).subscribe({
                next: (signature: any) => {
                    resolve({ status: true, data: signature });
                },
                error: (error: any) => {
                    this.handleError(error);
                    this.buyProcessing = false;
                    reject({ status: false, data: error });

                }
            });
        });
    }

    purchaseOrder(orderId: string, tokenId: number = -1) {
        let params: any = {
            buyer: this.user._id,
            status: 1,
            price: this.sellOrderForm.value.price,
            currency: this.sellOrderForm.value.currency._id
        }

        if (tokenId >= 0) params.token_id = tokenId;

        this.exchangeService.updateSellOrder(orderId, params).subscribe({
            next: (response: any) => {
                this.progressData.steps[this.progressData.currentStep].status = 2;
                this.nft.lazy_mint ? this.progressData.currentStep = 3 : this.progressData.currentStep = 2;
                this.sellOrderForm.reset();
                this.sellOrderForm.patchValue({ currency: this.currencies[0], currencyId: this.currencies[0]._id });
                this.buyProcessing = false;
                this.getNft();
                this.getNftAnalytics();
            },
            error: (error: any) => {
                this.buyProcessing = false;
                this.handleError(error);
            }
        })
    }

    async createSellOrder() {
        let txResp: any;
        let tx: any;
        this.user = this.webStorageService.getLocalStorage('user') != null ? JSON.parse(this.webStorageService.getLocalStorage('user') || 'undefined') : this.user;
        if (!this.regulated) {
            if (!this.user) {
                this.setRoute();
                this.toastr.warning("Register to continue.")
                return this.router.navigate(['sign-up'])
            } else if (!this.user.email_verified || !this.user?.is_valid) {
                this.verificationModal?.show();
                return
            }
        }
        try {
            if (this.sellOrderForm.valid) {
                let isBlocked = await this.accessControlContractService.isBlocked(this.account);
                if (isBlocked) return this.toastr.error("User blocked. Please contact the admin regarding your status.");

                this.saleProcessing = true;
                this.progressData = {
                    title: "Processing.",
                    currentStep: 0,
                    steps: [
                        {
                            title: "Approve item.",
                            status: 1
                        },
                        {
                            title: "Create order.",
                            status: 0
                        }
                    ],
                    failed: false,
                    successTitle: "Sell order created.",
                    image: [this.processImage()]
                }
                this.listSaleNFT?.hide();
                this.progressModal?.show();

                // Step 1 - approve nft
                let approvedAddess: any = await this.collectionContractService.getApproved(this.account?.networkId, this.nft.collections.collection_address, this.nft.token_id);
                if (approvedAddess !== await getAddress((environment as any)[this.account.chainId]['EXCHANGE_CONTRACT'])) {
                    // create approve nft tx
                    let txData: any = {
                        from: this.account.walletAddress,
                        to: this.nft.collections.collection_address,
                        from_id: this.user._id,
                        transaction_name: 'Approve item',
                        nft_id: this.nft._id,
                        status: 0,
                        amount: 0,
                        currency_symbol: "-"
                    }
                    txResp = await this.transactionService.createTransaction(txData);
                    let transactionData = {
                        status: true,
                        count: 0
                    }
                    this.commonService.transactionEmitter(transactionData);


                    // approve contract call
                    let args = { functionName: 'approve', args: [(environment as any)[this.account.chainId]['EXCHANGE_CONTRACT'], this.nft.token_id], abiType: 'erc721' };
                    let { approveAbi, requiredGas } = await this.collectionContractService.approveNft(this.account, this.nft.collections.collection_address, args);
                    tx = await this.commonService.sendTransaction(this.account, this.nft.collections.collection_address, approveAbi, requiredGas, args);

                    // update approve nft tx
                    if (this.regulated) tx = JSON.parse(tx.data);
                    txData = {
                        status: 1,
                        transaction_hash: tx.transactionHash
                    }
                    await this.transactionService.createTransaction(txData, txResp.data._id);
                    transactionData = {
                        status: true,
                        count: 1
                    }
                    this.commonService.transactionEmitter(transactionData);

                }
                // step 1 status update
                this.progressData.steps[this.progressData.currentStep].status = 2;
                this.progressData.steps[this.progressData.currentStep + 1].status = 1;
                this.progressData.currentStep = 1;

                // Step 2 - create order
                // create sell order tx
                let txData: any = {
                    from: this.account.walletAddress,
                    to: (environment as any)[this.account.chainId]['EXCHANGE_CONTRACT'],
                    from_id: this.user._id,
                    transaction_name: 'Create order',
                    nft_id: this.nft._id,
                    status: 0,
                    amount: 0,
                    currency_symbol: "-"
                }
                txResp = await this.transactionService.createTransaction(txData);
                let transactionData = {
                    status: true,
                    count: 0
                }
                this.commonService.transactionEmitter(transactionData);


                // create order contract call
                let nonce = await this.getNonce() + 1
                let order = await this.exchangeContractService.organizeSellOrder(this.account?.networkId, this.account.walletAddress, this.nft.collections.collection_address, this.nft.token_id, this.sellOrderForm.value.currency?.['address'] || "", this.sellOrderForm.value.price || "", nonce);
                let args = { functionName: 'createOrder', args: [order], abiType: 'exchange' }
                let { orderAbi, requiredGas } = await this.exchangeContractService.createExchangeAbi(this.account, args);
                tx = await this.commonService.sendTransaction(this.account, (environment as any)[this.account.chainId]['EXCHANGE_CONTRACT'], orderAbi, requiredGas, args);

                // update create order tx
                if (this.regulated) tx = JSON.parse(tx.data);
                txData = {
                    status: 1,
                    transaction_hash: tx.transactionHash
                }
                await this.transactionService.createTransaction(txData, txResp.data._id);
                transactionData = {
                    status: true,
                    count: 1
                }
                this.commonService.transactionEmitter(transactionData);


                // Step 2 - Api to write sell order to db
                await this.storeSellOrder(this.nft._id, nonce);

            } else this.toastr.error("All fields are required");
        } catch (error: any) {
            this.saleProcessing = false;
            this.handleError(error, txResp.data._id);
            this.sellOrderForm.patchValue({ price: '' });
        }
    }

    storeSellOrder(nft: string, nonce: number) {
        let { price, currency } = this.sellOrderForm.value;
        const params = {
            price,
            currency: currency._id,
            nft,
            nonce,
            seller: this.user._id,
            status: 0
        }

        this.exchangeService.exchangeOrder(params).subscribe({
            next: (_response: any) => {
                this.progressData.steps[this.progressData.currentStep].status = 2;
                this.progressData.currentStep = 2;
                this.toastr.success("Sell order created successfully.");
                this.sellOrderForm.patchValue({ price: '' });
                this.saleProcessing = false;
                this.getNft();
                this.getNftAnalytics();
            },
            error: (error: any) => {
                this.saleProcessing = false;
                this.handleError(error);
            }
        })
    }

    async cancelOrder() {
        if (this.regulated) {
            const kycStatus: any = await this.accountService.getKycStatus(this.account?.walletAddress);
            if (kycStatus?.data?.admin_kyc_enable && kycStatus?.data?.kyc_enable && kycStatus?.data?.kyc_verified !== 1) {
                this.toastr.warning("Identity confirmation needed. Please wait while you are redirected to our identification platform.");
                this.setRoute();
                return this.router.navigate(['kyc'])
            }
        }
        this.user = this.webStorageService.getLocalStorage('user') != null ? JSON.parse(this.webStorageService.getLocalStorage('user') || 'undefined') : this.user;
        if (!this.regulated) {
            if (!this.user) {
                this.setRoute();
                this.toastr.warning("Register to continue.")
                return this.router.navigate(['sign-up'])
            } else if (!this.user.email_verified || !this.user?.is_valid) {
                this.verificationModal?.show();
                return
            }
        }

        let txResp: any;
        let tx: any;

        try {
            let isBlocked = await this.accessControlContractService.isBlocked(this.account);
            if (isBlocked) return this.toastr.error("User blocked. Please contact the admin regarding your status.");

            this.cancelProcessing = true;
            this.progressData = {
                title: "Processing.",
                currentStep: 0,
                steps: [
                    {
                        title: "Cancel order.",
                        status: 1
                    },
                    {
                        title: "Update order status.",
                        status: 0
                    },
                ],
                failed: false,
                successTitle: "Order cancelled.",
                image: [this.processImage()]
            }
            this.progressModal?.show();

            // Step 1 - cancel order
            // create cancel order tx
            let txData: any = {
                from: this.account.walletAddress,
                to: (environment as any)[this.account.chainId]['EXCHANGE_CONTRACT'],
                from_id: this.user._id,
                transaction_name: 'Cancel order',
                nft_id: this.nft._id,
                status: 0,
                amount: 0,
                currency_symbol: "-"
            }
            txResp = await this.transactionService.createTransaction(txData);
            let transactionData = {
                status: true,
                count: 0
            }
            this.commonService.transactionEmitter(transactionData);


            // cancel order contract call
            let order: any = await this.exchangeContractService.organizeSellOrder(this.account?.networkId, this.nft.sell_order?.seller.wallet_address, this.nft.collections.collection_address, this.nft.token_id, this.nft.sell_order.currency?.address, this.nft.sell_order.price, this.nft.sell_order.nonce);
            let args = { functionName: 'cancelOrder', args: [order], abiType: 'exchange' }
            let { orderAbi, requiredGas } = await this.exchangeContractService.createExchangeAbi(this.account, args);
            tx = await this.commonService.sendTransaction(this.account, (environment as any)[this.account.chainId]['EXCHANGE_CONTRACT'], orderAbi, requiredGas, args);

            // update cancel order tx
            if (this.regulated) tx = JSON.parse(tx.data);
            txData = {
                status: 1,
                transaction_hash: tx.transactionHash
            }
            await this.transactionService.createTransaction(txData, txResp.data._id);
            transactionData = {
                status: true,
                count: 1
            }
            this.commonService.transactionEmitter(transactionData);


            // step 1 status update
            this.progressData.steps[this.progressData.currentStep].status = 2;
            this.progressData.steps[this.progressData.currentStep + 1].status = 1;
            this.progressData.currentStep = 1;

            // Step 2 - Api to cancel sell order in db
            await this.cancelSellOrder(this.nft.sell_order._id);

        } catch (error: any) {
            this.cancelProcessing = false;
            this.handleError(error, txResp.data._id);
        }
    }

    cancelSellOrder(orderId: string) {
        const params = {
            status: 2
        }

        this.exchangeService.updateSellOrder(orderId, params).subscribe({
            next: (response: any) => {
                this.progressData.steps[this.progressData.currentStep].status = 2;
                this.progressData.currentStep = 2;
                this.sellOrderForm.reset();
                this.sellOrderForm.patchValue({ currency: this.currencies[0], currencyId: this.currencies[0]._id });
                this.cancelProcessing = false;
                this.getNft();
                this.getNftAnalytics();

            },
            error: (error: any) => {
                this.cancelProcessing = false;
                this.handleError(error);
            }
        })
    }

    async getNonce() {
        const nonce: any = await this.commonService.getNonce();
        return nonce.data.exchange_nonce;
    }

    async handleError(error: any, txId: any = '') {
        if (error?.error?.message?.includes('INSUFFICIENT_FUNDS_FOR_FEE')) error.shortMessage = "Insufficient native currency to proceed. To fund your wallet, please contact your account manager. If already funded please wait a few moments.";
        if (error?.error?.message?.includes('was not mined within 50 blocks')) error.shortMessage = "Transaction timeout. Please initiate transaction again.";
        if (error?.error?.message?.includes('please give a proper id')) error.shortMessage = "Item not found in our inventory.";

        if (error?.error?.status_code === 401) {
            error.shortMessage = "Authentication failed. Login again to continue.";
            await this.accountService.updateAuthentication(false);
        }

        error = await JSON.stringify(error, null, 2);
        error = await JSON.parse(error);
        if (error?.shortMessage?.includes('An internal error was received') || error?.shortMessage?.includes('Execution reverted for an unknown reason.') || error?.error?.message?.includes('Transaction has been reverted by the EVM') || (error?.shortMessage?.includes('reverted with the following reason:') && error?.shortMessage?.includes('Order is not created yet'))) {
            let status: any = await this.exchangeContractService.getSaleStatus(this.account.chainId || environment.DEFAULT_NETWORK, this.nft.collections.collection_address, this.nft.token_id);
            if (!status[0]) {
                let { seller, tokenAddress, tokenId, currencyAddress, price, nonce } = status[1];
                let encodedData = encodeAbiParameters(parseAbiParameters('address seller, address tokenAddress, uint256 tokenId, address currencyAddress, uint256 price, uint256 nonce'), [seller, tokenAddress, tokenId, currencyAddress, price, nonce]);
                let bytes = keccak256(encodedData);
                let orderStatus: any = await this.exchangeContractService.getOrderStatus(this.account.chainId || environment.DEFAULT_NETWORK, bytes);
                let orderClass: any = await this.exchangeContractService.getOrderClass(this.account.chainId || environment.DEFAULT_NETWORK);
                let index = orderClass.findIndex((item: any) => item.result === orderStatus);
                if (index === 0) error.shortMessage = "The seller has canceled the sale. Please refresh the page to view the current details."
                else if (index === 1) error.shortMessage = "Someone purchased the item, please refresh the page to view the current details."
            } else error.shortMessage = "Something went wrong, try again later."
        }
        if (error?.shortMessage?.includes('reverted with the following reason:')) {
            let errorMessage = error?.shortMessage?.split('reverted with the following reason:');
            error.shortMessage = errorMessage[errorMessage.length - 1];
            if (error.shortMessage?.includes('Not enough ether sent for minting fee.')) error.shortMessage = 'Not enough matic sent for minting fee.';
            if (error.shortMessage?.includes('ERC20: transfer amount exceeds balance')) error.shortMessage = `The bidder doesn’t have ${this.acceptedBid?.amount} ${this.acceptedBid?.currency?.symbol} to close this bid`
        }

        this.acceptedBid = {};
        this.toastr.error(error?.shortMessage || error?.error?.message || "Something went wrong, try again later.");
        this.progressData.steps[this.progressData.currentStep].status = 3;
        this.progressData.failed = true;

        if (txId) {
            let txData = {
                status: 2,
                error_message: error.shortMessage || "Something went wrong."
            }
            await this.transactionService.createTransaction(txData, txId);
            let transactionData = {
                status: true,
                count: 1
            }
            this.commonService.transactionEmitter(transactionData);
        }
    }

    setCurrency(event: any, type: nftActions) {
        let currency = this.currencies.find((item: any) => item._id === event.target.value);
        if (this.nft?.lazy_mint) {
            // convert price in usd to currency
            let response: any = this.commonService.getTokenPrice(currency.address);
            let usdPrice = response[currency.address.toLowerCase()]?.usd || 0;
            let currencyPrice = usdPrice === 0 ? this.nft?.sell_order.price : this.nft?.sell_order.price / usdPrice;
            this.sellOrderForm.patchValue({ price: Math.ceil(currencyPrice) || 0, currency: currency, currencyId: currency._id })
        } else {
            if (type === nftActions.SELL) this.sellOrderForm.patchValue({ currency, currencyId: currency._id });
            if (type === nftActions.BORROW) this.bidForm.patchValue({ currency, currencyId: currency._id });
            if (type === nftActions.LOAN) this.loanOfferForm.patchValue({ currency, currencyId: currency._id });
        }
    }

    async connectWallet() {
        await this.accountService.enableMetaMaskConnection(true)
    }

    thumbsliderOptions: OwlOptions = {
        loop: false,
        margin: 10,
        autoplay: false,
        autoWidth: true,
        autoHeight: true,
        dots: false,
        nav: false,
        skip_validateItems: true,
        items: 4,


    }

    customOptions: OwlOptions = {
        loop: false,
        margin: 0,
        autoplay: false,
        autoHeight: false,
        autoWidth: false,
        dots: false,
        nav: false,
        items: 1,
        mouseDrag: false,
        touchDrag: false,
        pullDrag: false,

    };

    changeimage(image: string) {
        this.selectedImage = image;
    }

    /**
     * Go back
     */
    public goBack() {

        if (window.history.length == 1 || window.location.href.includes('showAll')) {
            this.router.navigate(['/']);
        }
        else {
            this.location.back();
        }
    }

    /**
     * Sets tooltip
     */
    public setTooltip() {
        setTimeout(() => {
            (<HTMLElement>document.getElementById(`tooltip-title`))?.classList.remove('add-content');
            const tooltipTitleElement = document.getElementById('tooltip-title');
            if (tooltipTitleElement) {
                const contentHeight = (<HTMLElement>tooltipTitleElement).scrollHeight;
                (<HTMLElement>document.getElementById(`tooltip-title`))?.classList.add('add-content');
                if (contentHeight > 71) {
                    (<HTMLElement>document.getElementById(`tooltip-description`)).style.display = 'block';
                }
                else {
                    (<HTMLElement>document.getElementById(`tooltip-description`)).style.display = 'none';
                }
            }
        }, 1000);
    }

    /**
     * Sets tooltip based on screen size
     * @param {number} index
     */
    public setTooltipSize() {
        (<HTMLElement>document.getElementById(`tooltip-title`)).classList.remove('add-content');
        const contentHeight = (<HTMLElement>document.getElementById(`tooltip-title`)).scrollHeight;
        (<HTMLElement>document.getElementById(`tooltip-title`)).classList.add('add-content');
        if (contentHeight > 71) {
            (<HTMLElement>document.getElementById(`tooltip-description`)).style.display = 'block';
        }
        else {
            (<HTMLElement>document.getElementById(`tooltip-description`)).style.display = 'none';
        }
    }

    get transferNftFormControls() {
        return this.transferNftForm.controls;
    }

    async transferNft() {
        this.transferNftFormSubmitted = true;
        if (this.regulated) {
            const kycStatus: any = await this.accountService.getKycStatus(this.account?.walletAddress);
            if (kycStatus?.data?.admin_kyc_enable && kycStatus?.data?.kyc_enable && kycStatus?.data?.kyc_verified !== 1) {
                this.toastr.warning("Identity confirmation needed. Please wait while you are redirected to our identification platform.");
                this.setRoute();
                return this.router.navigate(['kyc'])
            }
        }
        this.user = this.webStorageService.getLocalStorage('user') != null ? JSON.parse(this.webStorageService.getLocalStorage('user') || 'undefined') : this.user;
        if (!this.regulated) {
            if (!this.user) {
                this.setRoute();
                this.toastr.warning("Register to continue.")
                return this.router.navigate(['sign-up'])
            } else if (!this.user.email_verified || !this.user?.is_valid) {
                this.verificationModal?.show();
                return
            }
        }
        let txResp: any;
        let tx: any;
        try {
            let isBlocked = await this.accessControlContractService.isBlocked(this.account);
            if (isBlocked) return this.toastr.error("User blocked. Please contact the admin regarding your status.");
            if (this.transferNftForm.valid) {
                this.transferNftProcessing = true;
                this.progressData = {
                    title: "Processing.",
                    currentStep: 0,
                    steps: [
                        {
                            title: "Transfer item.",
                            status: 1
                        },
                        {
                            title: "Update item owner.",
                            status: 0
                        },
                    ],
                    failed: false,
                    successTitle: "Item transferred.",
                    image: [this.processImage()]
                }
                this.transferModal?.hide();
                this.progressModal?.show();

                // create transfer nft operation in db
                let txData: any = {
                    from: this.account.walletAddress,
                    to: this.nft.collections.collection_address,
                    from_id: this.user._id,
                    transaction_name: 'Transfer item',
                    nft_id: this.nft._id,
                    status: 0,
                    amount: 0,
                    currency_symbol: "-"
                }
                txResp = await this.transactionService.createTransaction(txData);
                let transactionData = {
                    status: true,
                    count: 0
                }
                this.commonService.transactionEmitter(transactionData);

                // Step 1 - transfer nft
                let args = { functionName: 'transferFrom', args: [this.account.walletAddress, this.transferNftForm.value.walletAddress, this.nft.token_id], abiType: 'erc721' }
                let { transferAbi, requiredGas } = await this.nftContractService.transferNft(this.account, this.nft.collections.collection_address, args);
                tx = await this.commonService.sendTransaction(this.account, this.nft.collections.collection_address, transferAbi, requiredGas, args);
                this.progressData.steps[this.progressData.currentStep].status = 2;
                this.progressData.steps[this.progressData.currentStep + 1].status = 1;
                this.progressData.currentStep = 1;

                // update transfer nft operation in db
                if (this.regulated) tx = JSON.parse(tx.data);
                txData = {
                    status: 1,
                    transaction_hash: tx.transactionHash
                }
                await this.transactionService.createTransaction(txData, txResp.data._id);
                transactionData = {
                    status: true,
                    count: 1
                }
                this.commonService.transactionEmitter(transactionData);

                // Step 2 - Api to update nft owner in db
                const params = {
                    from: this.account.walletAddress,
                    to: this.transferNftForm.value.walletAddress,
                    collection_address: this.nft.collections.collection_address,
                    token_id: this.nft.token_id,
                    transaction_hash: tx.transactionHash
                }

                this.nftService.transferNft(params).subscribe({
                    next: (response: any) => {
                        this.progressData.steps[this.progressData.currentStep].status = 2;
                        this.progressData.currentStep = 2;
                        this.transferNftForm.reset();
                        this.transferModal?.hide();
                        this.transferNftProcessing = false;
                        this.getNft();
                        this.getNftAnalytics();
                    },
                    error: (error: any) => {
                        this.transferNftProcessing = false;
                        this.handleError(error);
                    }
                })
            }
        } catch (error: any) {
            this.transferNftProcessing = false;
            this.handleError(error, txResp.data._id);
        }
    }

    cancelTransfer() {
        this.transferNftFormSubmitted = false;
        this.transferModal?.hide();
        this.transferNftForm.reset();
    }

    /**
     * Gets faq
     * @param {string} search
     * @param {string} category
     * @param {string} selected
     */
    getFaq(search: string, category: string, selected: string) {
        this.faqManagementService.getFaq(search, category, selected).subscribe((response: any) => {
            this.faqData = response['data'].docs;
        },
            (error) => {
                if (error.error.message != '') this.toastr.error(error.error.message)
            })
    }
    /**
     * wallet address copy
     */
    copiedWalletAddress(text: any) {
        this.clibboard.copy(text);
        this.toast.success('Wallet address copied.', 'Success');
    }
    copyAddress(text: any) {
        this.clibboard.copy(text);
        this.toast.success('Wallet address copied.', 'Success');
    }

    copyLogsAddress(text: any) {
        this.clibboard.copy(text);
        this.toast.success('Address copied successfully.');
    }
    /**
     * collapse
     */
    showCoppasedtable() {
        this.tranasacationlog = !this.tranasacationlog;
        this.webStorageService.setItem('isActivityTableCollpased', this.tranasacationlog);
    }
    viewDetails() {
        this.detailsshow = !this.detailsshow;
    }
    /**transacation expand and collapse */
    showTransacation() {
        this.showtransactiondetail = !this.showtransactiondetail;
    }
    /** offer details */
    bidOffer() {
        this.bettingoffer = !this.bettingoffer;
        this.webStorageService.setItem('isOfferTableCollpased', JSON.stringify(this.bettingoffer));
    }
    contractDetail() {
        this.contractview = !this.contractview;
        this.webStorageService.setItem('isContractTableCollpased', this.contractview);

    }
    makeBid() {
        this.selectbid = !this.selectbid;
    }

    async submitBid() {
        if (this.account?.walletAddress === this.nft?.owner) {
            return this.toastr.error("You cannot bid on your own item.")
        }
        if (this.regulated) {
            const kycStatus: any = await this.accountService.getKycStatus(this.account?.walletAddress);
            if (kycStatus?.data?.admin_kyc_enable && kycStatus?.data?.kyc_enable && kycStatus?.data?.kyc_verified !== 1) {
                this.toastr.warning("Identity confirmation needed. Please wait while you are redirected to our identification platform.");
                this.setRoute();
                return this.router.navigate(['kyc'])
            }
        }
        this.user = this.webStorageService.getLocalStorage('user') != null ? JSON.parse(this.webStorageService.getLocalStorage('user') || 'undefined') : this.user;
        if (!this.regulated) {
            if (!this.user) {
                this.setRoute();
                this.toastr.warning("Register to continue.")
                return this.router.navigate(['sign-up'])
            } else if (!this.user.email_verified || !this.user?.is_valid) {
                this.verificationModal?.show();
                return
            }
        }
        let txResp: any;
        let tx: any;
        try {
            if (this.bidForm.valid) {
                let isBlocked = await this.accessControlContractService.isBlocked(this.account);
                if (isBlocked) return this.toastr.error("User blocked. Please contact the admin regarding your status.");

                this.bidProcessing = true;
                this.progressData = {
                    title: "Processing.",
                    currentStep: 0,
                    steps: [
                        {
                            title: "Approve currency.",
                            status: 1
                        },
                        {
                            title: this.userBid?._id ? "Create signature and edit bid." : "Create signature and create offer.",
                            status: 0
                        },
                    ],
                    failed: false,
                    successTitle: this.userBid?._id ? "Bid editted." : "Bid submitted.",
                    image: [this.processImage()]
                }
                this.progressModal?.show();

                let { amount, currency } = this.bidForm.value;

                // create approve currency process in db
                let txData: any = {
                    from: this.account.walletAddress,
                    to: currency.address,
                    from_id: this.user._id,
                    transaction_name: 'Approve currency',
                    nft_id: this.nft._id,
                    status: 0,
                    amount: amount,
                    currency_symbol: currency?.symbol
                }
                txResp = await this.transactionService.createTransaction(txData);
                let transactionData = {
                    status: true,
                    count: 0
                }

                this.commonService.transactionEmitter(transactionData);

                // Step 1 - Approve currency
                let decimal = await this.erc20ContractService.getDecimal(this.account?.networkId, currency.address);
                amount = this.contractUtils.decimalMultipler(Number(decimal), Number(amount))
                let args = { functionName: 'increaseAllowance', args: [(environment as any)[this.account.chainId].EXCHANGE_CONTRACT, amount], abiType: 'erc20' }
                const { approveAbi, requiredGas } = await this.erc20ContractService
                    .approve(
                        this.account,
                        currency.address,
                        args
                    );
                tx = await this.commonService.sendTransaction(this.account, currency.address, approveAbi, requiredGas, args);
                this.progressData.steps[this.progressData.currentStep].status = 2;
                this.progressData.steps[this.progressData.currentStep + 1].status = 1;
                this.progressData.currentStep = 1;
                // update approe currency process in db
                if (this.regulated) tx = JSON.parse(tx.data);
                txData = {
                    status: 1,
                    transaction_hash: tx.transactionHash
                }
                await this.transactionService.createTransaction(txData, txResp.data._id);
                transactionData = {
                    status: true,
                    count: 1
                }
                this.commonService.transactionEmitter(transactionData);
                // Step 2- Create Signature
                let signature = await this.createSignature(amount, currency);

                // create tx log - create bid

                let createBidtxData: any = {
                    from: this.account.walletAddress,
                    to: (environment as any)[this.account.chainId].EXCHANGE_CONTRACT,
                    from_id: this.user._id,
                    nft_id: this.nft._id,
                    status: 1,
                    amount: this.contractUtils.decimalDivider(Number(decimal), amount),
                    currency_symbol: currency.symbol
                }

                // Step 2 - Submit Bid
                let params, method;
                if (!this.userBid?._id) {
                    createBidtxData['transaction_name'] = 'Create bid';
                    params = { from: this.user._id, amount: this.contractUtils.decimalDivider(Number(decimal), amount), currency: currency._id, quantity: 1, nft: this.nft._id, signature }
                    method = this.exchangeService.createBid(params);
                } else {
                    createBidtxData['transaction_name'] = 'Update bid';
                    params = { status: 1, amount: this.contractUtils.decimalDivider(Number(decimal), amount), currency: currency._id, signature };
                    method = this.exchangeService.updateBid(this.userBid?._id, params)
                }

                method.subscribe({
                    next: async () => {
                        txResp = await this.transactionService.createTransaction(createBidtxData);
                        let transactionData = {
                            status: true,
                            count: 1
                        }
                        this.commonService.transactionEmitter(transactionData);
                        this.bidSubmitted = true;
                        this.progressData.steps[this.progressData.currentStep].status = 2;
                        this.progressData.currentStep = 2;
                        this.bidForm.reset();
                        this.bidForm.patchValue({ currency: this.currencies[0], currencyId: this.currencies[0]._id });
                        this.bidProcessing = false;
                        this.listBids();
                    },
                    error: (error: any) => {
                        this.bidProcessing = false;
                        this.handleError(error, txResp.data._id);
                    }
                })
            } else this.toastr.error("All fields are required");
        } catch (error: any) {
            this.bidProcessing = false;
            this.handleError(error, txResp.data._id);
        }
    }

    async createSignature(amount: any, currency: any) {
        const domain = {
            name: 'Bid',
            version: '1',
            chainId: (environment as any)[this.account.chainId].CHAINID,
            verifyingContract: (environment as any)[this.account.chainId].EXCHANGE_CONTRACT
        }

        // The named list of all type definitions
        const types = {
            Bid: [
                { name: 'to', type: 'address' },
                { name: 'amount', type: 'uint256' },
                { name: 'currency', type: 'address' },
                { name: 'quantity', type: 'uint256' },
                { name: 'tokenAddress', type: 'address' },
                { name: 'tokenId', type: 'uint256' }
            ],
        }
        let signature;
        let message = { to: this.account.walletAddress, amount, currency: currency.address, quantity: 1, tokenAddress: this.nftCollection, tokenId: this.nftTokenId }
        if (this.regulated) {
            let response: any = await this.exchangeService.getSignature({ params: message, accountId: this.user.fire_block_address, signerAddress: this.account.walletAddress, contract: (environment as any)[this.account.chainId].EXCHANGE_CONTRACT });
            signature = response?.data;
        }
        if (!this.regulated) {
            signature = await signTypedData({
                domain,
                message,
                primaryType: 'Bid',
                types,
            });
        }

        return signature;
    }

    async listBids() {
        this.exchangeService.getBids(this.nft._id).subscribe({
            next: (response: any) => {
                this.bids = Object.keys(response?.data).length > 0 ? response?.data?.docs : [];
                if (this.bids?.length > 0 && this.user) {
                    this.bettingoffer = false; // Always expand the bids table if there are bids
                    this.userBid = this.bids.find(item => item.from._id === this.user._id && item.status != 2);
                    this.userBid ? this.bidForm.patchValue({ amount: this.userBid?.amount, currency: this.userBid?.currency, currencyId: this.userBid?.currency._id }) : this.bidForm.patchValue({ currency: this.currencies[0], currencyId: this.currencies[0]._id });
                } else {
                    // If no bids, use the stored value or default to collapsed
                    this.bettingoffer = this.getParsedItemFromStorage('isOfferTableCollpased', true);
                    this.bidForm.patchValue({ currency: this.currencies[0], currencyId: this.currencies[0]._id });
                }
            },
            error: (error: any) => {
                this.bidProcessing = false;
                this.handleError(error);
            }
        })
    }

    async cancelBid() {
        if (this.regulated) {
            const kycStatus: any = await this.accountService.getKycStatus(this.account?.walletAddress);
            if (kycStatus?.data?.admin_kyc_enable && kycStatus?.data?.kyc_enable && kycStatus?.data?.kyc_verified !== 1) {
                this.toastr.warning("Identity confirmation needed. Please wait while you are redirected to our identification platform.");
                this.setRoute();
                return this.router.navigate(['kyc'])
            }
        }
        this.user = this.webStorageService.getLocalStorage('user') != null ? JSON.parse(this.webStorageService.getLocalStorage('user') || 'undefined') : this.user;
        if (!this.regulated) {
            if (!this.user) {
                this.setRoute();
                this.toastr.warning("Register to continue.")
                return this.router.navigate(['sign-up'])
            } else if (!this.user.email_verified || !this.user?.is_valid) {
                this.verificationModal?.show();
                return
            }
        }
        try {
            let isBlocked = await this.accessControlContractService.isBlocked(this.account);
            if (isBlocked) return this.toastr.error("User blocked. Please contact the admin regarding your status.");

            this.cancelBidProcessing = true;
            this.progressData = {
                title: "Processing.",
                currentStep: 0,
                steps: [
                    {
                        title: "Cancel bid.",
                        status: 1
                    }
                ],
                failed: false,
                successTitle: "Bid cancelled.",
                image: [this.processImage()]
            }
            this.progressModal?.show();

            // Step 1 - cancel bid
            const params = {
                status: 2
            }
            let cancelBidtxData: any = {
                from: this.account.walletAddress,
                to: (environment as any)[this.account.chainId].EXCHANGE_CONTRACT,
                from_id: this.user._id,
                transaction_name: 'Cancel bid',
                nft_id: this.nft._id,
                status: 1,
                amount: 0,
                currency_symbol: '-'
            }
            let txResp: any;
            this.exchangeService.cancelBid(this.userBid._id, params).subscribe({
                next: async (response: any) => {
                    this.progressData.steps[this.progressData.currentStep].status = 2;
                    this.progressData.currentStep = 1;
                    this.bidForm.reset();
                    this.bidForm.patchValue({ currency: this.currencies[0]._id });
                    this.cancelBidProcessing = false;
                    this.listBids();
                    txResp = await this.transactionService.createTransaction(cancelBidtxData);
                    let transactionData = {
                        status: true,
                        count: 1
                    }
                    this.commonService.transactionEmitter(transactionData);
                },
                error: (error: any) => {
                    this.cancelProcessing = false;
                    this.handleError(error, txResp.data._id);
                }
            })

        } catch (error: any) {
            this.cancelProcessing = false;
            this.handleError(error);
        }
    }

    async acceptBid(bid: any) {
        this.acceptedBid = bid;
        if (this.regulated) {
            const kycStatus: any = await this.accountService.getKycStatus(this.account?.walletAddress);
            if (kycStatus?.data?.admin_kyc_enable && kycStatus?.data?.kyc_enable && kycStatus?.data?.kyc_verified !== 1) {
                this.toastr.warning("Identity confirmation needed. Please wait while you are redirected to our identification platform.");
                this.setRoute();
                return this.router.navigate(['kyc'])
            }
        }
        this.user = this.webStorageService.getLocalStorage('user') != null ? JSON.parse(this.webStorageService.getLocalStorage('user') || 'undefined') : this.user;
        if (!this.regulated) {
            if (!this.user) {
                this.setRoute();
                this.toastr.warning("Register to continue.")
                return this.router.navigate(['sign-up'])
            } else if (!this.user.email_verified || !this.user?.is_valid) {
                this.verificationModal?.show();
                return
            }
        }

        try {
            let isBlocked = await this.accessControlContractService.isBlocked(this.account);
            if (isBlocked) return this.toastr.error("User blocked. Please contact the admin regarding your status.");

            let saleStatus: any = await this.exchangeService.getBid(bid._id);
            if (!saleStatus.data.is_canceled && saleStatus.data?.amount == this.acceptedBid?.amount && saleStatus.data?.currency_address === this.acceptedBid?.currency?.address) {
                if (this.nft.in_sale) {
                    this.confirmationData = {
                        image: [this.processImage()],
                        content: `Accepting bid would cancel the existing sale. Are you sure you want to proceed with it</b>?`
                    }
                    this.confirmationModal?.show();
                } else if (this.nft.for_loan && !this.nft.on_loan) {
                    this.confirmationData = {
                        image: [this.processImage()],
                        content: `Accepting bid would cancel the existing loan. Are you sure you want to proceed with it.</b>`
                    }
                    this.confirmationModal?.show();
                } else if (!this.nft.for_loan && this.nft.on_loan) {
                    this.toastr.error("Unable to accept bid request for the live loan item.");
                } else {
                    this.confirmAcceptBid();
                }
            } else {
                this.toastr.error(saleStatus.data.is_canceled ? "Bid was calcelled by bidder. Please refresh the page to get current status" : "Bid amount or currency was updated by bidder. Please refresh the page to get current status");
            }
        } catch (error: any) {
            this.bidProcessing = false;
            this.handleError(error);
        }
    }

    async confirmAcceptBid(steps?: any) {
        this.confirmationModal?.hide();
        let txResp: any;
        let tx: any;
        try {
            if (!steps) {
                steps = [
                    {
                        title: "Approve item.",
                        status: 1
                    },
                    {
                        title: "Accept bid.",
                        status: 0
                    },
                ]
            }
            this.progressData = {
                title: "Processing.",
                currentStep: 0,
                steps: steps,
                failed: false,
                successTitle: "Bid accepted.",
                image: [this.processImage()]
            }
            this.progressModal?.show();

            if (this.nft.for_loan && !this.nft.on_loan) {
                const nfts = await this.getNftsFromLoanRequest();

                // create cancel loan request nft tx
                let txData: any = {
                    from: this.account.walletAddress,
                    to: (environment as any)[this.account?.chainId].BORROW_LEND_CONTRACT,
                    from_id: this.user._id,
                    transaction_name: 'Cancel loan',
                    nft_id: nfts,
                    status: 0,
                    amount: 0,
                    currency_symbol: "-"
                }
                txResp = await this.transactionService.createTransaction(txData);
                let transactionData = {
                    status: true,
                    count: 0
                }
                this.commonService.transactionEmitter(transactionData);

                // Step 1
                let args = { functionName: 'cancelLoan', args: [this.loanRequest.nonce], abiType: 'loan' }
                const { cancelLoanAbi, requiredGas } = await this.borrowLendContractService.cancelLoanRequest(this.account, args);
                tx = await this.commonService.sendTransaction(this.account, (environment as any)[this.account?.chainId].BORROW_LEND_CONTRACT, cancelLoanAbi, requiredGas, args);
                // this.progressData.steps[this.progressData.currentStep].status = 2;
                // this.progressData.steps[this.progressData.currentStep + 1].status = 1;
                // this.progressData.currentStep = 1;
                if (this.regulated) tx = JSON.parse(tx.data);
                txData = {
                    status: 1,
                    transaction_hash: tx.transactionHash
                }
                await this.transactionService.createTransaction(txData, txResp.data._id);
                transactionData = {
                    status: true,
                    count: 1
                }
                this.commonService.transactionEmitter(transactionData);

                // Step 2 - Api to write cancel loan request to db
                this.loanService.cancelLoan(this.loanRequest._id).subscribe({
                    next: (res: any) => {
                        this.progressData.steps[this.progressData.currentStep].status = 2;
                        this.progressData.steps[this.progressData.currentStep + 1].status = 1;
                        this.progressData.currentStep = 1;
                        this.toastr.success("Loan request cancelled.");
                        // this.router.navigate(['my-wallet'])
                    },
                    error: (error: any) => {
                        this.handleError(error);
                    }
                })

            }

            // Step 1 - check balance
            let decimal = await this.erc20ContractService.getDecimal(this.account?.networkId, this.acceptedBid?.currency.address);
            let balance = await this.erc20ContractService.getBalance(this.account?.networkId, this.acceptedBid?.currency?.address, this.acceptedBid?.from.wallet_address);
            if (Number(balance) < Number(this.contractUtils.decimalMultipler(Number(decimal), this.acceptedBid?.amount))) {
                this.toastr.error(`The bidder doesn’t have ${this.acceptedBid?.amount} ${this.acceptedBid?.currency?.symbol} to close this bid.`);
                this.progressData.steps[this.progressData.currentStep].status = 3;
                this.progressData.failed = true;
                this.buyProcessing = false;
                return;
            }
            // Step 1 - approve nft
            let approvedAddess: any = await this.collectionContractService.getApproved(this.account?.networkId, this.nft.collections.collection_address, this.nft.token_id);
            if (approvedAddess !== await getAddress((environment as any)[this.account.chainId]['EXCHANGE_CONTRACT'])) {
                // create approve nft tx
                let txData: any = {
                    from: this.account.walletAddress,
                    to: this.nft.collections.collection_address,
                    from_id: this.user._id,
                    transaction_name: 'Approve item',
                    nft_id: this.nft._id,
                    status: 0,
                    amount: 0,
                    currency_symbol: "-"
                }
                txResp = await this.transactionService.createTransaction(txData);


                let transactionData = {
                    status: true,
                    count: 0
                }
                this.commonService.transactionEmitter(transactionData);

                // approve contract call
                let args = { functionName: 'approve', args: [(environment as any)[this.account.chainId]['EXCHANGE_CONTRACT'], this.nft.token_id], abiType: 'erc721' };
                let { approveAbi, requiredGas } = await this.collectionContractService.approveNft(this.account, this.nft.collections.collection_address, args);
                tx = await this.commonService.sendTransaction(this.account, this.nft.collections.collection_address, approveAbi, requiredGas, args);

                // update approve nft tx
                if (this.regulated) tx = JSON.parse(tx.data);
                txData = {
                    status: 1,
                    transaction_hash: tx.transactionHash
                }
                await this.transactionService.createTransaction(txData, txResp.data._id);
                transactionData = {
                    status: true,
                    count: 1
                }
                this.commonService.transactionEmitter(transactionData);
            }
            // step 1 status update
            this.progressData.steps[this.progressData.currentStep].status = 2;
            this.progressData.steps[this.progressData.currentStep + 1].status = 1;
            if (steps) {
                if (steps.length == 2) {
                    this.progressData.currentStep = 1;
                }
                else {
                    this.progressData.currentStep = 2;
                }

            } else {
                this.progressData.currentStep = 1;
            }

            // Step 2 - Accept Bid
            let txData: any = {
                from: this.account.walletAddress,
                to: (environment as any)[this.account.chainId]['EXCHANGE_CONTRACT'],
                from_id: this.user._id,
                transaction_name: 'Accept bid',
                nft_id: this.nft._id,
                status: 0,
                amount: 0,
                currency_symbol: "-"
            }
            txResp = await this.transactionService.createTransaction(txData);
            let transactionData = {
                status: true,
                count: 0
            }
            this.commonService.transactionEmitter(transactionData);
            // accept bid contract call
            let order = { to: this.acceptedBid?.from.wallet_address, amount: this.contractUtils.decimalMultipler(Number(decimal), this.acceptedBid?.amount), currency: this.acceptedBid?.currency.address, quantity: 1, tokenAddress: this.nftCollection, tokenId: this.nftTokenId };
            let args = { functionName: 'acceptBid', args: [order, this.acceptedBid?.signature], abiType: 'exchange' }
            let { orderAbi, requiredGas } = await this.exchangeContractService.createExchangeAbi(this.account, args);
            tx = await this.commonService.sendTransaction(this.account, (environment as any)[this.account.chainId]['EXCHANGE_CONTRACT'], orderAbi, requiredGas, args);
            // update approve nft tx
            if (this.regulated) tx = JSON.parse(tx.data);
            txData = {
                status: 1,
                transaction_hash: tx.transactionHash
            }
            await this.transactionService.createTransaction(txData, txResp.data._id);
            transactionData = {
                status: true,
                count: 1
            }

            this.commonService.transactionEmitter(transactionData);

            // Step 2 - Api to write accept bid to db
            await this.acceptBidOrder(this.acceptedBid?._id, steps);
        } catch (error: any) {
            this.bidProcessing = false;
            this.handleError(error, txResp.data._id);
        }
    }

    acceptBidOrder(bidId: string, steps?: number) {
        this.exchangeService.acceptBid(bidId).subscribe({
            next: (_response: any) => {
                this.acceptedBid = {};
                this.progressData.steps[this.progressData.currentStep].status = 2;
                // this.progressData.currentStep = 2;

                // this.progressData.steps[this.progressData.currentStep].status = 2;
                // this.progressData.steps[this.progressData.currentStep + 1].status = 1;
                // this.progressData.currentStep = 1;
                if (steps) {
                    if (this.progressData.steps.length == 2) {
                        this.progressData.currentStep = 2;
                    }
                    else {
                        this.progressData.currentStep = 3;
                    }
                } else {
                    this.progressData.currentStep = 2;
                }
                this.toastr.success("Bid accepted successfully.");
                this.saleProcessing = false;
                this.getNft();
            },
            error: (error: any) => {
                this.bidProcessing = false;
                this.handleError(error);
            }
        })
    }

    /**
     * view all transactions
     */
    viewAllTransactions() {
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { showAll: true },
            queryParamsHandling: 'merge',
        });
        this.showAllTransactions = true;
    }

    /**
     * show details
     */
    showDetails() {
        this.showAllTransactions = false;
    }

    /**
     * hover show modal
     */
    showModal(imageSrc: string) {
        this.currentImage = imageSrc;
        this.isModalVisible = true;
    }

    hideModal() {
        this.isModalVisible = false;
    }
    /**
     * redeem status
     */
    redeemStatus() {
        this.redeemshow = !this.redeemshow;
    }

    getBids(data: any[] = []) {
        this.bids = data;
    }

    async confirmPurchase() {
        if (this.isCancellingDelivery) {
            this.confirmCancelDelivery();
            return
        }
        if (Object.keys(this.acceptedBid).length > 0) {
            let steps;
            if (this.nft.for_loan && !this.nft.on_loan) {
                steps = [
                    {
                        title: "Cancel loan request.",
                        status: 1
                    },
                    {
                        title: "Approve item.",
                        status: 0
                    },
                    {
                        title: "Accept bid.",
                        status: 0
                    },
                ]
            }
            this.confirmAcceptBid(steps);
        } else if (this.loanOffer && Object.keys(this.loanOffer).length > 0) {
            this.confirmAcceptLoanOffer();
        } else {
            this.confirmSalePurchase();
        }
    }

    /**
   * Gets nfts from loan request
   * @returns
   */
    private getNftsFromLoanRequest() {
        return new Promise((resolve, reject) => {
            this.loanService.getLoanRequestByNftId(this.nft._id).subscribe({
                next: (response: any) => {
                    this.loanRequest = response.data;
                    let nfts: any[] = [];
                    const nftAssets = this.loanRequest.collateral_assets;
                    for (let index = 0; index < nftAssets.length; index++) {
                        nfts.push(nftAssets[index]._id);
                    };
                    resolve(nfts);
                },
                error: (error: any) => {
                    if (error?.error?.status_code === 404 || error?.error?.status_code === 400) this.router.navigate(['/**'])
                    else this.handleError(error);
                    reject(error);
                }
            });
        });
    }

    /**
     * track delivery
     * @param{string}deliveryId
     */
    getDeliveryDetails(deliveryId: string) {
        this.deliveryService.trackDeliveryRequest(deliveryId).subscribe({
            next: (response: IApiResponse) => {
                this.deliveryData = response.data?.historyDetails;
            },
            error: (error: HttpErrorResponse) => {
                this.handleError(error);
            }
        })
    }

    /**
     * cancel delivery request
     */
    cancelDelivery() {
        this.isCancellingDelivery = true;
        this.confirmationData = {
            image: [this.processImage()],
            content: `Are you sure you want to cancel the delivery of ` + `<b>${this.nft?.name}</b>?`
        }
        this.confirmationModal?.show();

    }

    /**
     * confirm cancel delivery
     */
    confirmCancelDelivery() {
        const payload = {
            status: 6,
            user_id: this.user?._id
        }
        this.deliveryService.cancelDeliveryRequest(this.nft?.delivery_id, payload).subscribe({
            next: (response: IApiResponse) => {
                this.isCancellingDelivery = false;
                this.toastr.success(response.message);
                this.getNft();
                this.confirmationModal?.hide();
            },
            error: (error: HttpErrorResponse) => {
                this.confirmationModal?.hide();
                this.isCancellingDelivery = false;
                this.handleError(error);
            }

        })
    }

    setRoute() {
        this.webStorageService.setItem('previousRoute', this.router.url)
    }

    /**
     * to verify email page
     */
    navigateToEmailVerificationPage() {
        this.router.navigate(['/verify-email']);
        this.toastr.error("Please verify your email");
        return
    }

    /**
   * process images to send to confirmation modal
   */
    private processImage() {
        if (this.nft.fileType === 'html') {
            this.processedImage = {
                ...this.nft,
                displayImage: this.nft.preview_image ? this.nft.preview_image : this.nft.secondary_media[0]
            };
        } else {
            this.processedImage = {
                ...this.nft,
                displayImage: this.nft.preview_image ? this.nft.preview_image : this.nft.primary_media
            };
        }
        return this.processedImage;

    }
    /**
  * sale offer
  */
    saleOffer() {
        this.saleoffers = !this.saleoffers;
    }
    /**
     * make loan offer
     */
    makeLoanOffer() {
        this.createloanoffer = !this.createloanoffer;
    }
    /***
     * right side make loan offer
     */
    makeLoanoffer() {
        this.loancreate = !this.loancreate
    }

    isLiveLoan(loan: any) {
        let LOAN_IN_DAYS = this.account?.chainId ? (environment as any)[this.account.chainId].LOAN_IN_DAYS : (environment as any)['DEFAULT_NETWORK'].LOAN_IN_DAYS;
        if (environment.ENVNAME === 'DEVELOPMENT') loan.end_date = moment(loan.start_date).clone().add(loan.duration, LOAN_IN_DAYS ? 'days' : 'hours').toISOString()
        return moment(moment().format("YYYY-MM-DD, hh:mm a"), 'YYYY-MM-DD, hh:mm a').isBefore(moment(moment(loan?.end_date).format("YYYY-MM-DD, hh:mm a"), 'YYYY-MM-DD, hh:mm a'))
    }

    decimalFilter(event: any) {
        const reg = /^\d*(\.\d{0,4})?$/;
        let input = event.target.value + String.fromCharCode(event.charCode);
        if (!reg.test(input)) {
            event.preventDefault();
        }
    }

    async calculateInterest() {
        let { requested_loan_amount, loan_duration_days, loan_percentage } = this.loanOfferForm.value;
        let { interest_amount, total_amount } = await this.commonService.calculateInterest(requested_loan_amount, loan_duration_days, loan_percentage, this.account?.chainId);
        this.loanOfferForm.patchValue({ interest_amount: interest_amount.toFixed(3), total_amount: total_amount.toFixed(3) })
    }

    get loanOfferFormControls() {
        return this.loanOfferForm.controls;
    }

    async submitLoanOffer() {
        // regulated user kyc status
        if (this.regulated) {
            const kycStatus: any = await this.accountService.getKycStatus(this.account?.walletAddress);
            if (kycStatus?.data?.admin_kyc_enable && kycStatus?.data?.kyc_enable && kycStatus?.data?.kyc_verified !== 1) {
                this.toastr.warning("Identity confirmation needed. Please wait while you are redirected to our identification platform.");
                this.setRoute();
                return this.router.navigate(['kyc'])
            }
        }

        // unregulated user register / email verification status
        if (!this.regulated) {
            if (!this.user) {
                this.setRoute();
                this.toastr.warning("Register to continue.")
                return this.router.navigate(['sign-up'])
            } else if (!this.user.email_verified || !this.user?.is_valid) {
                this.verificationModal?.show();
                return
            }
        }

        // user access status
        let isBlocked = await this.accessControlContractService.isBlocked(this.account);
        if (isBlocked) return this.toastr.error("User blocked. Please contact the admin regarding your status.");

        this.loanOfferSubmitted = true;
        this.loanOfferProcessing = true;
        this.loanOfferForm.patchValue({ collateral_assets: [this.nft?._id] })
        console.log(this.loanOfferForm)

        if (this.loanOfferForm.valid) {
            this.createLoanOffer();
        } else {
            this.loanOfferProcessing = false;
            this.toastr.error('Please fill all the required fields.');
        }
    }

    async createLoanOffer() {
        console.log('loan offer');
        let txResp;
        try {
            this.progressData = {
                title: "Processing.",
                currentStep: 0,
                steps: [
                    {
                        title: "Approve currency.",
                        status: 1
                    },
                    {
                        title: this.userOffer?._id ? "Create signature and edit loan offer." : "Create signature and create loan offer.",
                        status: 0
                    },
                ],
                failed: false,
                successTitle: this.userOffer?._id ? "Loan offer edited" : "Loan offer submitted.",
                image: [this.processImage()]
            }
            this.progressModal?.show();

            // Step 1 - Approve currency
            await this.approveCurrency();

            // Step 2- Create Signature and create loan offer
            let { signature, lendRequest } = await this.createLoanOfferSignature();

            // Submit Loan offer
            let { currency: currency, requested_loan_amount, loan_duration_days, loan_percentage } = this.loanOfferForm.value;

            let params: any = {
                amount: requested_loan_amount,
                currency: currency._id,
                interest_rate: loan_percentage,
                duration_in_days: loan_duration_days,
                start_time: lendRequest.startTime,
                signature
            }

            // make loan offer tx record in db
            let createLoanOffertxData: any = {
                from: this.account.walletAddress,
                to: (environment as any)[this.account.chainId].BORROW_LEND_CONTRACT,
                from_id: this.user._id,
                nft_id: this.nft._id,
                status: 1,
                amount: requested_loan_amount,
                currency_symbol: currency.symbol
            }

            let method;
            if (!this.userOffer?._id) {
                createLoanOffertxData['transaction_name'] = "Create Loan Offer"
                params = {
                    ...params,
                    collection_address: this.nft?.collections.collection_address,
                    token_id: this.nft?.token_id,
                    lender: this.user._id
                }
                method = this.loanService.createLoanOffer(params);
            } else {
                createLoanOffertxData['transaction_name'] = "Edit Loan Offer"
                method = this.loanService.editLoanOffer(this.userOffer?._id, params)
            }

            method.subscribe({
                next: async () => {
                    txResp = await this.transactionService.createTransaction(createLoanOffertxData);
                    let transactionData = {
                        status: true,
                        count: 1
                    }
                    this.commonService.transactionEmitter(transactionData);
                    this.loanOfferSubmitted = false;
                    this.loanOfferProcessing = false;
                    this.progressData.steps[this.progressData.currentStep].status = 2;
                    this.progressData.currentStep = 2;
                    this.loanOfferForm.reset();
                    this.loanOfferForm.patchValue({ currency: this.currencies[0], currencyId: this.currencies[0]._id });
                    this.listLoanOffers();
                },
                error: (error: any) => {
                    this.loanOfferProcessing = false;
                    this.handleError(error);
                }
            })
        } catch (error) {
            console.log('offer error', error)
            this.loanOfferProcessing = false;
            this.handleError(error);
        }
    }

    async approveCurrency() {
        let txResp: any;
        let tx: any;
        try {
            let { currency: currency, requested_loan_amount, loan_duration_days, loan_percentage } = this.loanOfferForm.value;

            // create approve currency process in db
            let txData: any = {
                from: this.account.walletAddress,
                to: currency.address,
                from_id: this.user._id,
                transaction_name: 'Approve currency',
                nft_id: this.nft._id,
                status: 0,
                amount: requested_loan_amount,
                currency_symbol: currency?.symbol
            }
            txResp = await this.transactionService.createTransaction(txData);
            let transactionData = {
                status: true,
                count: 0
            }
    
            this.commonService.transactionEmitter(transactionData);
    
            // Approve currency contract fn
            let decimal = await this.erc20ContractService.getDecimal(this.account?.networkId, currency.address);
            let amount = this.contractUtils.decimalMultipler(Number(decimal), Number(requested_loan_amount))
            let args = { functionName: 'increaseAllowance', args: [(environment as any)[this.account.chainId].BORROW_LEND_CONTRACT, amount], abiType: 'erc20' }
            const { approveAbi, requiredGas } = await this.erc20ContractService
                .approve(
                    this.account,
                    currency.address,
                    args
                );
            tx = await this.commonService.sendTransaction(this.account, currency.address, approveAbi, requiredGas, args);
            this.progressData.steps[this.progressData.currentStep].status = 2;
            this.progressData.steps[this.progressData.currentStep + 1].status = 1;
            this.progressData.currentStep = 1;
    
            // update approve currency process in db
            if (this.regulated) tx = JSON.parse(tx.data);
            txData = {
                status: 1,
                transaction_hash: tx.transactionHash
            }
            await this.transactionService.createTransaction(txData, txResp.data._id);
            transactionData = {
                status: true,
                count: 1
            }
            this.commonService.transactionEmitter(transactionData);
            return;

        } catch (error) {
            this.handleError(error, txResp.data._id);
            return;
        }
    }

    listLoanOffers() {
        this.loanService.getLoanOffers(this.nft._id).subscribe({
            next: (response: any) => {
                this.loanOffers = Object.keys(response?.data).length > 0 ? response?.data?.items : [];
                this.loanOffers.map((offer) => {
                    let { amount, duration_in_days, interest_rate } = offer;
                    let { total_amount } = this.commonService.calculateInterest(amount, duration_in_days, interest_rate, this.account?.chainId);
                    offer.total_amount = total_amount.toFixed(3);
                })
                this.userOffer = this.loanOffers.find(item => item.lender._id === this.user._id && item.status != 2);
                if (this.userOffer) {
                    this.loanOfferForm.patchValue({
                        requested_loan_amount: this.userOffer?.amount,
                        currency: this.userOffer?.currency,
                        currencyId: this.userOffer?.currency._id,
                        loan_percentage: this.userOffer?.interest_rate,
                        loan_duration_days: this.userOffer?.duration_in_days,
                        collateral_assets: [this.userOffer?.nft]
                    });
                    this.calculateInterest();
                }
            },
            error: (error: any) => {
                this.bidProcessing = false;
                this.handleError(error);
            }
        })
    }

    async organizeLoanOffer(offer: any) {
        let nfts: any[] = [];
        nfts.push({ collectionAddress: this.nft?.collections.collection_address, tokenId: this.nft?.token_id });

        let { loan_duration_days, loan_percentage, requested_loan_amount, currency } = offer;
        let order = await this.borrowLendContractService.loanOfferParams(
            await getAddress(this.nft?.owner?.wallet_address),
            await getAddress(this.account.walletAddress),
            nfts,
            moment().unix(),
            loan_duration_days,
            currency?.address,
            requested_loan_amount,
            loan_percentage,
            this.account?.networkId
        );
        return order;
    }

    async organizeLoanRequest(offer: any) {
        let nfts: any[] = [];
        nfts.push({ collectionAddress: this.nft?.collections.collection_address, tokenId: this.nft?.token_id });

        let { duration_in_days, interest_rate, amount, loan_request_id, loan_request_nonce, currency, lender, start_time } = offer;
        let order = await this.borrowLendContractService.lendNFTParams(
            await getAddress(this.nft?.owner?.wallet_address),
            await getAddress(lender?.wallet_address),
            nfts,
            loan_request_id,
            start_time,
            duration_in_days,
            currency.address,
            amount,
            interest_rate,
            loan_request_nonce,
            this.account?.networkId
        );
        return order;
    }


    async createLoanOfferSignature() {
        const lendRequest = await this.organizeLoanOffer(this.loanOfferForm.value);

        const domain = {
            name: 'Loan',
            version: '1',
            chainId: (environment as any)[this.account.chainId].CHAINID,
            verifyingContract: (environment as any)[this.account.chainId].BORROW_LEND_CONTRACT
        }

        // The named list of all type definitions
        const types = {
            NFT: [
                { name: 'collectionAddress', type: 'address' },
                { name: 'tokenId', type: 'uint256' }
            ],
            Loan: [
                { name: 'lender', type: 'address' },
                { name: 'nfts', type: 'NFT[]' },
                { name: 'startTime', type: 'uint256' },
                { name: 'duration', type: 'uint256' },
                { name: 'loanPaymentContract', type: 'address' },
                { name: 'loanAmount', type: 'uint256' },
                { name: 'loanPercentage', type: 'uint256' }
            ],
        }
        let signature;
        if (this.regulated) {
            let response: any = await this.borrowLendService.getLoanOfferSignature({ lendRequest, signerAddress: this.account.walletAddress, contract: (environment as any)[this.account.chainId].BORROW_LEND_CONTRACT });
            signature = response?.data;
        }
        if (!this.regulated) {
            signature = await signTypedData({
                domain,
                message: lendRequest,
                primaryType: 'Loan',
                types,
            });
        }

        return { signature, lendRequest };
    }

    async acceptloanOffer(offer: any) {
        if (this.regulated) {
            const kycStatus: any = await this.accountService.getKycStatus(this.account?.walletAddress);
            if (kycStatus?.data?.admin_kyc_enable && kycStatus?.data?.kyc_enable && kycStatus?.data?.kyc_verified !== 1) {
                this.toastr.warning("Identity confirmation needed. Please wait while you are redirected to our identification platform.");
                this.setRoute();
                return this.router.navigate(['kyc'])
            }
        }
        this.user = this.webStorageService.getLocalStorage('user') != null ? JSON.parse(this.webStorageService.getLocalStorage('user') || 'undefined') : this.user;
        if (!this.regulated) {
            if (!this.user) {
                this.setRoute();
                this.toastr.warning("Register to continue.")
                return this.router.navigate(['sign-up'])
            } else if (!this.user.email_verified || !this.user?.is_valid) {
                this.verificationModal?.show();
                return
            }
        }

        let isBlocked = await this.accessControlContractService.isBlocked(this.account);
        if (isBlocked) return this.toastr.error("User blocked. Please contact the admin regarding your status.");

        this.loanOffer = offer;
        if (this.regulated) {
            this.confirmationData = {
                image: [this.processImage()],
                content: `Are you sure you want to accept lender's offer for <b>${offer.amount} ${offer.currency?.symbol}</b> for ${this.nft.name}?`
            }
            this.confirmationModal?.show();
        } else {
            this.confirmAcceptLoanOffer();
        }
    }

    async confirmAcceptLoanOffer() {
        this.confirmationModal?.hide();
        this.progressData = {
            title: "Processing.",
            currentStep: 0,
            steps: [
                {
                    title: "Approve item.",
                    status: 1
                },
                {
                    title: "Accept loan offer.",
                    status: 0
                },
                {
                    title: "Update loan request.",
                    status: 0
                },
            ],
            failed: false,
            successTitle: "Loan offer accepted.",
            successMessage: `<ul><li class="mb-2" ><b>Loan:</b> ${this.loanOffer.amount} ${this.loanOffer.currency?.symbol} have been transferred to your wallet.</li><li class="mb-2"><b>Collateral:</b> Your item(s) are locked until repayment.</li><li class="mb-2"><b>Payment:</b> You will need to pay back ${this.loanOffer.amount + 0} ${this.loanOffer.currency?.symbol} within ${this.loanOffer.duration_in_days} day(s) to unlock your item(s).</li><li><b>Foreclosure:</b> If not, your item(s) will be transferred to the lender.</li></ul>`,
            image: [this.processImage()]
        }
        this.progressModal?.show();
        let txResp: any;
        let tx: any;

        try {
            let { amount, currency, duration_in_days, interest_rate, lender, signature, _id } = this.loanOffer;
            // Validate lender balance
            let balance = await this.erc20ContractService.getBalance(this.account?.networkId, currency?.address, lender.wallet_address);
            if (Number(balance) < Number(amount)) {
                this.progressData.steps[this.progressData.currentStep].status = 3;
                this.progressData.failed = true;
                return this.toastr.error("Insufficient balance in lender wallet.");
            }

            // Step 1 - Approve token
            await this.approveItem(txResp);

            // Create and accept loan request
            // get nonce
            const nonce: any = await this.commonService.getNonce();
            this.loanOffer.loan_request_nonce = nonce.data.nonce;

            let { interest_amount, total_amount } = await this.commonService.calculateInterest(amount, duration_in_days, interest_rate, this.account?.chainId)
            const params = {
                borrower_id: this.user?._id,
                requested_loan_amount: amount,
                loan_percentage: interest_rate,
                loan_duration_days: duration_in_days,
                interest_amount,
                total_amount,
                borrow_lend_contract: (environment as any)[this.account.chainId].BORROW_LEND_CONTRACT,
                collateral_assets: [this.nft._id],
                currency_data: currency._id,
                nonce: nonce.data.nonce,
                loan_offer_id: _id,
                is_loan_offer_request: true
            }

            this.loanService.requestLoan(params).subscribe({
                next: async (loanResponse: any) => {
                    this.loanOffer.loan_request_id = loanResponse.data?._id

                    // Step 1 - Accept loan offer
                    // accept loan tx in db
                    let txData: any = {
                        from: this.account.walletAddress,
                        to: (environment as any)[this.account?.chainId].BORROW_LEND_CONTRACT,
                        from_id: this.user._id,
                        transaction_name: 'Accept loan offer',
                        nft_id: this.nft._id,
                        status: 0,
                        amount: 0,
                        currency_symbol: "-"
                    }
                    txResp = await this.transactionService.createTransaction(txData);
                    let transactionData = {
                        status: true,
                        count: 0
                    }

                    this.commonService.transactionEmitter(transactionData);

                    let args = { functionName: 'acceptLoanOffer', args: [await this.organizeLoanRequest(this.loanOffer), signature], abiType: 'loan' }
                    const { acceptLoanOfferAbi, requiredGas } = await this.borrowLendContractService.acceptLoanOfferABI(
                        this.account,
                        args
                    );
                    tx = await this.commonService.sendTransaction(this.account, (environment as any)[this.account.chainId].BORROW_LEND_CONTRACT, acceptLoanOfferAbi, requiredGas, args);

                    // update accept loan offer operation in db
                    if (this.regulated) tx = JSON.parse(tx.data);
                    txData = {
                        status: 1,
                        transaction_hash: tx.transactionHash
                    }
                    await this.transactionService.createTransaction(txData, txResp.data._id);
                    transactionData = {
                        status: true,
                        count: 1
                    }

                    this.commonService.transactionEmitter(transactionData);

                    this.progressData.steps[this.progressData.currentStep].status = 2;
                    this.progressData.steps[this.progressData.currentStep + 1].status = 1;
                    this.progressData.currentStep = 2;

                    // Step 2 - Update loan request in db
                    this.acceptLoanOfferApi();
                },
                error: (error) => {
                    this.handleError(error);
                }
            })

        } catch (error) {
            console.log(error)
            this.handleError(error, txResp?.data?._id);
        }
    }

    /**
     * Approves item
     * @param txResp 
     * @returns  
     */
    async approveItem(txResp: any) {
        let tx: any;
        try {
            // Approve nft operation in db
            let txData: any = {
                from: this.account.walletAddress,
                to: this.nft.collections.collection_address,
                from_id: this.user._id,
                transaction_name: 'Approve item',
                nft_id: this.nft._id,
                status: 0,
                amount: 0,
                currency_symbol: "-"
            }
            txResp = await this.transactionService.createTransaction(txData);
            let transactionData = {
                status: true,
                count: 0
            }

            this.commonService.transactionEmitter(transactionData);

            // approve nft contract interaction
            let args = { functionName: 'setApprovalForAll', args: [(environment as any)[this.account.chainId].BORROW_LEND_CONTRACT, true], abiType: 'erc721' }
            let { approvalAbi, requiredGas } = await this.borrowLendContractService.setApprovalForAllNFTsAbi(this.account, this.nft.collections.collection_address, args);
            tx = await this.commonService.sendTransaction(this.account, this.nft.collections.collection_address, approvalAbi, requiredGas, args);

            // update approve all nfts operation in db
            if (this.regulated) tx = JSON.parse(tx.data);
            txData = {
                status: 1,
                transaction_hash: tx.transactionHash
            }
            await this.transactionService.createTransaction(txData, txResp.data._id);
            transactionData = {
                status: true,
                count: 1
            }

            this.commonService.transactionEmitter(transactionData);

            this.progressData.steps[this.progressData.currentStep].status = 2;
            this.progressData.steps[this.progressData.currentStep + 1].status = 1;
            this.progressData.currentStep = 1;

            return;
        } catch (error) {
            console.log(error)
            this.handleError(error, txResp?.data?._id);
        }
    }

    acceptLoanOfferApi() {
        let params: any = {
            "status": 3
        }
        this.loanService.updateLoanOffer(this.loanOffer._id, params).subscribe({
            next: async () => {
                this.progressData.steps[this.progressData.currentStep].status = 2;
                this.progressData.currentStep = 3;
                this.getNft();
            },
            error: (error: any) => {
                this.loanOfferProcessing = false;
                this.handleError(error);
            }
        })

    }

    /**
     * Cancels offer
     * @returns  
     */
    async cancelOffer() {
        if (this.regulated) {
            const kycStatus: any = await this.accountService.getKycStatus(this.account?.walletAddress);
            if (kycStatus?.data?.admin_kyc_enable && kycStatus?.data?.kyc_enable && kycStatus?.data?.kyc_verified !== 1) {
                this.toastr.warning("Identity confirmation needed. Please wait while you are redirected to our identification platform.");
                this.setRoute();
                return this.router.navigate(['kyc'])
            }
        }
        this.user = this.webStorageService.getLocalStorage('user') != null ? JSON.parse(this.webStorageService.getLocalStorage('user') || 'undefined') : this.user;
        if (!this.regulated) {
            if (!this.user) {
                this.setRoute();
                this.toastr.warning("Register to continue.")
                return this.router.navigate(['sign-up'])
            } else if (!this.user.email_verified || !this.user?.is_valid) {
                this.verificationModal?.show();
                return
            }
        }
        try {
            let isBlocked = await this.accessControlContractService.isBlocked(this.account);
            if (isBlocked) return this.toastr.error("User blocked. Please contact the admin regarding your status.");

            this.cancelLoanOfferProcessing = true;
            this.progressData = {
                title: "Processing.",
                currentStep: 0,
                steps: [
                    {
                        title: "Cancel loan offer.",
                        status: 1
                    }
                ],
                failed: false,
                successTitle: "Loan offer cancelled.",
                image: [this.processImage()]
            }
            this.progressModal?.show();

            let cancelLoanOffertxData: any = {
                from: this.account?.walletAddress,
                to: (environment as any)[this.account.chainId].BORROW_LEND_CONTRACT,
                from_id: this.user._id,
                transaction_name: 'Cancel Loan Offer',
                nft_id: this.nft._id,
                status: 1,
                amount: 0,
                currency_symbol: '-'
            }
            let txResp: any;

            // Step 1 - cancel bid
            let params: any = {
                "status": 2
            }
            this.loanService.updateLoanOffer(this.userOffer._id, params).subscribe({
                next: async (response: any) => {
                    txResp = await this.transactionService.createTransaction(cancelLoanOffertxData);
                    let transactionData = {
                        status: true,
                        count: 1
                    }
                    this.commonService.transactionEmitter(transactionData);
                    this.progressData.steps[this.progressData.currentStep].status = 2;
                    this.progressData.currentStep = 1;
                    this.loanOfferForm.reset();
                    this.loanOfferForm.patchValue({ currency: this.currencies[0], currencyId: this.currencies[0]._id });
                    this.cancelLoanOfferProcessing = false;
                    this.listLoanOffers();
                },
                error: (error: any) => {
                    this.cancelLoanOfferProcessing = false;
                    this.handleError(error, txResp.data._id);
                }
            })

        } catch (error: any) {
            this.cancelLoanOfferProcessing = false;
            this.handleError(error);
        }
    }

    /**
     * Retrieves shipping information based on the provided attributes.
     *
     * @protected
     * @param {Array<{ key: string; value: string }>} attribute - An array of objects containing key-value pairs.
     * @returns {string} - The shipping information based on the provided attributes.
     */
    protected getShippingInfo(attribute: { key: string; value: string }[]): string {
        const nftLocation:string = (attribute.find((item:{key:string,value:string})=> item.key === 'Location')?.value) ?? ''
        const nftCategory:string = (attribute.find((item:{key:string,value:string})=> item.key === 'Category')?.value) ?? ''
        if (!nftLocation) return 'Shipment subject to confirmation. Local pickup available';
        switch (nftCategory) {
          case 'Gems':
            return 'Shipment subject to confirmation. Local pickup available';
          case 'Gold':
            if (nftLocation === 'Freeport - Dubai') {
                return 'UAE in-person pickup';
            } else {
                return 'On-demand collection from Dubai custodian. International shipment available upon request';
            }
          case 'Wine':
            if (nftLocation === 'UK') {
                return 'Insured UK shipping for UK items';
            } else if(nftLocation === 'EU'){
                return 'Insured EU shipping for France items';
            } else {
                return 'Shipment subject to confirmation. Local pickup available';
            }
          default:
            return 'Shipment subject to confirmation. Local pickup available';
        }
      }

  /**
   * Retrieves the unit type of the NFT.
   *
   * @returns {string} The `unit_type` of the NFT. 
   */
  get nftUnitType(): string {
    return this.nft?.unit_type || this.nft?.collections?.unit_type || '';
  }

  /**
   * Submits a request to check the quantity of the NFT and proceeds to buy if available.
   */
  submitCheckQtyAndBuy(): void {
    let api;
    if (this.nftCollection && this.nftTokenId) api = this.nftService.getNft(this.nftCollection, this.nftTokenId);
    else api = this.nftService.getNftById(this.nftId);

    api?.subscribe({
      next: (response: any) => {
        this.nft = response.data;
        this.nftQuantity = this.nft?.attributes?.find((data: any) => data?.key?.toLowerCase() == 'quantity');
        const isAvailable = Number(this.nftQuantity.value) > 0;
        if (isAvailable) {
          this.buyNftOrder();
        } else {
          this.toastr.error(response?.['message']);
        }
      },
      error: (error: any) => {
        if (error?.error?.status_code === 404) this.router.navigate(['/**']);
        else this.handleError(error);
      },
    });
  }
}

interface IPriceHistory{
    updatedAt:string,
    price:number
}

enum nftActions {
    SELL = 'sell',
    BORROW = 'borrow',
    LOAN = 'loan'
}