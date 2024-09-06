import { Location } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';

import { ActivatedRoute, Router } from '@angular/router';
import { signTypedData } from '@wagmi/core';
import moment from 'moment';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { ClipboardService } from 'ngx-clipboard';
import { OwlOptions } from 'ngx-owl-carousel-o';
import { ToastrService } from 'ngx-toastr';
import { AccessControlContractService } from 'src/app/shared/services/access-control-contract.service';
import { AccountService } from 'src/app/shared/services/account.service';
import { BorrowLendService } from 'src/app/shared/services/borrow-lend.service';
import { CommonService } from 'src/app/shared/services/common.service';
import { Erc20ContractService } from 'src/app/shared/services/erc20-contract.service';
import { LendBorrowContractService } from 'src/app/shared/services/lend-borrow-contract.service';
import { LoanService } from 'src/app/shared/services/loan.service';
import { TransactionService } from 'src/app/shared/services/transaction.service';
import { WebStorageService } from 'src/app/shared/services/web-storage.service';
import { ContractUtils } from 'src/app/shared/utils/contract-utils';
import { environment } from 'src/environments/environment';
import { getAddress } from 'viem';
@Component({
    selector: 'app-loan-detail',
    templateUrl: './loan-detail.component.html',
    styleUrls: ['./loan-detail.component.css']
})
export class LoanDetailComponent implements OnInit, OnDestroy {
    @ViewChild('progressModal', { static: false }) progressModal?: ModalDirective;
    @ViewChild('confirmationModal', { static: false }) confirmationModal?: ModalDirective;
    @ViewChild('verificationModal', { static: false }) verificationModal?: ModalDirective;

    private intervalId!: NodeJS.Timeout;
    
    loanRequest: any;
    repayLoan: any;
    selectedNft: any;
    account: any;
    user: any;
    currencies: any[] = [];
    activeCurrencies: any[] = [];
    loanRequestDays: any[] = [];
    loanRequestForm: FormGroup = this.fb.group({
        requested_loan_amount: ['', Validators.required],
        currency_data: ['', Validators.required],
        currency_id: ['', Validators.required],
        loan_percentage: ['', Validators.required],
        loan_duration_days: ['', Validators.required],
        interest_amount: ['', Validators.required],
        total_amount: ['', Validators.required],
        collateral_assets: ['', Validators.required],
        appraisalValue: ['']
    })
    loanRequestSubmitted: boolean = false;
    loanRequestProcessing: boolean = false;
    loanRequestFormDisabled: boolean = false;
    progressData: any = {};
    confirmationData: any = {};
    nftId!: string;
    counterOffered: boolean = false;
    public selectedImage!: string;
    public isActive: boolean = false;
    showCounterOffer: boolean = false;
    recounterBid: any;
    regulated: boolean = false;
    loader: boolean = true;
    showoverlay: boolean = false;
    loading: boolean = true;
    bid: any;
    imageLoading: boolean = true;
    currencyConversions: any[] = [];
    routeSubscription: any;
    isModalVisible: boolean = false;
    currentImage: string = '';
    processedImages: any = [];
    timeRemaining: string = '';
    isOnLoanTerms:boolean = true; // Flag to determine if the current active tab is loan terms.
    constructor(
        private route: ActivatedRoute,
        private loanService: LoanService,
        private toastr: ToastrService,
        private webStorageService: WebStorageService,
        private fb: FormBuilder,
        private commonService: CommonService,
        private erc20ContractService: Erc20ContractService,
        private contractUtils: ContractUtils,
        private borrowLendContractService: LendBorrowContractService,
        private borrowLendService: BorrowLendService,
        private accountService: AccountService,
        private router: Router,
        public location: Location,
        private accessControlContractService: AccessControlContractService,
        private clipboardService: ClipboardService,
        private titleService: Title,
        private transactionService: TransactionService
    ) { }

    ngOnInit(): void {
        this.account = this.webStorageService.getLocalStorage('account') != null ? JSON.parse(this.webStorageService.getLocalStorage('account') || '') : this.account;
        this.user = this.webStorageService.getLocalStorage('user') != null ? JSON.parse(this.webStorageService.getLocalStorage('user') || 'undefined') : this.user;
        this.regulated = JSON.parse(this.webStorageService.getLocalStorage('regulated') || 'true');

        if (this.router.url.includes('lending-detail')) this.commonService.setTabEmitter({ type: 'lend' });
        else this.commonService.setTabEmitter({ type: 'borrow' })

        this.routeSubscription = this.route.params.subscribe(params => {
            this.nftId = params['id'];
            this.getLoanRequest();
            this.getCurrencies();
        });

        this.commonService.showmodaloverlayObservable.subscribe((response: boolean) => this.showoverlay = response)
        this.commonService.closeModalsObservable.subscribe((response: boolean) => {
            if (response) {
                this.progressModal?.hide();
                this.confirmationModal?.hide();
            }
        })
    }

    ngOnDestroy() {
        this.titleService.setTitle('RealWorld.fi - Marketplace');
        this.routeSubscription.unsubscribe();
        clearInterval(this.intervalId);
    }

    getLoanRequest(counterOffer: boolean = false) {
        this.loanService.getLoanRequest(this.nftId).subscribe({
            next: (response: any) => {
                this.loanRequest = response.data;
                for (const asset of this.loanRequest.collateral_assets) {
                    asset.fileType = asset.preview_image ? asset?.preview_image.split('.')[asset?.preview_image.split('.').length - 1] : asset?.primary_media.split('.')[asset?.primary_media.split('.').length - 1]
                }
                this.processImages();
                this.titleService.setTitle(`${this.router.url.includes('lending-detail') ? 'Lending' : 'Borrowing'} - ${this.loanRequest.collateral_assets[0].name}`);
                if (this.loanRequest?.status === 4) this.loanRequestFormDisabled = true;
                if (this.loanRequest?.status === 0 && this.loanRequest.bids.length > 0) this.loanRequestFormDisabled = true;
                if (this.account?.chainId) this.loanRequest.end_date = moment(this.loanRequest.start_date).clone().add(this.loanRequest.loan_duration_days, (environment as any)[this.account.chainId].LOAN_IN_DAYS ? 'days' : 'hours').toISOString()
                this.timeRemaining = this.commonService.getTimeRemaining(this.loanRequest.end_date);
                this.startDueDateCountdown();
                this.changeAsset(this.loanRequest.collateral_assets[0]);

                if (this.loanRequest.bids.length > 0) this.loanRequest.acceptedBid = this.loanRequest.bids.find((item: any) => item.status === 3);
                else {
                    let { requested_loan_amount, interest_amount, loan_duration_days, loan_percentage, createdAt } = this.loanRequest;
                    this.loanRequest.acceptedBid = {
                        proposed_bid_amount: requested_loan_amount,
                        proposed_interest_amount: interest_amount,
                        proposed_loan_percentage: loan_percentage,
                        proposed_loan_duration: loan_duration_days,
                        created_at: createdAt
                    }
                }
                this.loanRequest.offerClosed = this.loanRequest.acceptedBid ? Object.keys(this.loanRequest.acceptedBid).length > 0 : false;
                this.loanRequest.bids = this.loanRequest.bids.filter((item: any) => item.status !== 3);
                if (this.user?._id) {
                    if (this.loanRequest?.status === 0 && this.loanRequest.borrower_id._id !== this.user?._id) this.loanRequestFormDisabled = true;
                    this.loanRequest.open_offer = [];
                    // Create the initial loan request object
                    const initialLoanRequest = {
                        _id: this.loanRequest._id,
                        from: {
                            _id: this.loanRequest.borrower_id._id,
                            wallet_address: this.loanRequest.borrower_id.wallet_address
                        },
                        to: {
                            _id: '', // This would be empty for the initial request
                            wallet_address: '' // This would be empty for the initial request
                        },
                        proposed_bid_amount: this.loanRequest.requested_loan_amount,
                        proposed_loan_duration: this.loanRequest.loan_duration_days,
                        proposed_loan_percentage: this.loanRequest.loan_percentage,
                        proposed_interest_amount: this.loanRequest.interest_amount.toFixed(3),
                        // actions: this.loanRequest?.grouped_bids?.length > 0 && this.loanRequest.borrower_id._id !== this.user?._id ? true : false,
                        actions: false,// No actions available for the initial request
                        status: this.loanRequest.status
                    };

                    // Add the initial loan request to the beginning of the open_offer array
                    this.loanRequest.open_offer.push(initialLoanRequest);
                    if (this.loanRequest.borrower_id._id === this.user?._id) {
                        this.loanRequest?.grouped_bids?.map((bid: any[]) => {
                            bid[bid.length - 1].actions = (bid[bid.length - 1].to._id === this.user?._id) ? true : false;
                            if (bid[bid.length - 1].status !== 3) this.loanRequest.open_offer.push(...bid)
                        })
                    } else {
                        this.loanRequest?.grouped_bids?.map((bid: any[]) => {
                            if (bid[0].from._id === this.user?._id || bid[0].from._id === this.user?._id) {
                                bid[bid.length - 1].actions = bid[bid.length - 1].to._id === this.user?._id;
                                if (bid[bid.length - 1].status !== 3) this.loanRequest.open_offer.push(...bid)
                                console.log(this.loanRequest.open_offer);

                            } else {
                                bid[bid.length - 1].actions = false
                                if (bid[bid.length - 1].status !== 3) this.loanRequest.open_offer.push(bid[bid.length - 1])
                            }
                        })
                    }
                    this.setLoanRequestForm(counterOffer);
                }
                this.getLoanRequestDays();
                this.loader = false;
            },
            error: (error) => {
                if (error?.error?.status_code === 404 || error?.error?.status_code === 400) this.router.navigate(['/**'])
                else this.handleError(error);
            }
        })
    }

    async setLoanRequestForm(isCounterOffer: boolean = false) {
        if (this.loanRequest?.status > 0 && this.loanRequest?.status != 4) {
            let appraisalValue = 0;
            for (const [index, asset] of this.loanRequest.collateral_assets.entries()) {
                let appraisal = asset.attributes.find((attribute: any) => attribute.key.toLowerCase() === 'appraisal value');
                appraisalValue += await this.setExchangePrice(asset, appraisal.value);
                if (index === this.loanRequest.collateral_assets.length - 1) this.loanRequestForm.patchValue({ appraisalValue: appraisalValue > 0 ? `${Math.ceil(appraisalValue)} USD` : '' })
                let splitUrl = asset.primary_media.split('.');
                asset.fileType = splitUrl[splitUrl.length - 1];
            };
            let timestampDiff = moment().diff(moment(this.loanRequest.acceptedBid.created_at), (environment as any)[this.account.chainId].LOAN_IN_DAYS ? 'days' : 'hours');
            let divisor = (environment as any)[this.account.chainId].LOAN_IN_DAYS ? (365 * 100) : (365 * 24 * 100)
            let interest_amount_accrued = timestampDiff >= 0 ? (this.loanRequest.acceptedBid.proposed_bid_amount * timestampDiff * this.loanRequest.acceptedBid.proposed_loan_percentage) / divisor : this.loanRequest.acceptedBid.proposed_interest_amount;
            this.repayLoan = {
                appraisalValue: `${Math.ceil(appraisalValue)} USD`,
                requested_loan_amount: this.loanRequest.acceptedBid.proposed_bid_amount,
                loan_percentage: this.loanRequest.acceptedBid.proposed_loan_percentage,
                loan_duration_days: this.loanRequest.acceptedBid.proposed_loan_duration,
                interest_amount: this.loanRequest.acceptedBid.proposed_interest_amount,
                total_amount: Number(this.loanRequest.acceptedBid.proposed_bid_amount) + Number(this.loanRequest.acceptedBid.proposed_interest_amount),
                interest_amount_accrued
            }
        } else {
            this.loanRequestForm.patchValue(this.loanRequest);
            this.loanRequestForm.patchValue({ currency_id: this.loanRequest.currency_data._id });
            let appraisalValue = 0;
            for (const [index, asset] of this.loanRequest.collateral_assets.entries()) {
                let appraisal = asset.attributes.find((attribute: any) => attribute.key.toLowerCase() === 'appraisal value');
                appraisalValue += await this.setExchangePrice(asset, appraisal.value);
                if (index === this.loanRequest.collateral_assets.length - 1) this.loanRequestForm.patchValue({ appraisalValue: appraisalValue > 0 ? `${Math.ceil(appraisalValue)} USD` : '' })
                let splitUrl = asset.primary_media.split('.');
                asset.fileType = splitUrl[splitUrl.length - 1];
            };
            if (this.loanRequest.bids.length > 0) {
                let bidIndex = this.loanRequest.bids.findIndex((item: any) => item.from._id === this.user?._id);
                if (bidIndex >= 0) {
                    this.counterOffered = true;
                    this.loanRequestFormDisabled = true;
                    if (isCounterOffer) {
                        this.loanRequestForm.patchValue({
                            requested_loan_amount: this.loanRequest.bids[bidIndex].proposed_bid_amount,
                            loan_percentage: this.loanRequest.bids[bidIndex].proposed_loan_percentage,
                            loan_duration_days: this.loanRequest.bids[bidIndex].proposed_loan_duration,
                            interest_amount: this.loanRequest.bids[bidIndex].proposed_interest_amount,
                            total_amount: Number(this.loanRequest.bids[bidIndex].proposed_bid_amount) + Number(this.loanRequest.bids[bidIndex].proposed_interest_amount)
                        });
                    }
                }
            }
        }
        if (isCounterOffer) {
            this.activeCurrencies = this.currencies.filter((currency: any) => !currency.is_deleted);
            if ((this.activeCurrencies.filter((currency) => currency._id === this.loanRequest.currency_data._id)).length === 0) {
                this.loanRequestForm.patchValue({ currency_data: this.activeCurrencies[0] });
            }
        } else {
            this.loanRequestForm.patchValue({ currency_data: this.loanRequest.currency_data });
            if ((this.activeCurrencies.filter((currency) => currency?._id === this.loanRequest?.currency_data?._id))?.length === 0) {
                this.activeCurrencies.push(this.loanRequest.currency_data)
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
                usdPrice = response[nft.currency?.address?.toLowerCase()]?.usd || 1;
            } catch (error) {
                if (Object.keys(storedUsdPrice).length > 0 && storedUsdPrice[nft.currency?.address?.toLowerCase()] > 0) {
                    usdPrice = storedUsdPrice[nft.currency?.address?.toLowerCase()];
                } else {
                    let currency = this.currencies.find((currency) => currency?.address?.toLowerCase() === nft.currency?.address?.toLowerCase());
                    usdPrice = currency.usd_value || 1
                }
            }
            storedUsdPrice[nft.currency?.address?.toLowerCase()] = usdPrice || 1
            this.webStorageService.setLocalStorage('usdPrice', JSON.stringify(storedUsdPrice));
            this.currencyConversions.push({ address: nft.currency?.address, value: usdPrice });
            value = Math.ceil(item * usdPrice);
        }
        return value;
    }

    getCurrencies() {
        this.commonService.getCurrencies().subscribe({
            next: async (response: any) => {
                this.currencies = response.data;
                this.activeCurrencies = response.data.filter((currency: any) => !currency.is_deleted);
                if ((this.activeCurrencies.filter((currency) => currency._id === this.loanRequest?.currency_data?._id))?.length === 0) {
                    this.activeCurrencies.push(this.loanRequest?.currency_data)
                }
            },
            error: (error) => {
                this.handleError(error);
            }
        })
    }

    setCurrency(event: any) {
        let currency = this.currencies.find((item: any) => item._id === event.target.value);
        this.loanRequestForm.patchValue({ currency_data: currency })
    }

    /**
     * Gets loan request days
     */
    getLoanRequestDays() {
        this.loanService.getLoanRequestDays().subscribe({
            next: (response: any) => {
            this.loanRequestDays = response.data;
                 // Check if the value exists in loanRequestDays
            const exists = this.loanRequestDays.some(day => day.days == this.loanRequest.loan_duration_days);
    
            // If the value doesn't exist, add it temporarily to the options
            if (!exists) {
              this.loanRequestDays = [...this.loanRequestDays, { days: this.loanRequest.loan_duration_days }];
            }
            this.loanRequestForm.patchValue({ loan_duration_days: this.loanRequest.loan_duration_days });
        },
        error: (error) => {
            this.handleError(error);
        }
      })
    }
    

    calculateInterest() {
        let { requested_loan_amount, loan_duration_days, loan_percentage } = this.loanRequestForm.value;
        let divisor = (environment as any)[this.account.chainId].LOAN_IN_DAYS ? (365 * 100) : (365 * 24 * 100)
        let interest_amount = (requested_loan_amount * loan_duration_days * loan_percentage) / divisor;
        let total_amount = Number(requested_loan_amount) + Number(interest_amount);
        this.loanRequestForm.patchValue({ interest_amount: interest_amount.toFixed(3), total_amount: total_amount.toFixed(3) })
    }

    async editLoanRequest() {
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
        this.loanRequestSubmitted = true;
        this.loanRequestProcessing = true;
        if (this.loanRequestForm.valid) {
            let isBlocked = await this.accessControlContractService.isBlocked(this.account);
            if (isBlocked) return this.toastr.error("User blocked. Please contact the admin regarding your status.");

            this.progressData = {
                title: "Processing.",
                currentStep: 0,
                steps: [
                    {
                        title: "Edit loan request.",
                        status: 1
                    },
                    {
                        title: "Update status.",
                        status: 0
                    }
                ],
                failed: false,
                successTitle: "Loan edited.",
                image: this.processImages()
            }

            this.progressModal?.show();

            let txResp: any;
            let tx: any;
            try {
                // Step 0 - Validate loan status
                let status = await this.borrowLendService.getLoanStatus(this.loanRequest._id);

                if (status) {
                    this.progressData.steps[this.progressData.currentStep].status = 3;
                    this.progressData.failed = true;
                    return this.toastr.error('The loan is already live. Please refresh the page to get the current loan details.');
                }

                let nfts: any[] = [], nftIds: any[] = [];
                this.loanRequest?.collateral_assets.map((nft: any) => {
                    nfts.push({ collectionAddress: nft.collections.collection_address, tokenId: nft.token_id })
                    nftIds.push(nft._id)
                })

                let txData: any = {
                    from: this.account.walletAddress,
                    to: (environment as any)[this.account?.chainId].BORROW_LEND_CONTRACT,
                    from_id: this.user._id,
                    transaction_name: 'Edit loan request',
                    nft_id: nftIds,
                    status: 0,
                    amount: 0,
                    currency_symbol: "-"
                }
                txResp = await this.transactionService.createTransaction(txData);
                let transacationData = {
                    status: true,
                    count: 0
                }
                this.commonService.transactionEmitter(transacationData);

                let loanParams = await this.organizeLoan(nfts);
                let args = { functionName: 'editLoan', args: [loanParams], abiType: 'loan' }
                let { editLoanRequestAbi, requiredGas } = await this.borrowLendContractService.editLoanRequest(this.account, args);
                tx = await this.commonService.sendTransaction(this.account, (environment as any)[this.account?.chainId].BORROW_LEND_CONTRACT, editLoanRequestAbi, requiredGas, args);

                // update edit loan operation in db
                if (this.regulated) tx = JSON.parse(tx.data);
                txData = {
                    status: 1,
                    transaction_hash: tx.transactionHash
                }

                this.progressData.steps[this.progressData.currentStep].status = 2;
                this.progressData.steps[this.progressData.currentStep + 1].status = 1;
                this.progressData.currentStep = 1;

                // step 1 - edit loan api
                this.editLoanRequestApi();
            } catch (error) {
                this.handleError(error, txResp?.data?._id);
            }

        } else {
            this.loanRequestProcessing = false;
            this.toastr.error('Please fill all the required fields.');
        }
    }

    async organizeLoan(nfts: any[]) {
        let { loan_duration_days, loan_percentage, requested_loan_amount, currency_data } = this.loanRequestForm.value;
        let loanParams = await this.borrowLendContractService.loanParams(
            await getAddress(this.account.walletAddress),
            nfts,
            loan_duration_days,
            currency_data.address,
            requested_loan_amount,
            loan_percentage,
            this.loanRequest.nonce,
            this.account?.networkId
        );
        return loanParams;
    }

    editLoanRequestApi() {
        let { loan_duration_days, loan_percentage, requested_loan_amount, interest_amount, total_amount, currency_data } = this.loanRequestForm.value;
        const params = {
            requested_loan_amount,
            loan_percentage,
            loan_duration_days,
            interest_amount,
            total_amount,
            currency_data: currency_data._id,
            borrow_lend_contract: (environment as any)[this.account.chainId].BORROW_LEND_CONTRACT,
            collateral_assets: this.loanRequest.collateral_assets.map((item: any) => item._id)
        }

        this.loanService.editRequestLoan(this.loanRequest._id, params).subscribe({
            next: (res) => {
                this.progressData.steps[this.progressData.currentStep].status = 2;
                this.progressData.currentStep = 2;
                this.getLoanRequest();
                this.toastr.success("Loan request edited.");
            }, error: (error) => {
                this.handleError(error);
            }
        })
    }

    async acceptOffer(bid: any) {
        this.showCounterOffer = false;
        let status: any = await this.borrowLendContractService.getLoanStatus(this.account.chainId || environment.DEFAULT_NETWORK, this.loanRequest.nonce);
        let loanClass: any = await this.borrowLendContractService.getLoanClass(this.account.chainId || environment.DEFAULT_NETWORK);
        let index = loanClass.findIndex((item: any) => item.result == status);
        if (index >= 0) {
            this.router.navigate(['/lend']);
            if (index === 0) return this.toastr.error("This loan request has been canceled by borrower.")
            if (index >= 1) return this.toastr.error("This loan request has been closed.")
        }

        if (bid.from._id === this.loanRequest.borrower_id._id) this.acceptLoanRequest(bid);
        else this.acceptCounterOffer(bid)
    }

    async acceptCounterOffer(bid: any) {
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

        this.bid = bid;
        if (this.regulated) {
            const assetNames = this.loanRequest.collateral_assets.length > 1 ? `<ul>${this.loanRequest.collateral_assets.map((asset: any) => `<li><b>${asset.name}</b></li>`).join('')}</ul> items` : `<b>${this.loanRequest.collateral_assets[0].name}</b>`;
            this.confirmationData = {
                image: this.processImages(),
                content: `Are you sure you want to accept lender's offer for <b>${!bid ? this.loanRequest.requested_loan_amount : bid.proposed_bid_amount} ${this.loanRequest.currency_data.symbol}</b> for ${assetNames}?`
            }
            this.confirmationModal?.show();
        } else {
            this.confirmAcceptCounterOffer();
        }
    }

    async acceptLoanRequest(bid: any = false) {
        let status: any = await this.borrowLendContractService.getLoanStatus(this.account.chainId || environment.DEFAULT_NETWORK, this.loanRequest.nonce);
        let loanClass: any = await this.borrowLendContractService.getLoanClass(this.account.chainId || environment.DEFAULT_NETWORK);
        let index = loanClass.findIndex((item: any) => item.result == status);
        if (index >= 0) {
            this.router.navigate(['/lend']);
            if (index === 0) return this.toastr.error("This loan request has been canceled by borrower.")
            if (index >= 1) return this.toastr.error("This loan request has been closed.")
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

        let isBlocked = await this.accessControlContractService.isBlocked(this.account);
        if (isBlocked) return this.toastr.error("User blocked. Please contact the admin regarding your status.");
        this.bid = bid;


        if (this.regulated) {
            const assetNames = this.loanRequest.collateral_assets.length > 1 ? `<ul>${this.loanRequest.collateral_assets.map((asset: any) => `<li><b>${asset.name}</b></li>`).join('')}</ul> items` : `<b>${this.loanRequest.collateral_assets[0].name}</b>`;
            this.confirmationData = {
                image: this.processImages(),
                content: `Are you sure you want to loan <b>${!bid ? this.loanRequest.requested_loan_amount : bid.proposed_bid_amount} ${this.loanRequest.currency_data.symbol}</b> for ${assetNames}?`
            }
            this.confirmationModal?.show();
        } else {
            this.confirmAcceptLoanRequest();
        }
    }

    async confirmAcceptLoanRequest() {
        let bid = this.bid || false;
        this.confirmationModal?.hide();
        this.progressData = {
            title: "Processing.",
            currentStep: 0,
            steps: [
                {
                    title: "Approve allowance.",
                    status: 1
                },
                {
                    title: "Accept loan request.",
                    status: 0
                }
            ],
            failed: false,
            successTitle: "Loan accepted.",
            successMessage: this.user._id === this.loanRequest.borrower_id._id ? `<ul><li class="mb-2" ><b>Loan:</b> ${!bid ? this.loanRequest.requested_loan_amount : bid.proposed_bid_amount} ${this.loanRequest.currency_data.symbol} have been transferred to your wallet.</li><li class="mb-2"><b>Collateral:</b> Your item(s) are locked until repayment.</li><li class="mb-2"><b>Payment:</b> You will need to pay back ${!bid ? this.loanRequest.requested_loan_amount + this.loanRequest.interest_amount : bid.proposed_bid_amount + bid.proposed_interest_amount} ${this.loanRequest.currency_data.symbol} within ${!bid ? this.loanRequest.loan_duration_days : bid.proposed_loan_duration} day(s) to unlock your item(s).</li><li><b>Foreclosure:</b> If not, your item(s) will be transferred to the lender.</li></ul>`
                : `<ul><li class="mb-2"><b>Loan:</b> ${!bid ? this.loanRequest.requested_loan_amount : bid.proposed_bid_amount} ${this.loanRequest.currency_data.symbol} have been transferred from your wallet to the borrower's wallet.</li><li class="mb-2"><b>Collateral:</b> The item(s) are locked until the loan is repaid. </li><li class="mb-2"><b>Repayment:</b> The borrower has the obligation to pay you ${!bid ? this.loanRequest.requested_loan_amount + this.loanRequest.interest_amount : bid.proposed_bid_amount + bid.proposed_interest_amount} ${this.loanRequest.currency_data.symbol} before ${!bid ? this.loanRequest.loan_duration_days : bid.proposed_loan_duration} day(s) have expired.</li><li><b>Foreclosure:</b> If not, after ${!bid ? this.loanRequest.loan_duration_days : bid.proposed_loan_duration} day(s) you will be able to withdraw the item(s) into your wallet.</li></ul> `,

            image: this.processImages()
        }
        this.progressModal?.show();
        let txResp: any;
        let tx: any;
        try {
            // Step 0 - Validate loan status
            let status = await this.borrowLendService.getLoanStatus(this.loanRequest._id);

            if (status) {
                this.progressData.steps[this.progressData.currentStep].status = 3;
                this.progressData.failed = true;
                return this.toastr.error('The loan is already live. Please refresh the page to get the current loan details.');
            }

            let balance = await this.erc20ContractService.getBalance(this.account?.networkId, this.loanRequest.currency_data.address, bid ? bid.to?.wallet_address : this.account.walletAddress);
            let decimal = await this.erc20ContractService.getDecimal(this.account?.networkId, this.loanRequest.currency_data.address);
            let formattedBalance = this.contractUtils.decimalDivider(Number(decimal), balance);
            // Step 1 - Validate lender balance
            let loanAmount = bid ? this.contractUtils.decimalMultipler(Number(decimal), bid.proposed_bid_amount) : this.contractUtils.decimalMultipler(Number(decimal), this.loanRequest.requested_loan_amount)
            if (Number(balance) < Number(loanAmount)) {
                this.progressData.steps[this.progressData.currentStep].status = 3;
                this.progressData.failed = true;
                return this.toastr.error(this.regulated ? `Insufficient balance to accept loan. You have ${Number(formattedBalance).toFixed(4)} ${this.loanRequest.currency_data.symbol} in your wallet, but you need ${bid ? bid.proposed_bid_amount : this.loanRequest.requested_loan_amount} ${this.loanRequest.currency_data.symbol}. To fund your wallet, please contact your account manager.` : `Insufficient balance to accept loan. You have ${Number(formattedBalance).toFixed(4)} ${this.loanRequest.currency_data.symbol} in your wallet, but you need ${bid ? bid.proposed_bid_amount : this.loanRequest.requested_loan_amount} ${this.loanRequest.currency_data.symbol}.`);
            };

            const nfts = this.getNftsFromLoanRequest();

            // create approve tx record in db
            let txData: any = {
                from: this.account.walletAddress,
                to: this.loanRequest.currency_data.address,
                from_id: this.user._id,
                transaction_name: 'Approve currency',
                nft_id: nfts,
                status: 0,
                amount: this.loanRequest.total_amount,
                currency_symbol: this.loanRequest.currency_data.symbol
            }
            txResp = await this.transactionService.createTransaction(txData);
            let transacationData = {
                status: true,
                count: 0
            }
            this.commonService.transactionEmitter(transacationData);

            // Step 1 - approve collections
            let args = { functionName: 'increaseAllowance', args: [(environment as any)[this.account.chainId].BORROW_LEND_CONTRACT, loanAmount], abiType: 'erc20' }
            let { approveAbi, requiredGas: gas } = await this.erc20ContractService.approve(this.account, this.loanRequest.currency_data.address, args);
            tx = await this.commonService.sendTransaction(this.account, this.loanRequest.currency_data.address, approveAbi, gas, args);
            this.progressData.steps[this.progressData.currentStep].status = 2;
            this.progressData.steps[this.progressData.currentStep + 1].status = 1;
            this.progressData.currentStep = 1;

            // update approve tx record in db
            if (this.regulated) tx = JSON.parse(tx.data);
            txData = {
                status: 1,
                transaction_hash: tx.transactionHash
            }
            await this.transactionService.createTransaction(txData, txResp.data._id);
            transacationData = {
                status: true,
                count: 1
            }
            this.commonService.transactionEmitter(transacationData);

            // Step 2 - Accept loan
            if (bid) bid.contract_params.startTime = moment().unix();
            const lendRequest = !bid ? await this.organizeRequest() : bid.contract_params;
            // create accept loan request tx record in db
            let createLoanRequestData: any = {
                from: this.account.walletAddress,
                to: this.loanRequest.currency_data.address,
                from_id: this.user._id,
                transaction_name: 'Accept loan term',
                nft_id: nfts,
                status: 0,
                amount: this.loanRequest.total_amount,
                currency_symbol: this.loanRequest.currency_data.symbol
            }
            txResp = await this.transactionService.createTransaction(createLoanRequestData)
            transacationData = {
                status: true,
                count: 0
            };
            this.commonService.transactionEmitter(transacationData);

            let loanArgs = { functionName: 'acceptLoan', args: [lendRequest], abiType: 'loan' }
            const { acceptLoanAbi, requiredGas } = await this.borrowLendContractService.acceptLoanRequestABI(this.account, loanArgs);
            tx = await this.commonService.sendTransaction(this.account, (environment as any)[this.account.chainId].BORROW_LEND_CONTRACT, acceptLoanAbi, requiredGas, loanArgs);

            // update accept loan request tx record in db
            if (this.regulated) tx = JSON.parse(tx.data);
            txData = {
                status: 1,
                transaction_hash: tx.transactionHash
            }
            await this.transactionService.createTransaction(txData, txResp.data._id);
            transacationData = {
                status: true,
                count: 1
            }
            this.commonService.transactionEmitter(transacationData);

            // Step 2 - update using api
            let acceptData;
            if (!bid) {
                let { loan_duration_days, loan_percentage, requested_loan_amount, interest_amount } = this.loanRequestForm.value;
                acceptData = {
                    lender_id: this.user?._id,
                    proposed_bid_amount: requested_loan_amount,
                    proposed_loan_percentage: loan_percentage,
                    proposed_interest_amount: interest_amount,
                    proposed_loan_duration: loan_duration_days,
                    from: this.user?._id,
                    to: this.loanRequest.borrower_id._id
                }
            } else {
                let { proposed_bid_amount, proposed_interest_amount, proposed_loan_duration, proposed_loan_percentage } = bid;
                let lenderId;
                if (this.user._id === this.loanRequest.borrower_id._id) lenderId = bid.from._id;
                if (bid.from._id === this.loanRequest.borrower_id._id) lenderId = this.user?._id;
                acceptData = {
                    lender_id: lenderId,
                    proposed_bid_amount,
                    proposed_loan_percentage,
                    proposed_interest_amount,
                    proposed_loan_duration,
                    from: this.user?._id,
                    to: this.user._id === this.loanRequest.borrower_id._id ? lenderId : this.loanRequest.borrower_id._id,
                }
            }
            this.acceptLoanRequestApi(acceptData);
        } catch (error: any) {
            this.handleError(error, txResp.data._id);
        }
    }

    async confirmAcceptCounterOffer() {
        let bid = this.bid || false;
        this.confirmationModal?.hide();
        this.progressData = {
            title: "Processing.",
            currentStep: 0,
            steps: [
                {
                    title: "Accept counter offer.",
                    status: 1
                },
                {
                    title: "Update loan request.",
                    status: 0
                },
            ],
            failed: false,
            successTitle: "Offer accepted.",
            successMessage: this.user._id === this.loanRequest.borrower_id._id ? `<ul><li class="mb-2" ><b>Loan:</b> ${bid.proposed_bid_amount} ${this.loanRequest.currency_data.symbol} have been transferred to your wallet.</li><li class="mb-2"><b>Collateral:</b> Your item(s) are locked until repayment.</li><li class="mb-2"><b>Payment:</b> You will need to pay back ${bid.proposed_bid_amount + bid.proposed_interest_amount} ${this.loanRequest.currency_data.symbol} within ${bid.proposed_loan_duration} day(s) to unlock your item(s).</li><li><b>Foreclosure:</b> If not, your item(s) will be transferred to the lender.</li></ul>`
                : `<ul><li class="mb-2"><b>Loan:</b> ${bid.proposed_bid_amount} ${this.loanRequest.currency_data.symbol} have been transferred from your wallet to the borrower's wallet.</li><li class="mb-2"><b>Collateral:</b> The item(s) are locked until the loan is repaid. </li><li class="mb-2"><b>Repayment:</b> The borrower has the obligation to pay you ${bid.proposed_bid_amount + bid.proposed_interest_amount} ${this.loanRequest.currency_data.symbol} before the ${bid.proposed_loan_duration} day(s) have expired.</li><li><b>Foreclosure:</b> If not, after the ${bid.proposed_loan_duration} day(s) you will be able to withdraw the item(s) into your wallet.</li></ul>`,
            image: this.processImages()
        }
        this.progressModal?.show();
        let txResp: any;
        let tx: any;
        try {
            // Step 0 - Validate loan status
            let status = await this.borrowLendService.getLoanStatus(this.loanRequest._id);

            if (status) {
                this.progressData.steps[this.progressData.currentStep].status = 3;
                this.progressData.failed = true;
                return this.toastr.error('The loan is already live. Please refresh the page to get the current loan details.');
            }

            // Step 1 - Validate balance
            let balance = await this.erc20ContractService.getBalance(this.account.networkId, bid.contract_params.loanPaymentContract, bid.contract_params.lender);
            if (Number(balance) < Number(bid.contract_params.loanAmount)) {
                this.progressData.steps[this.progressData.currentStep].status = 3;
                this.progressData.failed = true;
                return this.toastr.error("Insufficient balance in lender wallet.");
            }

            const nfts = this.getNftsFromLoanRequest();

            // create accept counter offer tx record in db
            let txData: any = {
                from: this.account.walletAddress,
                to: (environment as any)[this.account.chainId]['BORROW_LEND_CONTRACT'],
                from_id: this.user._id,
                transaction_name: 'Accept counter offer',
                nft_id: nfts,
                status: 0,
                amount: 0,
                currency_symbol: "-"
            }
            txResp = await this.transactionService.createTransaction(txData);
            let transacationData = {
                status: true,
                count: 0
            }
            this.commonService.transactionEmitter(transacationData);


            // Step 1 - Accept offer
            let args = { functionName: 'acceptCounterOffer', args: [bid.contract_params, bid.signature], abiType: 'loan' }
            const { acceptCounterOfferAbi, requiredGas } = await this.borrowLendContractService.acceptCounterOfferABI(
                this.account,
                args
            );
            tx = await this.commonService.sendTransaction(this.account, (environment as any)[this.account.chainId].BORROW_LEND_CONTRACT, acceptCounterOfferAbi, requiredGas, args);
            this.progressData.steps[this.progressData.currentStep].status = 2;
            this.progressData.steps[this.progressData.currentStep + 1].status = 1;
            this.progressData.currentStep = 1;
            // update accept counter offer record in db
            if (this.regulated) tx = JSON.parse(tx.data);
            txData = {
                status: 1,
                transaction_hash: tx.transactionHash
            }
            await this.transactionService.createTransaction(txData, txResp.data._id);
            transacationData = {
                status: true,
                count: 1
            }
            this.commonService.transactionEmitter(transacationData);

            // Step 3
            let { proposed_bid_amount, proposed_loan_percentage, proposed_interest_amount, proposed_loan_duration, from } = bid;
            let acceptData = {
                lender_id: from?._id,
                proposed_bid_amount,
                proposed_loan_percentage,
                proposed_interest_amount,
                proposed_loan_duration,
                from: this.user?._id,
                to: this.user._id === this.loanRequest.borrower_id._id ? from?._id : this.loanRequest.borrower_id._id,
            }
            this.acceptLoanRequestApi(acceptData);
        } catch (error) {
            this.handleError(error, txResp.data._id);
        }
    }

    acceptLoanRequestApi(loanData: any) {
        const params = {
            loan_request_id: this.loanRequest._id,
            borrower_id: this.loanRequest.borrower_id._id,
            status: 3,
            ...loanData
        }

        this.borrowLendService.counterOffer(params).subscribe({
            next: (res: any) => {
                this.progressData.steps[this.progressData.currentStep].status = 2;
                this.progressData.currentStep = 2;
                this.toastr.success("Loan request accepted successfully.");
                this.loanRequestForm.reset();
                this.getLoanRequest();
            },
            error: (error) => {
                this.handleError(error);
            }
        })
    }

    async organizeRequest(bid: any = false) {
        let nfts: any[] = [];
        const nftAssets = this.loanRequest.collateral_assets;
        for (let index = 0; index < nftAssets.length; index++) {
            nfts.push({ collectionAddress: nftAssets[index].collections.collection_address, tokenId: nftAssets[index].token_id });
        };

        let { loan_duration_days, loan_percentage, requested_loan_amount } = this.loanRequestForm.value;
        let order = await this.borrowLendContractService.lendNFTParams(
            await getAddress(this.loanRequest.borrower_id.wallet_address),
            !bid ? await getAddress(this.account.walletAddress) : await getAddress(bid.contract_params.lender),
            nfts,
            this.loanRequest._id,
            moment().unix(),
            loan_duration_days,
            this.loanRequest.currency_data.address,
            requested_loan_amount,
            loan_percentage,
            this.loanRequest.nonce,
            this.account?.networkId
        );
        return order;
    }

    async counterOffer() {
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

        let status: any = await this.borrowLendContractService.getLoanStatus(this.account.chainId || environment.DEFAULT_NETWORK, this.loanRequest.nonce);
        let loanClass: any = await this.borrowLendContractService.getLoanClass(this.account.chainId || environment.DEFAULT_NETWORK);
        let index = loanClass.findIndex((item: any) => item.result == status);
        if (index >= 0) {
            this.router.navigate(['/lend']);
            if (index === 0) return this.toastr.error("This loan request has been canceled by borrower.")
            if (index >= 1) return this.toastr.error("This loan request has been closed.")
        }

        this.progressData = {
            title: "Processing.",
            currentStep: 0,
            steps: [
                {
                    title: "Approve currency.",
                    status: 1
                },
                {
                    title: "Create signature and counter offer.",
                    status: 0
                }
            ],
            failed: false,
            successTitle: "Counter offered.",
            image: this.processImages()
        }
        this.progressModal?.show();
        let txResp: any;
        let tx: any;
        try {
            // Step 0 - Validate loan status
            let status = await this.borrowLendService.getLoanStatus(this.loanRequest._id);

            if (status) {
                this.progressData.steps[this.progressData.currentStep].status = 3;
                this.progressData.failed = true;
                return this.toastr.error('The loan is already live. Please refresh the page to get the current loan details.');
            }

            const nfts = this.getNftsFromLoanRequest();

            // create approve currency tx
            let txData: any = {
                from: this.account.walletAddress,
                to: this.loanRequest.currency_data.address,
                from_id: this.user._id,
                transaction_name: 'Approve currency',
                nft_id: nfts,
                status: 0,
                amount: this.loanRequestForm.value.total_amount,
                currency_symbol: this.loanRequest.currency_data.symbol
            }
            txResp = await this.transactionService.createTransaction(txData);
            let transacationData = {
                status: true,
                count: 0
            }

            this.commonService.transactionEmitter(transacationData);

            // Step 1 - Approve currency
            let decimal = await this.erc20ContractService.getDecimal(this.account?.networkId, this.loanRequest.currency_data.address);
            let args = { functionName: 'increaseAllowance', args: [(environment as any)[this.account.chainId].BORROW_LEND_CONTRACT, this.contractUtils.decimalMultipler(Number(decimal), Number(this.loanRequestForm.value.total_amount))], abiType: 'erc20' }
            const { approveAbi, requiredGas } = await this.erc20ContractService
                .approve(
                    this.account,
                    this.loanRequest.currency_data.address,
                    args
                );
            tx = await this.commonService.sendTransaction(this.account, this.loanRequest.currency_data.address, approveAbi, requiredGas, args);
            this.progressData.steps[this.progressData.currentStep].status = 2;
            this.progressData.steps[this.progressData.currentStep + 1].status = 1;
            this.progressData.currentStep = 1;

            // update approve currency tx
            if (this.regulated) tx = JSON.parse(tx.data);
            txData = {
                status: 1,
                transaction_hash: tx.transactionHash
            }
            await this.transactionService.createTransaction(txData, txResp.data._id);
            transacationData = {
                status: true,
                count: 1
            }
            this.commonService.transactionEmitter(transacationData);

            // Step 2 - Create signature
            const requestDatas: any = await this.createSignature();

            // Step 2 - counter offer
            this.lenderCounterOffer(requestDatas?.signature, requestDatas.lendRequest);
        } catch (error) {
            console.log('error', error)
            this.handleError(error, txResp.data._id);
        }
    }

    async recounter() {
        let status: any = await this.borrowLendContractService.getLoanStatus(this.account.chainId || environment.DEFAULT_NETWORK, this.loanRequest.nonce);
        let loanClass: any = await this.borrowLendContractService.getLoanClass(this.account.chainId || environment.DEFAULT_NETWORK);
        let index = loanClass.findIndex((item: any) => item.result == status);
        if (index >= 0) {
            this.router.navigate(['/lend']);
            if (index === 0) return this.toastr.error("This loan request has been canceled by borrower.")
            if (index >= 1) return this.toastr.error("This loan request has been closed.")
        }

        if (this.user._id !== this.loanRequest.borrower_id._id) this.counterOffer();
        else this.borrowerRecounter()
    }

    async borrowerRecounter() {
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

        this.progressData = {
            title: "Processing.",
            currentStep: 0,
            steps: [
                {
                    title: "Re-counter offer.",
                    status: 1
                }
            ],
            failed: false,
            successTitle: "Re-countered.",
            image: this.processImages()
        }
        this.progressModal?.show();

        // Step 0 - Validate loan status
        let status = await this.borrowLendService.getLoanStatus(this.loanRequest._id);

        if (status) {
            this.progressData.steps[this.progressData.currentStep].status = 3;
            this.progressData.failed = true;
            return this.toastr.error('The loan is already live. Please refresh the page to get the current loan details.');
        }

        let { loan_duration_days, loan_percentage, requested_loan_amount, interest_amount } = this.loanRequestForm.value;
        const params = {
            loan_request_id: this.loanRequest._id,
            borrower_id: this.user?._id,
            lender_id: this.recounterBid.from._id,
            from: this.user?._id,
            to: this.recounterBid.from._id,
            proposed_bid_amount: requested_loan_amount,
            proposed_loan_percentage: loan_percentage,
            proposed_interest_amount: interest_amount,
            proposed_loan_duration: loan_duration_days,
            status: 2,
            contract_params: await this.organizeRequest(this.recounterBid)
        }
        const nfts = this.getNftsFromLoanRequest();

        let txData: any = {
            from: this.account.walletAddress,
            to: this.loanRequest.currency_data.address,
            from_id: this.user._id,
            transaction_name: 'Re-counter offer',
            nft_id: nfts,
            status: 1,
            amount: this.loanRequestForm.value.total_amount,
            currency_symbol: this.loanRequest.currency_data.symbol
        }

        let txResp: any;
        this.borrowLendService.counterOffer(params).subscribe({
            next: async (res: any) => {
                this.progressData.steps[this.progressData.currentStep].status = 2;
                this.progressData.currentStep = 1;
                this.toastr.success("Re-counter submitted.");
                this.loanRequestForm.reset();
                this.showCounterOffer = false;
                this.getLoanRequest();
                txResp = await this.transactionService.createTransaction(txData);
                let transacationData = {
                    status: true,
                    count: 1
                }
                this.commonService.transactionEmitter(transacationData);
            },
            error: (error) => {
                this.handleError(error, txResp.data._id)
            }
        })
    }

    async createSignature() {
        const lendRequest = await this.organizeRequest();

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
                { name: 'borrower', type: 'address' },
                { name: 'lender', type: 'address' },
                { name: 'nfts', type: 'NFT[]' },
                { name: 'requestId', type: 'string' },
                { name: 'startTime', type: 'uint256' },
                { name: 'duration', type: 'uint256' },
                { name: 'loanPaymentContract', type: 'address' },
                { name: 'loanAmount', type: 'uint256' },
                { name: 'loanPercentage', type: 'uint256' },
                { name: 'loanId', type: 'uint256' }
            ],
        }
        let signature;
        if (this.regulated) {
            let response: any = await this.borrowLendService.getSignature({ lendRequest, signerAddress: this.account.walletAddress, contract: (environment as any)[this.account.chainId].BORROW_LEND_CONTRACT });
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

    async lenderCounterOffer(signature: string, contractParams: any) {
        if (this.user?._id == this.loanRequest.borrower_id._id) {
            this.toastr.error("Lender & borrower should not be the same.")
            return;
        }
        let { loan_duration_days, loan_percentage, requested_loan_amount, interest_amount } = this.loanRequestForm.value;
        const params = {
            loan_request_id: this.loanRequest._id,
            borrower_id: this.loanRequest.borrower_id._id,
            lender_id: this.user?._id,
            from: this.user?._id,
            to: this.loanRequest.borrower_id._id,
            proposed_bid_amount: requested_loan_amount,
            proposed_loan_percentage: loan_percentage,
            proposed_interest_amount: interest_amount,
            proposed_loan_duration: loan_duration_days,
            status: 2,
            signature: signature,
            contract_params: contractParams
        }

        const nfts = this.getNftsFromLoanRequest();

        let txData: any = {
            from: this.account.walletAddress,
            to: (environment as any)[this.account?.chainId].BORROW_LEND_CONTRACT,
            from_id: this.user._id,
            transaction_name: 'Counter offer',
            nft_id: nfts,
            status: 1,
            amount: this.loanRequestForm.value.total_amount,
            currency_symbol: this.loanRequest.currency_data.symbol
        }
        let txResp: any;
        this.borrowLendService.counterOffer(params).subscribe({
            next: async (res: any) => {
                this.progressData.steps[this.progressData.currentStep].status = 2;
                this.progressData.currentStep = 2;
                this.toastr.success("Counter offer submitted.");
                this.loanRequestForm.reset();
                this.showCounterOffer = false;
                this.getLoanRequest(true);
                txResp = await this.transactionService.createTransaction(txData);
                let transacationData = {
                    status: true,
                    count: 1
                }
                this.commonService.transactionEmitter(transacationData);
            },
            error: (error) => {
                this.handleError(error, txResp.data._id)
            }
        })
    }

    async cancelLoan() {
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

        this.progressData = {
            title: "Processing.",
            currentStep: 0,
            steps: [
                {
                    title: "Cancel loan request.",
                    status: 1
                },
                {
                    title: "Update loan status.",
                    status: 0
                }
            ],
            failed: false,
            successTitle: "Loan cancelled.",
            image: this.processImages()
        }
        this.progressModal?.show();
        let txResp: any;
        let tx: any;
        try {
            // Step 0 - Validate loan status
            let status = await this.borrowLendService.getLoanStatus(this.loanRequest._id);

            if (status) {
                this.progressData.steps[this.progressData.currentStep].status = 3;
                this.progressData.failed = true;
                return this.toastr.error('The loan is already live. Please refresh the page to get the current loan details.');
            }

            const nfts = this.getNftsFromLoanRequest();

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
            let transacationData = {
                status: true,
                count: 0
            }
            this.commonService.transactionEmitter(transacationData);

            // Step 1
            let args = { functionName: 'cancelLoan', args: [this.loanRequest.nonce], abiType: 'loan' }
            const { cancelLoanAbi, requiredGas } = await this.borrowLendContractService.cancelLoanRequest(this.account, args);
            tx = await this.commonService.sendTransaction(this.account, (environment as any)[this.account?.chainId].BORROW_LEND_CONTRACT, cancelLoanAbi, requiredGas, args);
            this.progressData.steps[this.progressData.currentStep].status = 2;
            this.progressData.steps[this.progressData.currentStep + 1].status = 1;
            this.progressData.currentStep = 1;
            if (this.regulated) tx = JSON.parse(tx.data);
            txData = {
                status: 1,
                transaction_hash: tx.transactionHash
            }
            await this.transactionService.createTransaction(txData, txResp.data._id);
            transacationData = {
                status: true,
                count: 1
            }
            this.commonService.transactionEmitter(transacationData);

            // Step 2 - Api to write cancel loan request to db
            this.loanService.cancelLoan(this.loanRequest._id).subscribe({
                next: (res: any) => {
                    this.progressData.steps[this.progressData.currentStep].status = 2;
                    this.progressData.currentStep = 2;
                    this.toastr.success("Loan request cancelled.");
                    this.router.navigate(['my-wallet'])
                },
                error: (error) => {
                    this.handleError(error);
                }
            })
        } catch (error) {
            this.handleError(error, txResp.data._id);
        }
    }

    async repayLoanRequest() {
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

        if (this.regulated) {
            const assetNames = this.loanRequest.collateral_assets.length > 1 ? `<ul>${this.loanRequest.collateral_assets.map((asset: any) => `<li><b>${asset.name}</b></li>`).join('')}</ul> items` : `<b>${this.loanRequest.collateral_assets[0].name}</b>`;
            this.confirmationData = {
                image: this.processImages(),
                content: `Are you sure to repay loan on ${assetNames} for <b>${this.repayLoan?.total_amount.toFixed(3)} ${this.loanRequest.currency_data.symbol}</b>?`
            }
            this.confirmationModal?.show();
        } else {
            this.confirmRepay();
        }
    }

    async confirmRepay() {
        let repayStatus: any = await this.checkAllowance()
        this.confirmationModal?.hide();
        this.progressData = {
            title: "Processing.",
            currentStep: 0,
            steps: [
                {
                    title: "Approve allowance.",
                    status: 1
                },
                {
                    title: "Repay loan.",
                    status: 0
                }
            ],
            failed: false,
            successTitle: "Loan repaid.",
            successMessage: `<ul><li class="mb-2"><b>Repayment:</b> ${Number(repayStatus?.amount).toFixed(3)} ${this.loanRequest.currency_data.symbol} were paid back to the lender. </li><li class="mb-2"><b>Collateral:</b> Your item(s) have now been released to your wallet. </li></ul>`,
            image: this.processImages()
        }
        this.progressModal?.show();
        let txResp: any;
        let tx: any;
        try {
            const nfts = this.getNftsFromLoanRequest();

            // Step 1 - Approve currency
            if (repayStatus == 'revert') return
            if (!repayStatus.status) {
                // create approve tx record in db
                let txData: any = {
                    from: this.account.walletAddress,
                    to: this.loanRequest.currency_data.address,
                    from_id: this.user._id,
                    transaction_name: 'Approve currency',
                    nft_id: nfts,
                    status: 0,
                    amount: repayStatus.amount,
                    currency_symbol: this.loanRequest.currency_data.symbol
                }
                txResp = await this.transactionService.createTransaction(txData);
                let transacationData = {
                    status: true,
                    count: 0
                }
                this.commonService.transactionEmitter(transacationData);

                let decimal = await this.erc20ContractService.getDecimal(this.account?.networkId, this.loanRequest.currency_data.address);
                let args = { functionName: 'increaseAllowance', args: [(environment as any)[this.account.chainId].BORROW_LEND_CONTRACT, this.contractUtils.decimalMultipler(Number(decimal), Number(repayStatus.amount))], abiType: 'erc20' }
                const { approveAbi, requiredGas } = await this.erc20ContractService.approve(
                    this.account,
                    this.loanRequest.currency_data.address,
                    args
                );
                tx = await this.commonService.sendTransaction(this.account, this.loanRequest.currency_data.address, approveAbi, requiredGas, args);
                this.progressData.steps[this.progressData.currentStep].status = 2;
                this.progressData.steps[this.progressData.currentStep + 1].status = 1;
                this.progressData.currentStep = 1;

                // update approve tx record in db
                txData = {
                    status: 1,
                    transaction_hash: tx.transactionHash
                }
                await this.transactionService.createTransaction(txData, txResp.data._id);
                transacationData = {
                    status: true,
                    count: 1
                }
                this.commonService.transactionEmitter(transacationData);
            } else {
                this.progressData.steps[this.progressData.currentStep].status = 2;
                this.progressData.steps[this.progressData.currentStep + 1].status = 1;
                this.progressData.currentStep = 1;
            }

            // Step 2 - Repay loan
            this.executeRepayLoan(repayStatus.amount);

        } catch (error) {
            this.handleError(error, txResp.data._id);
        }
    }

    async checkAllowance() {
        let duration: any = await this.borrowLendContractService.getDurationInDays(this.account, this.loanRequest.nonce)
        // if (duration > 0) {
        let repayAmount: any = await this.borrowLendContractService.getRepaymentAmountWithInterest(this.account, this.loanRequest, duration)
        let allowance: any = await this.borrowLendContractService.getAllowance(this.account, this.loanRequest.currency_data)
        if (Number(allowance) >= Number(repayAmount))
            return { status: true, amount: repayAmount }
        else
            return { status: false, amount: repayAmount }
        // } else {
        //   this.toastr.error("Repayment should be done after minimum duration of 1 day")
        //   this.processing = false
        //   return 'revert'
        // }
    }

    async executeRepayLoan(repayAmount: number) {
        let txResp: any;
        let tx: any;
        try {
            const nfts = this.getNftsFromLoanRequest();
            // create repay loan request tx record in db
            let txData: any = {
                from: this.account.walletAddress,
                to: (environment as any)[this.account.chainId]['BORROW_LEND_CONTRACT'],
                from_id: this.user._id,
                transaction_name: 'Repay loan',
                nft_id: nfts,
                status: 0,
                amount: 0,
                currency_symbol: "-"
            }
            txResp = await this.transactionService.createTransaction(txData);
            let transacationData = {
                status: true,
                count: 0
            }
            this.commonService.transactionEmitter(transacationData);

            let args = { functionName: 'repayLoan', args: [this.loanRequest.nonce], abiType: 'loan' }
            const { repayLoanAbi, requiredGas } = await this.borrowLendContractService.repayLoanABI(
                this.account,
                args
            );
            tx = await this.commonService.sendTransaction(this.account, (environment as any)[this.account.chainId].BORROW_LEND_CONTRACT, repayLoanAbi, requiredGas, args);
            // update repay loan request tx record in db
            if (this.regulated) tx = JSON.parse(tx.data);
            txData = {
                status: 1,
                transaction_hash: tx.transactionHash
            }
            await this.transactionService.createTransaction(txData, txResp.data._id);
            transacationData = {
                status: true,
                count: 1
            }
            this.commonService.transactionEmitter(transacationData);

            // Step 3
            txResp = {};
            this.repayLoanApi(tx.transactionHash, repayAmount);
        } catch (error: any) {
            this.handleError(error, txResp?.data?._id);
        }
    }

    async repayLoanApi(txHash: string, repayAmount: number) {
        let params = {
            loan_request_id: this.loanRequest._id,
            loan_amount: this.repayLoan.requested_loan_amount,
            loan_amount_repaid: repayAmount,
            transaction_hash: txHash,
            payment_date: Date.now(),
            payment_time: Date.now(),
            payment_mode: "Success",
            status: 2
        }
        this.borrowLendService.repayLoan(params).subscribe({
            next: (res: any) => {
                this.progressData.steps[this.progressData.currentStep].status = 2;
                this.progressData.currentStep = 2;
                this.toastr.success("Repaid loan with interest successfully.");
                this.loanRequestForm.reset();
                this.getLoanRequest();
            },
            error: (error) => {
                this.handleError(error);
            }
        })
    }

    async forceCloseLoan() {
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

        if (this.regulated) {
            const assetNames = this.loanRequest.collateral_assets.length > 1 ? `<ul>${this.loanRequest.collateral_assets.map((asset: any) => `<li><b>${asset.name}</b></li>`).join('')}</ul> items` : `<b>${this.loanRequest.collateral_assets[0].name}</b>`;
            this.confirmationData = {
                image: this.processImages(),
                content: `Are you sure to foreclose loan on ${assetNames} for <b>${this.repayLoan?.total_amount.toFixed(3)} ${this.loanRequest.currency_data.symbol}</b>?`
            }
            this.confirmationModal?.show();
        } else {
            this.confirmForeclose();
        }
    }

    async confirmForeclose() {
        this.confirmationModal?.hide();
        this.progressData = {
            title: "Processing.",
            currentStep: 0,
            steps: [
                {
                    title: "Foreclose loan.",
                    status: 1
                },
                {
                    title: "Update loan status.",
                    status: 0
                }
            ],
            failed: false,
            successTitle: "Loan foreclosed.",
            successMessage: `<ul><li class="mb-2"><b>Repayment:</b> The loan in the amount of ${this.loanRequest.requested_loan_amount.toFixed(3)} ${this.loanRequest.currency_data.symbol} was not repayed by the borrower. </li><li class="mb-2"><b>Loan:</b> You have selected to foreclose on the loan. </li><li><b>Collateral:</b> The collateral item(s) have been transferred to your wallet.​</li></ul>`,
            image: this.processImages()
        }
        this.progressModal?.show();
        let txResp: any;
        let tx: any;
        try {
            const nfts = this.getNftsFromLoanRequest();
            // create foreclose tx record in db
            let txData: any = {
                from: this.account.walletAddress,
                to: (environment as any)[this.account.chainId]['BORROW_LEND_CONTRACT'],
                from_id: this.user._id,
                transaction_name: 'Foreclose loan',
                nft_id: nfts,
                status: 0,
                amount: 0,
                currency_symbol: "-"
            }
            txResp = await this.transactionService.createTransaction(txData);
            let transacationData = {
                status: true,
                count: 0
            }
            this.commonService.transactionEmitter(transacationData);

            // Step 1
            let args = { functionName: 'forceClose', args: [this.loanRequest.nonce], abiType: 'loan' }
            const { forceCloseAbi, requiredGas } = await this.borrowLendContractService.forceCloseABI(this.account, args);
            tx = await this.commonService.sendTransaction(this.account, (environment as any)[this.account.chainId].BORROW_LEND_CONTRACT, forceCloseAbi, requiredGas, args);
            this.progressData.steps[this.progressData.currentStep].status = 2;
            this.progressData.steps[this.progressData.currentStep + 1].status = 1;
            this.progressData.currentStep = 1;
            // update foreclose tx record in db
            if (this.regulated) tx = JSON.parse(tx.data);
            txData = {
                status: 1,
                transaction_hash: tx.transactionHash
            }
            await this.transactionService.createTransaction(txData, txResp.data._id);
            transacationData = {
                status: true,
                count: 1
            }

            this.commonService.transactionEmitter(transacationData);


            // step 2
            this.closeLoan(tx.transactionHash);
        } catch (error) {
            this.handleError(error, txResp.data._id);
        }
    }

    closeLoan(txHash: string) {
        let params = {
            loan_request_id: this.loanRequest._id,
            transaction_hash: txHash,
            payment_date: Date.now(),
            status: 3
        }
        this.borrowLendService.repayLoan(params).subscribe({
            next: (res: any) => {
                this.progressData.steps[this.progressData.currentStep].status = 2;
                this.progressData.currentStep = 2;
                this.toastr.success(res.message);
                this.getLoanRequest();
            },
            error: (error) => {
                this.handleError(error);
            }
        })
    }

    async handleError(error: any, txId: any = '') {
        if (error?.error?.message?.includes('INSUFFICIENT_FUNDS_FOR_FEE')) error.shortMessage = "Insufficient native currency to proceed. To fund your wallet, please contact your account manager. If already funded please wait a few moments.";
        if (error?.error?.message?.includes('was not mined within 50 blocks')) error.shortMessage = "Transaction timeout. Please initiate transaction again.";
        if (error?.error?.status_code === 401) {
            error.shortMessage = "Authentication failed. Login again to continue.";
            await this.accountService.updateAuthentication(false);
        }
        error = await JSON.stringify(error, null, 2);
        error = await JSON.parse(error);
        if (error?.shortMessage?.includes('An internal error was received') || error?.shortMessage?.includes('Execution reverted for an unknown reason.')) {
            let status: any = await this.borrowLendContractService.getLoanStatus(this.account.chainId || environment.DEFAULT_NETWORK, this.loanRequest.nonce);
            let loanClass: any = await this.borrowLendContractService.getLoanClass(this.account.chainId || environment.DEFAULT_NETWORK);
            let index = loanClass.findIndex((item: any) => item.result === status);
            if (index === 0) error.shortMessage = "This loan request has been canceled by borrower"
            if (index >= 1) error.shortMessage = "This loan request has been closed."
            this.router.navigate(['/lend']);
        }

        if (error?.shortMessage?.includes('reverted with the following reason:')) {
            let errorMessage = error?.shortMessage?.split('reverted with the following reason:');
            error.shortMessage = errorMessage[errorMessage.length - 1]
        }
        this.toastr.error(error.shortMessage || "Something went wrong, try again later.");
        this.progressData.steps[this.progressData.currentStep].status = 3;
        this.progressData.failed = true;
        let txData = {
            status: 2,
            error_message: error.shortMessage || "Something went wrong."
        }
        await this.transactionService.createTransaction(txData, txId);
        let transacationData = {
            status: true,
            count: 1
        }
        this.commonService.transactionEmitter(transacationData);
    }

    onNavChange(event: string) {
        if (event === 'makeoffer') this.loanRequestFormDisabled = true;
        else this.loanRequestFormDisabled = false;
        this.isOnLoanTerms = event === 'makeoffer'
        this.setLoanRequestForm(event === 'counteroffer' ? true : false);
    }

    decimalFilter(event: any) {
        const reg = /^\d*(\.\d{0,4})?$/;
        let input = event.target.value + String.fromCharCode(event.charCode);
        if (!reg.test(input)) {
            event.preventDefault();
        }
    }

    thumbsliderOptions: OwlOptions = {
        loop: false,
        margin: 10,
        autoplay: true,
        dots: false,
        nav: false,
        items: 4,
        skip_validateItems: true
    }

    customOptions: OwlOptions = {
        loop: false,
        margin: 20,
        autoplay: false,
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
    borrowNftOptions: OwlOptions = {
        loop: false,
        margin: 10,
        autoplay: false,
        dots: false,
        nav: true,
        // autoWidth:true,
        autoHeight: true,
        navText: ['<i class="bi bi-chevron-left"></i>', '<i class="bi bi-chevron-right"></i>'],
        skip_validateItems: true,
        items: 4,
        slideBy: 1,

    };

    changeAsset(assets: any) {
        this.selectedNft = assets;
        let images = [this.selectedNft.primary_media, ...this.selectedNft.secondary_media];
        this.selectedNft.images = [];
        images.map(async (imageUrl: any, index: number) => {
            let splitUrl = imageUrl.split('.');
            if (splitUrl[splitUrl.length - 1] === 'html') {
                this.selectedNft.images[index] = { url: imageUrl, fileType: splitUrl[splitUrl.length - 1], preview: this.selectedNft?.preview_image };
            } else {
                let data: any = await this.commonService.getImage(imageUrl);
                this.selectedNft.images[index] = { url: imageUrl, fileType: data?.contentType?.split('/')[1], preview: this.selectedNft?.preview_image };
            }
        })
        this.isActive = !this.isActive;
        let priceIndex = this.selectedNft.attributes.findIndex((attribute: any) => attribute.key.toLowerCase() === 'price');
        if (priceIndex > -1) this.selectedNft.attributes.splice(priceIndex, 1);
        let appraisal = this.selectedNft.attributes.find((attribute: any) => attribute.key.toLowerCase() === 'appraisal value');
        if (appraisal) appraisal.value = Math.ceil(appraisal.value)
        if (this.selectedNft?.collections?.category?.toLowerCase() === 'gold') {
            let quantityIndex = this.selectedNft.attributes.findIndex((attribute: any) => attribute?.key?.toLowerCase() === 'quantity');
            if (quantityIndex > -1) this.selectedNft.attributes.splice(quantityIndex, 1);
        }
    }

    toggleShowCounterOffer(bid: any = undefined) {
        this.showCounterOffer = true;
        setTimeout(() => {
            document.getElementById('prinicipal')?.focus();
            document.getElementById('conterOfferForm')?.scrollIntoView({
                behavior: "smooth"
            });
        }, 0);
        if (bid) {
            this.loanRequestFormDisabled = false;
            this.recounterBid = bid;
            this.loanRequestForm.patchValue({
                requested_loan_amount: bid.proposed_bid_amount,
                currency_data: this.loanRequest.currency_data,
                loan_percentage: bid.proposed_loan_percentage,
                loan_duration_days: bid.proposed_loan_duration,
                interest_amount: bid.proposed_interest_amount,
                total_amount: Number(bid.proposed_bid_amount) + Number(bid.proposed_interest_amount)
            })
        } else {
            this.loanRequestFormDisabled = true;
            this.loanRequestForm.patchValue(this.loanRequest);
        }
    }

    hideCounterOffer() {
        this.showCounterOffer = false;
    }

    isLiveLoan() {
        let LOAN_IN_DAYS = this.account.chainId ? (environment as any)[this.account.chainId].LOAN_IN_DAYS : (environment as any)['DEFAULT_NETWORK'].LOAN_IN_DAYS;
        if (environment.ENVNAME === 'DEVELOPMENT') this.loanRequest.end_date = moment(this.loanRequest.start_date).clone().add(this.loanRequest.loan_duration_days, LOAN_IN_DAYS ? 'days' : 'hours').toISOString()
        return moment(moment().format("YYYY-MM-DD, hh:mm a"), 'YYYY-MM-DD, hh:mm a').isBefore(moment(moment(this.loanRequest?.end_date).format("YYYY-MM-DD, hh:mm a"), 'YYYY-MM-DD, hh:mm a'))
    }

    async connectWallet() {
        await this.accountService.enableMetaMaskConnection(true)
    }

    showActions() {
        return this.loanRequest?.open_offer?.filter((item: any) => item.actions === true).length > 0 && this.loanRequest?.status === 0
    }

    copy(msg: any) {
        this.clipboardService.copy(msg);
        this.toastr.success('Copied to clipboard.');
    }

    async confirmPurchase() {
        if (this.loanRequest.status === 0 && (!this.bid || (this.bid && this.bid?.from?._id === this.loanRequest.borrower_id._id))) this.confirmAcceptLoanRequest();
        else if (this.loanRequest.status === 0) this.confirmAcceptCounterOffer();
        else if (this.loanRequest.status === 1 && this.loanRequest.borrower_id._id === this.user._id) this.confirmRepay();
        else if (this.loanRequest.status === 1) this.confirmForeclose();
    }


    /**
     * Gets nfts from loan request
     * @returns
     */
    private getNftsFromLoanRequest() {
        let nfts: any[] = [];
        const nftAssets = this.loanRequest.collateral_assets;
        for (let index = 0; index < nftAssets.length; index++) {
            nfts.push(nftAssets[index]._id);
        };
        return nfts;
    }

    setRoute() {
        this.webStorageService.setItem('previousRoute', this.router.url)
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
     * process images to send to confirmation modal
     */
    private processImages() {
        this.processedImages = this.loanRequest?.collateral_assets?.map((asset: any) => {
            if (asset.fileType === 'html') {
                return {
                    ...asset,
                    displayImage: asset.preview_image ? asset.preview_image : asset.secondary_media[0]
                };
            } else {
                return {
                    ...asset,
                    displayImage: asset.preview_image ? asset.preview_image : asset.primary_media
                };
            }
        });
        return this.processedImages;

    }

  /**
   * Starts a countdown timer for the due date of the loan request.
   * Clears any existing interval before starting a new one.
   * Updates the @link {timeRemaining} every minute until the countdown reaches zero.
   * Once the due date is passed, the interval is cleared.
   *
   * @private
   * @returns {void}
   */
  private startDueDateCountdown() {
    clearInterval(this.intervalId);
    this.intervalId = setInterval(() => {
      const end = new Date(this.loanRequest.end_date).getTime();
      const now = new Date().getTime();
      const remainingDuration = end - now;
      if (remainingDuration > 0) {
        this.timeRemaining = this.commonService.getTimeRemaining(this.loanRequest.end_date);
      } else {
        clearInterval(this.intervalId);
      }
    }, 60000);
  }
}
