import { Options } from '@angular-slider/ngx-slider';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, Input, OnDestroy, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PhoneNumberUtil } from 'google-libphonenumber';
import moment from 'moment';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { ToastrService } from 'ngx-toastr';
import { Subject, debounceTime } from 'rxjs';
import { COUNTRIES } from 'src/app/shared/Hepler/countries';
import { AccessControlContractService } from 'src/app/shared/services/access-control-contract.service';
import { AccountService } from 'src/app/shared/services/account.service';
import { CollectionContractService } from 'src/app/shared/services/collection-contract.service';
import { CommonService } from 'src/app/shared/services/common.service';
import { CountryService } from 'src/app/shared/services/countries.service';
import { DeliveryService } from 'src/app/shared/services/delivery.service';
import { ExchangeContractService } from 'src/app/shared/services/exchange-contract.service';
import { ExchangeService } from 'src/app/shared/services/exchange.service';
import { LendBorrowContractService } from 'src/app/shared/services/lend-borrow-contract.service';
import { LoanService } from 'src/app/shared/services/loan.service';
import { NftService } from 'src/app/shared/services/nft.service';
import { SocketService } from 'src/app/shared/services/socket.service';
import { TransactionService } from 'src/app/shared/services/transaction.service';
import { WebStorageService } from 'src/app/shared/services/web-storage.service';
import { IApiResponse } from 'src/app/shared/utils/common.interface';
import { environment } from 'src/environments/environment';
import { getAddress } from 'viem';

@Component({
    selector: 'app-nfts-listing',
    templateUrl: './nfts-listing.component.html',
    styleUrls: ['./nfts-listing.component.css']
})
export class NftsListingComponent implements OnDestroy {
    @ViewChild('progressModal', { static: false }) progressModal?: ModalDirective;
    @ViewChild('redeemModal', { static: false }) redeemModal?: ModalDirective;
    @ViewChild('verificationModal', { static: false }) verificationModal?: ModalDirective;
    // @ViewChild('confirmationModal', { static: false }) confirmationModal?: ModalDirective;

    // Filter variables
    showFilter: boolean = false;
    filters: any[] = [];
    filterCollection: any[] = [];
    filterLocation: any[] = [];
    filterCategory: any[] = [];
    filterSale: any[] = [{ name: "For sale.", value: "yes", checked: false }, { name: "Not for sale.", value: "no", checked: false }];
    filterCollateral: any[] = [{ name: "In collateral", value: "yes", checked: false }, { name: "Not in collateral", value: "no", checked: false }];
    filterPrice: any[] = [];
    filterAppraisal: any[] = [];

    @Input() isMyWallet:boolean = false; //Flag to determine if the component is being used on the 'my-wallet' page.

    collections: any[] = [];
    categories: any[] = [];
    locations: any[] = [];
    currencies: any[] = [];
    currencyConversions: any[] = [];
    priceSlider = {
        floor: 1,
        ceil: 1,
        minValue: 1,
        maxValue: 1,
        loader: false
    }
    appraisalSlider = {
        floor: 1,
        ceil: 1,
        minValue: 1,
        maxValue: 1,
        loader: false
    };
    isInSale: boolean = true;
    saleOption: any[] = [{ name: "For sale.", value: "yes", checked: true }, { name: "Not for sale.", value: "no", checked: false }];
    collateralOption: any[] = [{ name: "In collateral", value: "yes", checked: false }, { name: "Not in collateral", value: "no", checked: false }];
    partition: string = '';

    // loader variables
    loader: boolean = true;
    scrollLoader: boolean = false;
    nftTraitsLoader: boolean = false;
    collectionLoader: boolean = false;
    redeemFormLoader = false;

    Math: any = Math;
    account: any;
    isGridView: boolean = true;
    isLoanRequest: boolean = false;
    selectedNfts: any[] = [];
    isCardClicked: boolean = false;
    nfts: any[] = [];
    imageLoading: boolean = true;
    loanRequestDays: any[] = [];
    loanRequestForm: FormGroup = this.fb.group({
        requested_loan_amount: ['', Validators.required],
        currency_data: ['', Validators.required],
        loan_percentage: ['', Validators.required],
        loan_duration_days: ['', Validators.required],
        interest_amount: ['', Validators.required],
        total_amount: ['', Validators.required],
        borrow_lend_contract: ['', Validators.required],
        collateral_assets: ['', Validators.required],
        appraisalValue: ['']
    })
    loanRequestSubmitted: boolean = false;
    loanRequestProcessing: boolean = false;
    regulated: boolean = false;
    progressData: any = {};
    nonce: any;
    user: any;
    sellOrderForm = this.fb.group({
        price: ['', [Validators.required, Validators.min(0)]],
        currency: [{}, [Validators.required]],
        currencyId: [{}, [Validators.required]],
    });
    sellOrderFormSubmitted: boolean = false;
    showoverlay: boolean = false;

    filterValues: any = {};
    removeFilterObj: any = {};
    searchKeyword: string = '';
    sort: any = ''
    isClearFilters: boolean = false;
    page: number = 1;
    limit: number = 10;
    routerUrl: string = '';
    nftsCount: number = 0;
    disableInfiniteScroll: boolean = false;
    showSortOptions: boolean = false;
    successredeem: boolean = false;
    totalFilterCount = { category: 0, location: 0, collection: 0 };
    redeemForm!: FormGroup;
    selectedNftId!: string;
    countries: { name: string, dialCode: string, flag: string, regionCode: string }[] = [];
    selectedCountry!: { name: string, flag: string, dialCode: string, regionCode: string };
    searchText = '';
    processedImages: any = [];
    processedImage: any = {};

    constructor(
        private commonService: CommonService,
        private webStorageService: WebStorageService,
        private nftService: NftService,
        private toastr: ToastrService,
        private fb: FormBuilder,
        private loanService: LoanService,
        private lendBorrowContractService: LendBorrowContractService,
        private exchangeContractService: ExchangeContractService,
        private collectionContractService: CollectionContractService,
        private router: Router,
        private exchangeService: ExchangeService,
        private accountService: AccountService,
        private accessControlContractService: AccessControlContractService,
        private transactionService: TransactionService,
        private deliveryService: DeliveryService,
        private countryService: CountryService,
        private socketService: SocketService
    ) {
        this.redeemForm = this.fb.group({
            user_id: ['', [Validators.required]],
            address: ['', [Validators.required]],
            nft_id: ['', [Validators.required]],
            house_number: ['', [Validators.required]],
            street: [''],
            city: ['', Validators.required],
            country: ['', Validators.required],
            postal_code: ['', [Validators.required]],
            phone_number: ['', [Validators.required]],
            quantity: ['', [Validators.required]],
            status: ['', [Validators.required]],
            country_code: ['', [Validators.required]],
            instructions: [''],
        }, { validators: this.phoneNumberValidator });

    }

    ngOnInit(): void {

        this.account = this.webStorageService.getLocalStorage('account') != null ? JSON.parse(this.webStorageService.getLocalStorage('account') || '') : this.account;
        this.user = this.webStorageService.getLocalStorage('user') != null ? JSON.parse(this.webStorageService.getLocalStorage('user') || 'undefined') : this.user;
        this.regulated = JSON.parse(this.webStorageService.getLocalStorage('regulated') || 'true');
        this.filters = JSON.parse(this.webStorageService.getItem('walletFilters') || '[]');

        this.commonService.showGridViewObservable.subscribe((response: boolean) => {
            this.isGridView = response;
        })

        this.routerUrl = this.router.url;
        this.routerUrl === '/my-wallet' ? this.commonService.setTabEmitter({ type: 'assets' }) : this.commonService.setTabEmitter({ type: 'borrow' });
        this.routerUrl === '/my-wallet' && this.loadCountries();

        this.selectedCountry = COUNTRIES.find(country => country.dialCode === '+91')!;
        this.redeemForm.patchValue({
            country_code: this.selectedCountry.dialCode
        })

        if (this.account) {
            if (this.routerUrl !== '/my-wallet') this.getOwnerNftsInactive()
            else {
                this.applyInitialFilter();
                this.getNftTriats();
            }
            this.getCurrencies();
            this.getLoanRequestDays();
        }

        this.commonService.closeModalsObservable.subscribe((response: boolean) => {
            if (response) {
                this.progressModal?.hide();
            }
        })

        this.getMarketPrice();
    }

    /**
       * Get nft triats
       * @function getNftTriats
       */
    getNftTriats() {
        this.nftTraitsLoader = true;
        this.categories = [];
        this.locations = [];
        this.nftService.getNftTriats().subscribe({
            next: (response: any) => {
                this.filterCategory = [];
                // set categories
                let categories = response.data.find((item: any) => item.attribute === "Category").value;
                this.totalFilterCount.category = categories.length;

                // retain categories checked states
                let categoryFilters = this.filters.filter((item) => item.type === 'category');
                categories.map((item: any) => {
                    let exists = categoryFilters.length > 0 ? categoryFilters.some((filter: any) => filter.value === item) : true;
                    this.categories.push({ name: item, checked: exists });

                    if (exists) this.filterCategory.push(item);
                    if (categoryFilters.length === 0) {
                        this.filters.push({ type: 'category', value: item });
                    }
                })

                this.filterLocation = [];
                // set locations
                let locations = response.data.find((item: any) => item.attribute === "Location").value;
                this.totalFilterCount.location = locations.length;

                // retain locations checked states
                let locationFilters = this.filters.filter((item) => item.type === 'location');
                locations.map((item: any) => {
                    let exists = locationFilters.length > 0 ? locationFilters.some((filter: any) => filter.value === item) : true;
                    this.locations.push({ name: item, checked: exists });

                    if (exists) this.filterLocation.push(item);
                    if (locationFilters.length === 0) {
                        this.filters.push({ type: 'location', value: item });
                    }
                })

                // get collections based on category and location
                this.getCollectionsByCategoryLocation()
            },
            error: (error: any) => {
                this.nftTraitsLoader = false;
                this.toastr.error(error?.data?.message || "Something went wrong, try again later.");
            }
        })
    }

    /**
     * Get collections based on category and location
     * @function getCollectionsByCategoryLocation
     */
    getCollectionsByCategoryLocation() {
        let existingCollections = this.collections;
        this.collections = [];
        this.collectionLoader = true;
        this.nftService.getCollections(this.filterCategory, this.filterLocation).subscribe({
            next: (response: any) => {
                this.filterCollection = [];
                let collections = response.data;
                this.totalFilterCount.collection = collections.length;

                // Retain collections checked states
                let collectionFilters = this.filters.filter((item) => item.type === 'collection');
                this.filters = this.filters.filter((item) => item.type !== 'collection');
                collections.map((item: any) => {
                    let checked;
                    if (existingCollections.length > 0) {
                        let collection = existingCollections.find((existingCollection) => existingCollection.name === item.name);
                        checked = collection ? collection.checked : true;
                    } else if (collectionFilters.length > 0) {
                        let collection = collectionFilters.find((filter) => filter.value === item.name);
                        checked = collection ? true : false;
                    } else checked = true;
                    this.collections.push({ ...item, checked });

                    if (checked) this.filterCollection.push(item.name);
                    this.filters.push({ type: 'collection', value: item.name });
                })

                // get nfts based on filters
                this.getOwnerNfts();
            }
        })
    }

    /**
     * @function filterEvent
     */
    filterEvent({ value, checked, action, type }: any) {
        this.loader = true;
        this.showFilter = false;
        if (checked || action === 'reset' || action === 'only' || type === 'price' || type === 'appraisal') {
            this.applyFilter({ value, action }, type)
        } else {
            this.removeFilter({ value }, type);
        }
    }

    /**
     * @function applyFilter
     * @param {object} event
     * @param {string} type
     */
    async applyFilter({ value, action }: any, type: string) {
        this.page = 1;
        if (type === 'category') {
            await this.applyCategoryFilter({ value, action });
        }
        if (type === 'location') {
            await this.applyLocationFilter({ value, action });
        }
        if (type === 'collection') {
            await this.applyCollectionFilter({ value, action });
        }
        if (type === 'sale') {
            await this.applySaleFilter({ value, action });
        }
        if (type === 'collateral') {
            await this.applyCollateralFilter({ value, action });
        }
        if (type === 'price') {
            await this.applyPriceFilter({ value, action });
        }
        if (type === 'appraisal') {
            await this.applyAppraisalFilter({ value, action });
        }
        if (action === 'clearAll') {
            await this.applyClearAllFilter();
        }
        if (type && type !== 'category') this.getOwnerNfts();
    }

    applyInitialFilter() {
        if (this.filters.length > 0) {
            // retain existing sale filter
            let filterItem = this.filters.find((item) => item.type === 'sale');
            if (filterItem && Object.keys(filterItem).length > 0) this.applySaleFilter({ value: filterItem?.value });

            // retain existing collateral filter
            let collateralFilterItem = this.filters.find((item) => item.type === 'collateral');
            if (collateralFilterItem && Object.keys(collateralFilterItem).length > 0) this.applyCollateralFilter({ value: collateralFilterItem?.value });

            // retain price filter
            let priceFilter = this.filters.find((item) => item.type === 'price');
            if (priceFilter && Object.keys(priceFilter).length > 0) {
                this.filterPrice = [priceFilter.value];
                this.priceSlider = { ...this.priceSlider, floor: priceFilter.value?.minValue, ceil: priceFilter.value?.maxValue, minValue: priceFilter.value?.minValue, maxValue: priceFilter.value?.maxValue }
            }

            // retain appraisal filter
            let appraisalFilter = this.filters.find((item) => item.type === 'appraisal');
            if (appraisalFilter && Object.keys(appraisalFilter).length > 0) {
                this.filterAppraisal = [appraisalFilter.value];
                this.appraisalSlider = { ...this.appraisalSlider, floor: appraisalFilter.value?.minValue, ceil: appraisalFilter.value?.maxValue, minValue: appraisalFilter.value?.minValue, maxValue: appraisalFilter.value?.maxValue }
            }
        }
    }

    /**
     * @function applyCategoryFilter
     * @param {object} event
     */
    applyCategoryFilter({ value, action }: any) {
        this.partition = '';
        this.filters = this.filters.filter(item => item.type !== 'partition');
        switch (action) {
            case 'reset':
                this.filterCategory = [];
                this.filters = this.filters.filter(item => item.type !== 'category');
                this.categories.map((category: any) => {
                    category.checked = true;
                    this.filterCategory.push(category.name);
                    this.filters.push({ type: 'category', value: category.name });
                })
                break;

            case 'only':
                this.filters = this.filters.filter(item => item.type !== 'category');
                this.filters.push({ type: 'category', value })
                this.filterCategory = [value];
                this.categories.map((category: any) => { category.checked = category.name === value });
                break;

            default:
                // add category to filter category array and filters chip
                this.filterCategory.push(value);
                this.filters.push({ type: 'category', value });

                // check in categories array
                let categoryIndex = this.categories.findIndex((item) => item.name === value);
                this.categories[categoryIndex].checked = true;
                break;
        }
        this.getCollectionsByCategoryLocation();
    }

    /**
     * @function applyLocationFilter
     * @param {object} event
     */
    applyLocationFilter({ value, action }: any) {
        switch (action) {
            case 'reset':
                this.filterLocation = [];
                this.filters = this.filters.filter(item => item.type !== 'location');
                this.locations.map((location: any) => {
                    location.checked = true;
                    this.filterLocation.push(location.name);
                    this.filters.push({ type: 'location', value: location.name });
                })
                break;

            case 'only':
                this.filters = this.filters.filter(item => item.type !== 'location');
                this.filters.push({ type: 'location', value })
                this.filterLocation = [value];
                this.locations.map((location: any) => { location.checked = location.name === value });
                break;

            default:
                // add location to filter location array and filters chip
                this.filterLocation.push(value);
                this.filters.push({ type: 'location', value });

                // check in locations array
                let locationIndex = this.locations.findIndex((item) => item.name === value);
                this.locations[locationIndex].checked = true;
                break;
        }
    }

    /**
     * @function applyCollectionFilter
     * @param {object} event
     */
    applyCollectionFilter({ value, action }: any) {
        switch (action) {
            case 'reset':
                this.filterCollection = [];
                this.filters = this.filters.filter(item => item.type !== 'collection');
                this.collections.map((collection: any) => {
                    collection.checked = true;
                    this.filterCollection.push(collection.name);
                    this.filters.push({ type: 'collection', value: collection.name });
                })
                break;

            case 'only':
                this.filters = this.filters.filter(item => item.type !== 'collection');
                this.filters.push({ type: 'collection', value })
                this.filterCollection = [value];
                this.collections.map((collection: any) => { collection.checked = collection.name === value });
                break;

            default:
                // add collection to filter collection array and filters chip
                this.filterCollection.push(value);
                this.filters.push({ type: 'collection', value });

                // check in collections array
                let collectionIndex = this.collections.findIndex((item) => item.name === value);
                this.collections[collectionIndex].checked = true;
                break;
        }
    }

    /**
     * @function applySaleFilter
     * @param {object} event
     */
    applySaleFilter({ value, action }: any) {
        // show or hide price filter and sort
        this.isInSale = value === 'yes' ? true : false;
        // remove collateral filter
        this.removeCollateralFilter();

        this.filters = this.filters.filter(item => item.type !== 'sale');
        switch (action) {
            case 'reset':
                this.filterSale.map(item => item.checked = false)
                break;

            default:
                let { name } = this.saleOption.find((item) => item.value === value)
                this.filterSale.map(item => item.checked = item.value === value)
                this.filters.push({ type: 'sale', value, name })
                break;
        }
    }

    /**
     * @function applySaleFilter
     * @param {object} event
     */
    applyCollateralFilter({ value, action }: any) {
        // remove sale and price filter
        this.removeSaleFilter();
        this.removePriceFilter();
        // remove price sort
        this.filterPrice = []
        let priceSort = this.filters.filter((filter) => filter.type === 'sort' && filter.name.includes("By Price"));
        if (priceSort.length > 0) this.removeSort()
        this.isInSale = false

        this.filters = this.filters.filter(item => item.type !== 'collateral');
        switch (action) {
            case 'reset':
                // deep copy of objects to avoid memory sharing
                this.filterCollateral = JSON.parse(JSON.stringify(this.collateralOption));
                break;

            default:
                let { name } = this.collateralOption.find((item) => item.value === value)
                this.filterCollateral.map(item => item.checked = item.value === value)
                this.filters.push({ type: 'collateral', value, name })
                break;
        }
    }

    applyPriceFilter({ value, action }: any) {
        this.filters = this.filters.filter(item => item.type !== 'price');
        switch (action) {
            case 'reset':
                this.filterPrice = [];
                break;

            default:
                let { minValue, maxValue } = value;
                if (this.filterPrice[0]?.minValue !== minValue || this.filterPrice[0]?.maxValue !== maxValue) {
                    this.filterPrice = [{ minValue, maxValue }];
                    if (minValue != maxValue) this.filters.push({ type: 'price', value: { minValue, maxValue }, name: `${minValue} - ${maxValue}` });
                }
                break;
        }
    }

    applyAppraisalFilter({ value, action }: any) {
        let { minValue, maxValue } = value;
        this.filters = this.filters.filter(item => item.type !== 'appraisal');
        switch (action) {
            case 'reset':
                this.filterAppraisal = [];
                break;

            default:
                if (this.filterAppraisal?.[0]?.minValue !== minValue || this.filterAppraisal?.[0]?.maxValue !== maxValue) {
                    this.filterAppraisal = [{ minValue, maxValue }];
                    if (minValue != maxValue) this.filters.push({ type: 'appraisal', value: { minValue, maxValue }, name: `${minValue} - ${maxValue}` });
                }
                break;
        }
    }

    /**
     * @function applyClearAllFilter
     */
    applyClearAllFilter() {
        this.filters = [];
        this.filterCollection = [];
        // clear category filters
        this.filterCategory = this.categories.map((category) => {
            category.checked = true;
            return category.name;
        });

        // clear location filters
        this.filterLocation = this.locations.map((location) => {
            location.checked = true;
            return location.name;
        });

        // clear sale filters
        this.filterSale = JSON.parse(JSON.stringify(this.saleOption));

        // clear collateral filters
        // deep copy of objects to avoid memory sharing
        this.filterCollateral = JSON.parse(JSON.stringify(this.collateralOption));

        // clear collection filters
        this.collections.map((collection) => collection.checked = true);
        this.getCollectionsByCategoryLocation();
    }

    /**
         * @function removeFilter
         */
    async removeFilter({ value }: any, type: string) {
        this.page = 1;

        if (type === 'category') this.removeCategoryFilter({ value })
        if (type === 'location') this.removeLocationFilter({ value })
        if (type === 'collection') this.removeCollectionFilter({ value })
        if (type === 'sale') this.removeSaleFilter();
        if (type === 'collateral') this.removeCollateralFilter();
        if (type === 'price') this.removePriceFilter();
        if (type === 'appraisal') this.removeAppraisalFilter();
        if (type === 'sort') this.removeSort();
        if (type === 'partition') this.removeCategoryPartition();

        if (type && type !== 'category') this.getOwnerNfts();
    }

    /**
    * @function removeCategoryFilter
    * @param {object} event
    */
    removeCategoryFilter({ value }: any) {
        // remove from filter category array
        this.filterCategory = this.filterCategory.filter(item => item !== value);

        // remove from filters chip
        const filterIndex = this.filters.findIndex((filter) => (filter.type === 'category' && filter.value === value));
        if (filterIndex !== -1) this.filters.splice(filterIndex, 1);

        // if all items are unchecked then check back all categories again
        // else uncheck from category array
        if (this.filterCategory.length === 0) {
            this.filterCategory = this.categories.map((item) => {
                item.checked = true;
                return item.name
            })
        }
        else {
            let categoryIndex = this.categories.findIndex((item) => item.name === value);
            this.categories[categoryIndex].checked = false;
        }

        this.getCollectionsByCategoryLocation();
    }

    /**
    * @function removeLocationFilter
    * @param {object} event
    */
    removeLocationFilter({ value }: any) {
        // remove from filter location array
        this.filterLocation = this.filterLocation.filter(item => item !== value);

        // remove from filters chip
        const filterIndex = this.filters.findIndex((filter) => (filter.type === 'location' && filter.value === value));
        if (filterIndex !== -1) this.filters.splice(filterIndex, 1);

        // if all items are unchecked then check back all categories again
        // else uncheck from category array
        if (this.filterLocation.length === 0) {
            this.filterLocation = this.locations.map((item) => {
                item.checked = true;
                return item.name
            })
        }
        else {
            let locationIndex = this.locations.findIndex((item) => item.name === value);
            this.locations[locationIndex].checked = false;
        }
    }

    /**
    * @function removeCollectionFilter
    * @param {object} event
    */
    removeCollectionFilter({ value }: any) {
        // remove from filter collection array
        this.filterCollection = this.filterCollection.filter(item => item !== value);

        // remove from filters chip
        const filterIndex = this.filters.findIndex((filter) => (filter.type === 'collection' && filter.value === value));
        if (filterIndex !== -1) this.filters.splice(filterIndex, 1);

        // if all items are unchecked then check back all categories again
        // else uncheck from category array
        if (this.filterCollection.length === 0) {
            this.filterCollection = this.collections.map((item) => {
                item.checked = true;
                return item.name
            })
        }
        else {
            let collectionIndex = this.collections.findIndex((item) => item.name === value);
            this.collections[collectionIndex].checked = false;
        }
    }

    /**
    * @function removeSaleFilter
    */
    removeSaleFilter() {
        this.filters = this.filters.filter(item => item.type !== 'sale');
        let sale = this.filterSale.find(item => item.checked);
        if (sale) sale.checked = false;
    }

    /**
    * @function removeCollateralFilter
    */
    removeCollateralFilter() {
        this.filters = this.filters.filter(item => item.type !== 'collateral');
        let collateral = this.filterCollateral.find(item => item.checked);
        if (collateral) collateral.checked = false;
    }

    /**
    * @function removePriceFilter
    */
    removePriceFilter() {
        this.filters = this.filters.filter(item => item.type !== 'price');
        this.filterPrice = [];
    }

    /**
    * @function removeAppraisalFilter
    */
    removeAppraisalFilter() {
        this.filters = this.filters.filter(item => item.type !== 'appraisal');
        this.filterAppraisal = [];
    }

    /**
    * @function removeSort
    */
    removeSort() {
        this.sort = '';
        this.filters = this.filters.filter((filter) => filter.type !== 'sort');
    }

    /**
    * @function removeCategoryPartition
    * @param {object} event
    */
    removeCategoryPartition() {
        this.partition = '';
        this.page = 1;
        this.filters = this.filters.filter((filter) => filter.type !== 'partition');
    }

    /**
         * @function clearFilter
         * @param {object} filter
         */
    clearFilter(filter: any) {
        let { type, value } = filter;
        this.removeFilter({ value }, type);
    }

    /**
    * @function clearFilters
    */
    clearFilters() {
        this.sort = '';
        this.applyFilter({ action: 'clearAll' }, '');
    }

    getMarketPrice() {
        this.socketService.getMarketPrice().subscribe(async (marketPrice: any) => {
            if (marketPrice > 0) {
                let goldNfts = this.nfts.filter((item: any) => item?.collections?.category?.toLowerCase() === 'gold');
                goldNfts.map(async (nft: any) => {
                    if (nft.lazy_mint) {
                        let markupFee = nft?.attributes?.find((data: any) => data.key.toLowerCase() == 'markup fee');
                        let size = nft?.attributes?.find((data: any) => data.key.toLowerCase() == 'size');
                        let { price, priceWithFee }: any = await this.commonService.calculateGoldValue(size.value, markupFee.value, marketPrice);
                        nft.marketPrice = price;
                        if (nft.sale_details) nft.sale_details.exchange_price = priceWithFee;
                    }
                })
            }
        });
    }

    phoneNumberValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
        let phoneNumber = group.get('phone_number')?.value?.trim();
        if (phoneNumber?.length > 0) {
            let validNumber = false;
            let phoneNumberUtil = PhoneNumberUtil.getInstance();
            const parsedNumber = phoneNumberUtil.parseAndKeepRawInput(phoneNumber, this.selectedCountry.regionCode);
            validNumber = phoneNumberUtil.isValidNumberForRegion(parsedNumber, this.selectedCountry.regionCode);
            return validNumber ? null : { 'wrongNumber': true };
        }
        return null;
    };

    get f() { return this.redeemForm.controls as { [key: string]: AbstractControl }; }

    /**
     * on submitting redeem form
     */
    onSubmit(): void {
        this.redeemFormLoader = true;
        this.redeemForm.patchValue({
            user_id: this.user?._id,
            address: this.user?.wallet_address,
            status: 0,
            quantity: 1,
            nft_id: this.selectedNftId
        })
        if (this.redeemForm.invalid) {
            this.redeemFormLoader = false;
            this.toastr.error('Please fill all the required fields.');
            this.redeemForm.markAllAsTouched();
            return
        }
        this.deliveryService.createDeliveryRequest(this.redeemForm.value).subscribe({
            next: (response: IApiResponse) => {
                this.redeemFormLoader = false;
                this.toastr.success(response.message);
                this.closeModal();
                this.page = 1;
                this.getOwnerNfts();
            },
            error: (error: HttpErrorResponse) => {
                this.redeemFormLoader = false;
                this.handleError(error);
            }
        })

    }

    closeModal(): void {
        this.selectedNftId = '';
        setTimeout(() => {
            this.redeemModal?.hide();
            this.redeemForm.reset();
        }, 100);
        this.selectedCountry = COUNTRIES.find(country => country.dialCode === '+91')!;
        this.searchText = '';

    }

    /**
     * open redeem modal
     */
    openRedeemModal() {
        this.redeemModal?.show();
    }



    closeOveraly() {
        this.showoverlay = false;
        this.commonService.setOverlay(false)
    }
    getOwnerNfts() {
        if (this.page != null) {
            this.webStorageService.setItem('walletFilters', JSON.stringify(this.filters));
            this.page === 1 ? this.loader = true : this.scrollLoader = true;
            this.disableInfiniteScroll = true;
            this.nftService.getHoldingNftsByOwner(this.account?.walletAddress, this.page, this.limit, this.searchKeyword,
                this.filterCollection,
                this.filterLocation,
                this.filterCategory,
                this.filterSale.some((item) => item.checked) ? this.filterSale.find((item) => item.checked).value : "",
                this.filterCollateral.some((item) => item.checked) ? this.filterCollateral.find((item) => item.checked).value : "",
                this.filterPrice.length > 0 ? this.filterPrice[0].minValue : 0,
                this.filterPrice.length > 0 ? this.filterPrice[0].maxValue : 0,
                this.filterAppraisal.length > 0 ? this.filterAppraisal[0].minValue : 0,
                this.filterAppraisal.length > 0 ? this.filterAppraisal[0].maxValue : 0,
                this.sort
            ).subscribe({
                next: async (response: any) => {
                    this.setNfts(response);
                },
                error: (error: any) => {
                    this.loader = false;
                    this.scrollLoader = false;
                    this.disableInfiniteScroll = false;
                    this.handleError(error);
                }
            })
        }
    }

    /**
     * Set nfts
     * @function setNfts
     */
    async setNfts(response: any) {
        let priceFilter = this.filters.find(item => item.type === 'price');
        this.priceSlider = {
            ...this.priceSlider,
            floor: Math.ceil(response.data?.minimum_sale_price) || 1,
            ceil: Math.ceil(response.data?.maximum_sale_price) || 1,
            minValue: priceFilter?.value?.minValue || 0,
            maxValue: priceFilter?.value?.maxValue || 0,
            loader: false
        }
        let appraisalFilter = this.filters.find(item => item.type === 'appraisal');
        this.appraisalSlider = {
            ...this.appraisalSlider,
            floor: Math.ceil(response.data?.minimum_appraisal_value) || 1,
            ceil: Math.ceil(response.data?.maximum_appraisal_value) || 1,
            minValue: appraisalFilter?.value?.minValue || 0,
            maxValue: appraisalFilter?.value?.maxValue || 0,
            loader: false
        }
        this.nftsCount = response.data?.total_item_counts;

        if (response.data?.nfts?.length > 0) {
            if (!this.page || this.page === 1) this.nfts = [];
            this.nfts.push(...response.data.nfts);
            this.page = response?.data.next_page;
            this.disableInfiniteScroll = response?.data?.total_pages > 1 ? false : true;
            this.nftsCount = response.data.total_NFTs;

            let goldPrice: number = 0;
            for (const nft of this?.nfts) {
                if (nft.on_loan) {
                    nft.defaulted = nft.loan_details?.status === 1 && !this.isLiveLoan(nft.loan_details)
                }
                nft.category = (nft.attributes.find((attr: any) => attr.key.toLowerCase() === 'category')).value?.toLowerCase()
                nft.fileType = nft.preview_image ? nft?.preview_image.split('.')[nft?.preview_image.split('.').length - 1] : nft?.primary_media.split('.')[nft?.primary_media.split('.').length - 1]

                if (nft.category === 'gold') {
                    let markupFee = nft?.attributes?.find((data: any) => data.key.toLowerCase() == 'markup fee');
                    let size = nft?.attributes?.find((data: any) => data.key.toLowerCase() == 'size');
                    if (goldPrice === 0) {
                        let response: any = await this.commonService.getGoldPrice();
                        goldPrice = response.data.gold_value;
                    }
                    let { price, priceWithFee }: any = await this.commonService.calculateGoldValue(size.value, markupFee.value, goldPrice);
                    nft.marketPrice = price;
                    if (nft.sale_details) nft.sale_details.exchange_price = priceWithFee;
                }

                if (nft.lazy_mint) {
                    if (nft.on_sale) nft.sale_details.price = await this.setExchangePrice(nft, nft.sale_details.exchange_price);
                }
            }

        } else {
            this.nfts = [];
            this.page = 1;
            this.nftsCount = 0;
        }
        this.loader = false;
        this.scrollLoader = false;
    }

    isLiveLoan(loan: any) {
        let LOAN_IN_DAYS = this.account.chainId ? (environment as any)[this.account.chainId].LOAN_IN_DAYS : (environment as any)['DEFAULT_NETWORK'].LOAN_IN_DAYS;
        if (environment.ENVNAME === 'DEVELOPMENT') loan.end_date = moment(loan.start_date).clone().add(loan.duration, LOAN_IN_DAYS ? 'days' : 'hours').toISOString()
        return moment(moment().format("YYYY-MM-DD, hh:mm a"), 'YYYY-MM-DD, hh:mm a').isBefore(moment(moment(loan?.end_date).format("YYYY-MM-DD, hh:mm a"), 'YYYY-MM-DD, hh:mm a'))
    }

    getOwnerNftsInactive() {
        if (this.page != null) {
            this.disableInfiniteScroll = true;
            this.nftService.getInactiveNftsByOwner(this.account?.walletAddress).subscribe({
                next: (response: any) => {
                    if (this.page === 1) this.nfts = [];
                    response.data.nfts ? this.nfts.push(...response.data.nfts) : this.nfts = [];
                    this.nfts.map((nft) => nft.fileType = nft.preview_image ? nft?.preview_image.split('.')[nft?.preview_image.split('.').length - 1] : nft?.primary_media.split('.')[nft?.primary_media.split('.').length - 1]);
                    this.page = response?.data.next_page;
                    this.loader = false;
                    this.disableInfiniteScroll = false;
                    this.setTooltip(this.nfts);
                },
                error: (error: any) => {
                    this.loader = false;
                    this.handleError(error);
                }
            })
        }
    }

    private loadCountries() {
        this.countryService.getCountries().subscribe({
            next: (response) => {
                this.countries = response;
            }
        }
        );
    }

    onScroll() {
        if (this.routerUrl === '/my-wallet') this.getOwnerNfts();
        else this.getOwnerNftsInactive();
    }

    getCurrencies() {
        this.commonService.getCurrencies().subscribe({
            next: async (response: any) => {
                this.currencies = response.data.filter((currency: any) => !currency.is_deleted);
                this.sellOrderForm.patchValue({ currency:this.currencies[0] , currencyId: this.currencies[0]._id });
            },
            error: (error) => {
                this.handleError(error);
            }
        })
    }

    getLoanRequestDays() {
        this.loanService.getLoanRequestDays().subscribe({
            next: (response: any) => {
                this.loanRequestDays = response.data;
            },
            error: (error) => {
                this.handleError(error);
            }
        })
    }

    showLoanRequest(showLoanForm: boolean) {
        this.isCardClicked = true;
        this.isLoanRequest = showLoanForm;
        this.showFilter = false;
    }

    closeSetLoan() {
        this.isCardClicked = false;
        this.selectedNfts = [];
        this.loanRequestForm.reset();
        this.sellOrderForm.reset({
            currency: this.currencies[0],
            currencyId: this.currencies[0]._id
        });
    }

    onChecked(event: any, data: any, type: string) {
        if (this.user) {
            if (type === 'borrow') this.onBorrowLoan(event, data);
            else this.onSellOrder(event, data);
        } else {
            this.setRoute();
            this.router.navigate(['/sign-up'])
        }
    }

    async onBorrowLoan(event: any, data: any) {
        const index = this.selectedNfts.findIndex((nfts) => (nfts._id === data._id));
        if (index !== -1) this.selectedNfts.splice(index, 1);
        if (event.target.checked || event.target.checked === undefined) this.selectedNfts.push(data);

        if (this.selectedNfts.length === 0) this.closeSetLoan();
        else {
            let appraisalValue = 0;
            for (const [index, asset] of this.selectedNfts.entries()) {
                let appraisal = asset.attributes.filter((attribute: any) => attribute.key.toLowerCase() === 'appraisal value');
                if (appraisal.length > 0) {
                    let val = await this.setExchangePrice(asset, appraisal[0].value);
                    appraisalValue += val
                    if (index === this.selectedNfts.length - 1) this.loanRequestForm.patchValue({ appraisalValue: appraisalValue > 0 ? `${Math.ceil(appraisalValue)} USD` : '' })
                } else {
                    this.loanRequestForm.patchValue({ appraisalValue })
                }
            };
            this.loanRequestForm.patchValue({ currency_data: this.currencies[0] })
        }
    }

    setExchangePrice = async (nft: any, item: any) => {
        let index = this.currencyConversions.findIndex((item) => item.address === nft.currency?.address);
        let value: number;
        if (index >= 0) {
            value = this.currencyConversions[index].value === 0 ? Math.ceil(item) : Math.ceil(item / this.currencyConversions[index].value);
        } else {
            let usdPrice = 0;
            try {
                let response: any = await this.commonService.getTokenPrice(nft.currency?.address);
                usdPrice = response[nft.currency?.address.toLowerCase()]?.usd || 1;
            } catch (error) {
                let currency = this.currencies.find((currency) => currency.address.toLowerCase() === nft.currency?.address.toLowerCase());
                usdPrice = currency?.usd_value || 1
            }
            this.currencyConversions.push({ address: nft.currency?.address, value: usdPrice });
            value = Math.ceil(item * usdPrice);
        }
        return value;
    }

    onSellOrder(event: any, data: any) {
        const index = this.selectedNfts.findIndex((nfts) => (nfts._id === data._id));
        if (index !== -1) this.selectedNfts.splice(index, 1);

        if (event.target.checked || event.target.checked === undefined) {
            this.selectedNfts.push(data);
            this.sellOrderForm.patchValue({ currency: this.currencies[0],currencyId: this.currencies[0]._id })
        }
        if (this.selectedNfts.length === 0) this.closeSetLoan();
    }

    setCurrency(event: any, type: string) {
        let currency = this.currencies.find((item: any) => item._id === event.target.value);
        type === 'sell' ? this.sellOrderForm.patchValue({ currency }) : this.loanRequestForm.patchValue({ currency_data: currency })
    }

    calculateInterest() {
        let { requested_loan_amount, loan_duration_days, loan_percentage } = this.loanRequestForm.value;
        let divisor = (environment as any)[this.account.chainId].LOAN_IN_DAYS ? (365 * 100) : (365 * 24 * 100)
        let interest_amount = (requested_loan_amount * loan_duration_days * loan_percentage) / divisor;
        let total_amount = Number(requested_loan_amount) + Number(interest_amount);
        this.loanRequestForm.patchValue({ interest_amount: interest_amount.toFixed(3), total_amount: total_amount.toFixed(3) })
    }

    decimalFilter(event: any) {
        const reg = /^\d*(\.\d{0,4})?$/;
        let input = event.target.value + String.fromCharCode(event.charCode);
        if (!reg.test(input)) {
            event.preventDefault();
        }
    }

    async submitLoanRequest() {
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

        this.loanRequestSubmitted = true;
        this.loanRequestProcessing = true;
        this.loanRequestForm.patchValue({ borrow_lend_contract: (environment as any)[this.account?.chainId]?.BORROW_LEND_CONTRACT, collateral_assets: this.selectedNfts })
        if (this.loanRequestForm.valid) {
            this.loanRequest();
        } else {
            this.loanRequestProcessing = false;
            this.toastr.error('Please fill all the required fields.');
        }
    }

    async loanRequest() {
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
        let isFirstTransactionEmitted = false;  // Flag to track the first transaction emission

        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            if (isFirstTransactionEmitted) {
                event.preventDefault();
                // this.progressModal?.hide();
                // this.confirmationModal?.show();
            }
        };
        // const handlePopState = (event:PopStateEvent) => {
        //   if (isFirstTransactionEmitted) {
        //     this.progressModal?.hide();
        //     this.confirmationModal?.show();
        //     history.pushState(null, '', window.location.href);
        //   }
        // };

        window.addEventListener('beforeunload', handleBeforeUnload);
        // window.addEventListener('popstate', handlePopState);

        try {
            let isBlocked = await this.accessControlContractService.isBlocked(this.account);
            if (isBlocked) return this.toastr.error("User blocked. Please contact the admin regarding your status.");

            this.progressData = {
                title: "Processing.",
                currentStep: 0,
                steps: [
                    {
                        title: "Approve item.",
                        status: 1
                    },
                    {
                        title: "Create loan request.",
                        status: 0
                    }
                ],
                failed: false,
                successTitle: "Loan requested.",
                image: this.processImages()
            }
            this.progressModal?.show();

            // Step 1 - approve collections
            let nfts: any[] = [];

            // group nfts based on collection
            const groupedNfts = this.selectedNfts.reduce((group, nft) => {
                const address = nft.collections.collection_address;
                (group[address] = group[address] || []).push(nft);
                nfts.push({ collectionAddress: nft.collections.collection_address, tokenId: nft.token_id })
                return group;
            }, {});

            const resultArray: any[] = Object.values(groupedNfts);

            for (let index = 0; index <= resultArray.length - 1; index++) {
                let value: any[] = resultArray[index];
                const nftIds = value.map((item: any) => item._id);
                // Approve all nfts operation in db
                let txData: any = {
                    from: this.account.walletAddress,
                    to: value[0].collections.collection_address,
                    from_id: this.user._id,
                    transaction_name: 'Approve item',
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

                // if page refreshed or back button is clicked
                // Set the flag to true after the first transaction emission
                isFirstTransactionEmitted = true;

                // approve nft contract interaction
                let args = { functionName: 'setApprovalForAll', args: [(environment as any)[this.account.chainId].BORROW_LEND_CONTRACT, true], abiType: 'erc721' }
                let { approvalAbi, requiredGas } = await this.lendBorrowContractService.setApprovalForAllNFTsAbi(this.account, value[0].collections.collection_address, args);
                tx = await this.commonService.sendTransaction(this.account, value[0].collections.collection_address, approvalAbi, requiredGas, args);
                // update approve all nfts operation in db
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

                if (index === resultArray.length - 1) this.createLoanRequest(nfts);
            }

            // Remove the event listener when the process is complete
            window.removeEventListener('beforeunload', handleBeforeUnload);
            // window.removeEventListener('popstate', handlePopState);
        } catch (error: any) {
            this.handleError(error, txResp.data._id);
        }
        window.removeEventListener('beforeunload', handleBeforeUnload);
        // window.removeEventListener  ('popstate', handlePopState);
    }

    async createLoanRequest(nfts: any[]) {
        let txResp: any;
        let tx: any;
        try {
            this.progressData.steps[this.progressData.currentStep].status = 2;
            this.progressData.steps[this.progressData.currentStep + 1].status = 1;
            this.progressData.currentStep = 1;
            const nftIds = this.selectedNfts.map(item => item._id);

            // Create approve all nfts operation in db
            let txData: any = {
                from: this.account.walletAddress,
                to: (environment as any)[this.account?.chainId].BORROW_LEND_CONTRACT,
                from_id: this.user._id,
                transaction_name: 'Create loan request',
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

            // step 2
            await this.getNonce();
            let loanParams = await this.organizeLoan(nfts);
            let args = { functionName: 'createLoan', args: [loanParams], abiType: 'loan' }
            let { createLoanRequestAbi, requiredGas } = await this.lendBorrowContractService.createLoanRequest(this.account, args);
            tx = await this.commonService.sendTransaction(this.account, (environment as any)[this.account?.chainId].BORROW_LEND_CONTRACT, createLoanRequestAbi, requiredGas, args);
            // update approve all nfts operation in db
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

            // Step 2 - Api to write loan request to db
            await this.requestNewLoan();
        } catch (error: any) {
            this.handleError(error, txResp?.data?._id);
        }
    }

    async organizeLoan(nfts: any[]) {
        let { loan_duration_days, loan_percentage, requested_loan_amount, currency_data } = this.loanRequestForm.value;
        let loanParams = await this.lendBorrowContractService.loanParams(
            await getAddress(this.account.walletAddress),
            nfts,
            loan_duration_days,
            currency_data.address,
            requested_loan_amount,
            loan_percentage,
            this.nonce,
            this.account?.networkId
        );
        return loanParams;
    }

    async getNonce() {
        const nonce: any = await this.commonService.getNonce();
        this.nonce = nonce.data.nonce;
    }

    async getExchangeNonce() {
        const nonce: any = await this.commonService.getNonce();
        return nonce.data.exchange_nonce;
    }

    async requestNewLoan() {
        let { loan_duration_days, loan_percentage, requested_loan_amount, interest_amount, total_amount, currency_data } = this.loanRequestForm.value;
        const params = {
            borrower_id: this.user?._id,
            requested_loan_amount,
            loan_percentage,
            loan_duration_days,
            interest_amount,
            total_amount,
            borrow_lend_contract: (environment as any)[this.account.chainId].BORROW_LEND_CONTRACT,
            collateral_assets: this.selectedNfts.map(item => item._id),
            currency_data: currency_data._id,
            nonce: this.nonce
        }

        this.loanService.requestLoan(params).subscribe({
            next: (res) => {
                this.progressData.steps[this.progressData.currentStep].status = 2;
                this.progressData.currentStep = 2;
                this.toastr.success("Loan request created successfully.")
                this.isCardClicked = false;
                this.loanRequestForm.reset();
                this.selectedNfts = [];
                this.router.navigate(['/borrow']);
            },
            error: (error) => {
                this.handleError(error);
            }
        })
    }

    getAttribute(attributes: any[], key: string) {
        let attribute = attributes.find((item) => item.key === key);
        return attribute ? attribute.value : '-';
    }

    async submitSellOrder() {
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

        let txResp: any;
        let tx: any;

        try {
            this.sellOrderFormSubmitted = true;
            if (this.sellOrderForm.valid) {
                let isBlocked = await this.accessControlContractService.isBlocked(this.account);
                if (isBlocked) return this.toastr.error("User blocked. Please contact the admin regarding your status.");

                this.progressData = {
                    title: "Processing.",
                    currentStep: 0,
                    steps: [
                        {
                            title: "Approve item.",
                            status: 1
                        },
                        {
                            title: "Create sell order.",
                            status: 0
                        }
                    ],
                    failed: false,
                    successTitle: "Sell order created.",
                    image: [this.processImage()]
                }
                this.progressModal?.show();
                let nft = this.selectedNfts[0];
                let nonce = await this.getExchangeNonce() + 1;

                if (!this.selectedNfts[0].lazy_mint) {
                    // Step 1 - approve nft
                    let approvedAddess: any = await this.collectionContractService.getApproved(this.account?.networkId, nft.collections.collection_address, nft.token_id);
                    if (approvedAddess !== await getAddress((environment as any)[this.account.chainId]['EXCHANGE_CONTRACT'])) {
                        // create approve nft tx
                        let txData: any = {
                            from: this.account.walletAddress,
                            to: nft.collections.collection_address,
                            from_id: this.user._id,
                            transaction_name: 'Approve item',
                            nft_id: nft._id,
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


                        // approve contract call
                        let args = { functionName: 'approve', args: [(environment as any)[this.account.chainId]['EXCHANGE_CONTRACT'], nft.token_id], abiType: 'erc721' };
                        let { approveAbi, requiredGas } = await this.collectionContractService.approveNft(this.account, nft.collections.collection_address, args);
                        tx = await this.commonService.sendTransaction(this.account, nft.collections.collection_address, approveAbi, requiredGas, args);

                        // update approve nft tx
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

                    }
                    // step 1 status update
                    this.progressData.steps[this.progressData.currentStep].status = 2;
                    this.progressData.steps[this.progressData.currentStep + 1].status = 1;
                    this.progressData.currentStep = 1;

                    // Step 2 - create sell order
                    // create sell order tx
                    let txData: any = {
                        from: this.account.walletAddress,
                        to: (environment as any)[this.account.chainId]['EXCHANGE_CONTRACT'],
                        from_id: this.user._id,
                        transaction_name: 'Create order',
                        nft_id: nft._id,
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

                    // create order contract call
                    let nonce = await this.getExchangeNonce() + 1;
                    let order = await this.exchangeContractService.organizeSellOrder(this.account?.networkId, this.account?.walletAddress, nft.collections.collection_address, nft.token_id, this.sellOrderForm.value.currency?.['address'] || "", this.sellOrderForm.value.price || "", nonce);
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
                    transacationData = {
                        status: true,
                        count: 1
                    }
                    this.commonService.transactionEmitter(transacationData);
                }

                // Step 2 - Api to write sell order to db
                await this.storeSellOrder(nft._id, nonce);

            } else this.toastr.error("All fields are required.");
        } catch (error: any) {
            this.sellOrderFormSubmitted = false;
            this.handleError(error, txResp.data._id);
            this.sellOrderForm.patchValue({ price: '',currency: this.currencies[0], currencyId: this.currencies[0]._id });
        }
    }

    storeSellOrder(nft: string, nonce: number) {
        let { price, currency }: any = this.sellOrderForm.value;
        const params = {
            price,
            currency: currency?._id,
            nft,
            nonce,
            seller: this.user._id,
            status: 0
        }

        this.exchangeService.exchangeOrder(params).subscribe({
            next: (response: any) => {
                this.progressData.steps[this.progressData.currentStep].status = 2;
                this.progressData.currentStep = 2;
                this.toastr.success("Sell order created successfully.")
                this.isCardClicked = false;
                this.sellOrderFormSubmitted = false;
                this.sellOrderForm.patchValue({ price: '',currency: this.currencies[0], currencyId: this.currencies[0]._id });
                this.selectedNfts = [];
                this.page = 1;
                this.getOwnerNfts();
            },
            error: (error: any) => {
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
        if (error?.shortMessage?.includes('reverted with the following reason:')) {
            let errorMessage = error?.shortMessage?.split('reverted with the following reason:');
            error.shortMessage = errorMessage[errorMessage.length - 1]
        }
        error = await JSON.stringify(error, null, 2);
        error = await JSON.parse(error);
        this.toastr.error(error?.error?.data?.message || error.shortMessage || "Something went wrong, try again later.");
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

    get sellOrderFormControls() {
        return this.sellOrderForm.controls;
    }

    async connectWallet() {
        await this.accountService.enableMetaMaskConnection(true)
    }

    /**
     * Sets tooltip
     * @param {any} allNfts
     */
    public setTooltip(allNfts: any) {
        setTimeout(() => {
            allNfts?.forEach((nft: any, index: any) => {
                (<HTMLElement>document.getElementById(`tooltip-title${index}`))?.classList.remove('add-content');
                const contentHeight = (<HTMLElement>document.getElementById(`tooltip-title${index}`))?.scrollHeight;
                (<HTMLElement>document.getElementById(`tooltip-title${index}`))?.classList.add('add-content');
                if (contentHeight > 59) {
                    (<HTMLElement>document.getElementById(`tooltip-head${index}`))?.classList.add('tooltip-details');
                }
                else {
                    (<HTMLElement>document.getElementById(`tooltip-head${index}`))?.classList.remove('tooltip-details');
                }
            })
        }, 100);
    }

    /**
     * Sets tooltip based on screen size
     * @param {number} index
     */
    public setTooltipSize(index: number) {
        (<HTMLElement>document.getElementById(`tooltip-title${index}`)).classList.remove('add-content');
        const contentHeight = (<HTMLElement>document.getElementById(`tooltip-title${index}`))?.scrollHeight;
        (<HTMLElement>document.getElementById(`tooltip-title${index}`)).classList.add('add-content');
        if (contentHeight > 59) {
            (<HTMLElement>document.getElementById(`tooltip-head${index}`)).classList.add('tooltip-details');
        }
        else {
            (<HTMLElement>document.getElementById(`tooltip-head${index}`)).classList.remove('tooltip-details')
        }
    }

    showSort() {
        this.showSortOptions = !this.showSortOptions;
    }

    applySort(type: string, value: number) {
        this.closeSetLoan();
        this.sort = { type, value };
        const index = this.filters.findIndex((filter) => filter.type === 'sort');
        if (index !== -1) this.filters.splice(index, 1);

        let name;
        if (type === 'name') name = value === 1 ? 'By Name. (A → Z)' : 'By Name. (Z → A)'
        if (type === 'price') name = value === 1 ? 'By Price. (0 → 9)' : 'By Price. (9 → 0)'
        if (type === 'appraisal') name = value === 1 ? 'By Appraisal value. (0 → 9)' : 'By Appraisal value. (9 → 0)'

        this.filters.push({ type: 'sort', value, name, sortType: type });
        this.page = 1;
        this.getOwnerNfts();
    }

    clearSort() {
        this.closeSetLoan();
        this.page = 1;
        let sortIndex = this.filters.findIndex((filter) => (filter.type === 'sort'));
        if (sortIndex !== -1) {
            this.filters.splice(sortIndex, 1);
            this.sort = '';
        }
        this.getOwnerNfts();
    }

    /**redeem */
    showSuccess() {
        this.successredeem = true;
    }

    /**
   * Totals count
   * @param count
   */
    totalCount(count: { category: number, location: number, collection: number, }) {
        this.totalFilterCount = { ...count };
    }

    /**
   * on clicking redeem
   */
    onClickingRedeem() {
        this.commonService.setTabEmitter({ type: 'assets' })
    }


    setRoute() {
        this.webStorageService.setItem('previousRoute', this.router.url)
    }
    /**
     * Select country code
     */
    selectCountry(code: any) {
        this.selectedCountry = COUNTRIES.find(country => (country.dialCode === code.dialCode && country.regionCode === code.regionCode)) || this.selectedCountry;
        this.redeemForm.patchValue({
            country_code: code.dialCode
        })
    }

    get filteredCountries() {
        return this.searchText ? COUNTRIES.filter(country => country.name.toLowerCase().includes(this.searchText.toLowerCase())) : COUNTRIES;
    }

    /**
   * process images to send to confirmation modal
   */
    private processImages() {
        this.processedImages = this.selectedNfts.map((asset: any) => {
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
   * process images to send to confirmation modal
   */
    private processImage() {
        if (this.selectedNfts?.[0]?.['fileType'] === 'html') {
            this.processedImage = {
                ...this.selectedNfts[0],
                displayImage: this.selectedNfts?.[0]?.['preview_image'] ? this.selectedNfts?.[0]?.['preview_image'] : this.selectedNfts?.[0]?.['secondary_media'][0]
            };
        } else {
            this.processedImage = {
                ...this.selectedNfts[0],
                displayImage: this.selectedNfts?.[0]?.['preview_image'] ? this.selectedNfts?.[0]?.['preview_image'] : this.selectedNfts?.[0]?.['primary_media']
            };
        }
        return this.processedImage;

    }

    ngOnDestroy() {
        this.socketService?.unsubscribeEvents();
    }

    /**
     * Determines the navigation path based on the state of the NFT.
     * 
     * @param {INFT} nft - The NFT object containing relevant properties.
     * @returns {string[] | undefined} The navigation path based on the NFT's state.
     */
    getNftCardNavigation(nft: INFT): string[] | undefined {
        if (this.isMyWallet && (nft.for_loan || nft.on_loan)) {
          return ['/borrow-detail', nft?.loan_details?.loan_request_id];
        } else if (nft.lazy_mint) {
          return ['/lazy-mint', nft._id];
        } else {
          return ['/nft-detail', nft?.collections?.['collection_address'], nft?.token_id];
        }
      }
    }
    
    interface INFT {
      for_loan: boolean;
      on_loan: boolean;
      lazy_mint: boolean;
      _id: string;
      token_id: string;
      loan_details:any;
      collections:any
  }