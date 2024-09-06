import { Component } from '@angular/core';
import moment from 'moment';
import { ToastrService } from 'ngx-toastr';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { AccountService } from 'src/app/shared/services/account.service';
import { CommonService } from 'src/app/shared/services/common.service';
import { NftService } from 'src/app/shared/services/nft.service';
import { SocketService } from 'src/app/shared/services/socket.service';
import { WebStorageService } from 'src/app/shared/services/web-storage.service';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {

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

    collections: any[] = [];
    categories: any[] = [];
    locations: any[] = [];
    currencies: any[] = [];
    currencyConversions: any[] = [];
    partition: string = '';
    page: number = 1;
    searchKeyword: string = '';
    isClearFilters: boolean = false;
    saleOption: any[] = [{ name: "For sale.", value: "yes", checked: true }, { name: "Not for sale.", value: "no", checked: false }];
    collateralOption: any[] = [{ name: "In collateral", value: "yes", checked: false }, { name: "Not in collateral", value: "no", checked: false }];
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

    // sort variables
    showSort: boolean = false;
    sort: any = '';

    // loader variables
    loader: boolean = true;
    scrollLoader: boolean = false;
    nftTraitsLoader: boolean = false;
    collectionLoader: boolean = false;

    // other variables
    isGridView: boolean = true;
    regulated: boolean = false;
    account: any = {};
    user: any = {};
    items: any[] = [];
    nftsCount: number = 0;
    totalFilterCount: any = {};
    Math: any = Math;
    imageLoading: boolean = false;
    disableInfiniteScroll: boolean = true;
    searchKeywordObservable: any;
    isShowSearch: boolean = false;
    isSortingShow: boolean = false;

    constructor(
        private commonService: CommonService,
        private nftService: NftService,
        private accountService: AccountService,
        private webStorageService: WebStorageService,
        private toastr: ToastrService,
        private socketService: SocketService
    ) { }

    ngOnInit(): void {
        this.accountService.loaderStatusUpdate(true);
        this.account = this.webStorageService.getLocalStorage('account') != null ? JSON.parse(this.webStorageService.getLocalStorage('account') || '') : this.account;
        this.user = this.webStorageService.getLocalStorage('user') != null ? JSON.parse(this.webStorageService.getLocalStorage('user') || 'undefined') : this.user;
        this.regulated = JSON.parse(this.webStorageService.getLocalStorage('regulated') || 'true');
        this.filters = JSON.parse(this.webStorageService.getItem('filters') || '[]');

        // this.searchKeyword = search || '';
        this.searchKeywordObservable = this.nftService.searchKeywordObservable.pipe(
            debounceTime(500),
            distinctUntilChanged(),
            switchMap((searchQuery: string) => {
                this.loader = true;
                if ((searchQuery !== "" && (this.searchKeyword !== searchQuery)) || (searchQuery === '' && this.searchKeyword !== searchQuery)) {
                    this.page = 1;
                    this.searchKeyword = searchQuery;
                    // set search filter
                    this.filters = this.filters.filter((item) => item.type !== 'search');
                    if (this.searchKeyword !== '') this.filters.push({ type: 'search', value: this.searchKeyword });
                    this.webStorageService.setItem('filters', JSON.stringify(this.filters));
                    // api call
                    return this.nftService.getNfts(this.page, this.partition != '' ? 10 : 5, this.searchKeyword,
                        this.filterCollection,
                        this.filterLocation,
                        this.filterCategory,
                        this.filterSale.some((item) => item.checked) ? this.filterSale.find((item) => item.checked).value : "",
                        this.filterCollateral.some((item) => item.checked) ? this.filterCollateral.find((item) => item.checked).value : "",
                        this.filterPrice.length > 0 ? this.filterPrice[0]?.minValue : 0,
                        this.filterPrice.length > 0 ? this.filterPrice[0]?.maxValue : 0,
                        this.filterAppraisal?.length > 0 ? this.filterAppraisal[0].minValue : 0,
                        this.filterAppraisal?.length > 0 ? this.filterAppraisal[0].maxValue : 0, this.sort, this.partition
                    )
                }
                else return ''
            })
        ).subscribe({
            next: async (response: any) => {
                this.nftService.recentSearchStatus(true);
                if (response !== '') this.setNfts(response);
            },
            error: (error) => {
                this.loader = false;
            }
        })

        this.commonService.showGridViewObservable.subscribe((response: boolean) => {
            this.isGridView = response;
        })
        this.commonService.setTabEmitter({ type: 'marketplace' });

        this.applyInitialFilter();
        this.getCurrencies();
        this.getNftTriats();
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
                this.categories = this.unshiftSelectedItems(this.categories)
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

                    if (checked) {
                        this.filterCollection.push(item.name);
                        this.filters.push({ type: 'collection', value: item.name, category: item.category });
                    }
                })

                // get nfts based on filters
                this.getNfts();
            }
        })
    }

    /**
     * Get nfts
     * @function getNfts
     */
    getNfts() {
        this.webStorageService.setItem('filters', JSON.stringify(this.filters));
        this.showFilter = false;
        this.page === 1 ? this.loader = true : this.scrollLoader = true;
        this.disableInfiniteScroll = true;
        const collectionFilters = this.filters.filter((item) => item.type === 'collection')
        const uniqueCollectionCategories = [...new Set(collectionFilters.map(obj => obj.category))];
        let limit = this.partition != '' || (this.filterCategory.length === 1 && this.filterCategory[0]?.toLowerCase() !== 'gold') || (this.filterCategory.length > 1 && uniqueCollectionCategories.length === 1) ? 10 : 5;
        this.nftService.getNfts(this.page, limit, this.searchKeyword,
            this.filterCollection,
            this.filterLocation,
            this.filterCategory,
            this.filterSale.some((item) => item.checked) ? this.filterSale.find((item) => item.checked).value : "",
            this.filterCollateral.some((item) => item.checked) ? this.filterCollateral.find((item) => item.checked).value : "",
            this.filterPrice.length > 0 ? this.filterPrice[0]?.minValue : 0,
            this.filterPrice.length > 0 ? this.filterPrice[0]?.maxValue : 0,
            this.filterAppraisal?.length > 0 ? this.filterAppraisal[0].minValue : 0,
            this.filterAppraisal?.length > 0 ? this.filterAppraisal[0].maxValue : 0, this.sort, this.partition
        ).subscribe({
            next: (response: any) => {
                this.setNfts(response);
            },
            error: (error: any) => {
                this.toastr.error(error?.data?.message || "Something went wrong, try again later.");
            }
        })
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
        if (response.data?.items?.length > 0) {
            if (!this.page || this.page === 1 || (this.page === 1 && this.searchKeyword !== "")) this.items = [];
            if (this.page > 1) this.items[0].items.push(...response.data?.items[0]?.items || []);
            else this.items.push(...response.data?.items || []);

            // NOTE: Infinite scroll is disabled when there is no next page available.
            // If the response indicates no 'next_page', disable infinite scrolling.
            this.disableInfiniteScroll = !response.data.next_page
            this.page = this.disableInfiniteScroll ? 1 : response.data.next_page;

            let goldPrice = 0;
            for (const item of response.data?.items) {
                for (const nft of item.items) {
                    if (nft.on_loan) {
                        nft.defaulted = nft.loan_details?.status === 1 && !this.isLiveLoan(nft.loan_details)
                    }
                    nft.category = (nft.attributes.find((attr: any) => attr.key.toLowerCase() === 'category')).value?.toLowerCase()
                    // find image type
                    nft.fileType = nft.preview_image ? nft?.preview_image.split('.')[nft?.preview_image.split('.').length - 1] : nft?.primary_media.split('.')[nft?.primary_media.split('.').length - 1];

                    if (nft?.category === 'gold' && nft.lazy_mint) {
                        if (goldPrice === 0) {
                            let response: any = await this.commonService.getGoldPrice();
                            goldPrice = response.data.gold_value;
                        }
                        let markupFee = nft?.attributes?.find((data: any) => data.key.toLowerCase() == 'markup fee');
                        let size = nft?.attributes?.find((data: any) => data.key.toLowerCase() == 'size');
                        let { price, priceWithFee }: any = await this.commonService.calculateGoldValue(size.value, markupFee.value, goldPrice);
                        nft.marketPrice = price;
                        if (nft.sale_details) nft.sale_details.exchange_price = priceWithFee;
                    }

                    if (nft.lazy_mint) {
                        if (nft.on_sale) nft.sale_details.price = await this.setExchangePrice(nft);
                    }
                }
            }

        } else {
            this.items = [];
            this.page = 1;
            this.nftsCount = 0;
        }
        this.loader = false;
        this.scrollLoader = false;
        this.accountService.loaderStatusUpdate(false);
    }

    isLiveLoan(loan: any) {
        let LOAN_IN_DAYS = this.account.chainId ? (environment as any)[this.account.chainId].LOAN_IN_DAYS : (environment as any)['DEFAULT_NETWORK'].LOAN_IN_DAYS;
        if (environment.ENVNAME === 'DEVELOPMENT') loan.end_date = moment(loan.start_date).clone().add(loan.duration, LOAN_IN_DAYS ? 'days' : 'hours').toISOString()
        return moment(moment().format("YYYY-MM-DD, hh:mm a"), 'YYYY-MM-DD, hh:mm a').isBefore(moment(moment(loan?.end_date).format("YYYY-MM-DD, hh:mm a"), 'YYYY-MM-DD, hh:mm a'))
    }

    /**
     * Get currencies
     * @function getCurrencies
     */
    getCurrencies() {
        this.commonService.getCurrencies().subscribe({
            next: async (response: any) => {
                this.currencies = response.data;
            },
            error: (error) => {
                this.toastr.error(error?.data?.message || "Something went wrong, try again later.");
            }
        })
    }

    /**
     * @function applySort
     * @param {string} type
     * @param {number} value
     */
    applySort(type: string, value: number, init: boolean = false) {
        this.sort = { type, value };
        const index = this.filters.findIndex((filter) => filter.type === 'sort');
        if (index !== -1) this.filters.splice(index, 1);

        let name;
        if (type === 'name') name = value === 1 ? 'By Name. (A → Z)' : 'By Name. (Z → A)'
        if (type === 'price') name = value === 1 ? 'By Price. (0 → 9)' : 'By Price. (9 → 0)'
        if (type === 'appraisal') name = value === 1 ? 'By Appraisal value. (0 → 9)' : 'By Appraisal value. (9 → 0)'
        if (type === 'purchase') name = 'By Purchase';
        if (type === 'bid') name = 'By Bid';
        if (type === 'loan') name = 'By Loan';
        if (type === 'transfer') name = 'By Transfer';

        this.filters.push({ type: 'sort', value, name, sortType: type });
        this.page = 1;
        if (!init) this.getNfts();
    }

    /**
     * @function clearSort
     */
    clearSort() {
        this.page = 1;
        let sortIndex = this.filters.findIndex((filter) => (filter.type === 'sort'));
        if (sortIndex !== -1) {
            this.filters.splice(sortIndex, 1);
            this.sort = '';
        }
        this.getNfts();
    }

    /**
     * @function filterEvent
     */
    filterEvent({ value, checked, action, type }: any) {
        this.loader = true;
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
        if (type && type !== 'category') this.getNfts();
    }

    applyInitialFilter() {
        if (this.filters.length === 0) {
            let saleFilter = this.saleOption.find((item) => item.checked);
            this.applySaleFilter({ value: saleFilter.value });
        } else {
            // retain partition value
            let partitionFilter = this.filters.find((item) => item.type === 'partition');
            partitionFilter && Object.keys(partitionFilter).length > 0 ? this.partition = partitionFilter?.value : this.partition = '';

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

            // retain search
            let searchFilter = this.filters.find((item) => item.type === 'search');
            this.searchKeyword = searchFilter?.value || '';
            if (this.searchKeyword !== '') this.nftService.setSearchKeyword(this.searchKeyword)

            // retain sort
            let sort = this.filters.find((item) => item.type === 'sort');
            if (sort && Object.keys(sort).length > 0) this.applySort(sort.sortType, sort.value, true)
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
        this.categories = this.unshiftSelectedItems(this.categories)
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
                    this.filters.push({ type: 'collection', value: collection.name, category: collection.category });
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

                // check in collections array
                let collectionIndex = this.collections.findIndex((item) => item.name === value);
                this.collections[collectionIndex].checked = true;
                this.filters.push({ type: 'collection', value, category: this.collections[collectionIndex].category });

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
        let priceSort = this.filters.filter((filter) => filter.type === 'sort' && filter.sortType === 'price');
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
        this.filters = this.filters.filter(item => item.type !== 'appraisal');
        switch (action) {
            case 'reset':
                this.filterAppraisal = [];
                break;

            default:
                let { minValue, maxValue } = value;
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

        // clear price filter
        this.removePriceFilter();

        // clear appriasal filter
        this.removeAppraisalFilter();

        this.applyInitialFilter();
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

        if (type && type !== 'category') this.getNfts();
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

    // Move selected items to top of the list
    unshiftSelectedItems(items: any[]) {
        let selectedItem = items.filter((item) => item.checked === true)
        let unselectedItem = items.filter((item) => item.checked === false)
        return [...selectedItem, ...unselectedItem]
    }

    seeMore(category: string) {
        this.loader = true;
        this.commonService.setShowSearch(true);
        this.isSortingShow = true;
        if (this.filterCategory.length > 1) {
            this.filters = this.filters.filter(item => item.type !== 'category')
            this.categories.map((item: any) => item.checked = item.name === category)
            this.filterCategory = [category]
            this.filters.push({ type: 'category', value: category })
            this.getCollectionsByCategoryLocation();
        } else {
            this.partition = category;
            this.filters.push({ type: 'partition', value: this.partition });
            this.getNfts();
        }
    }

    back() {
        this.loader = true;
        this.commonService.setShowSearch(false);
        this.isSortingShow = false;
        this.page = 1;
        if (this.filterCategory.length === 1 && this.partition != '') {
            this.partition = '';
            this.filters = this.filters.filter(item => item.type !== 'partition');
            this.getNfts();
        } else if (this.filterCategory.length === 1) {
            this.filters = this.filters.filter(item => item.type !== 'category');
            this.filterCategory = this.categories.map((item: any) => {
                item.checked = true;
                this.filters.push({ type: 'category', value: item.name })
                return item.name;
            })
            this.getCollectionsByCategoryLocation();
        }
    }

    getMarketPrice() {
        this.socketService.getMarketPrice().subscribe(async (marketPrice: any) => {
            if (marketPrice > 0) {
                for (const item of this.items) {
                    let goldNfts = item.items.filter((item: any) => item?.collections?.category?.toLowerCase() === 'gold');
                    goldNfts.map(async (nft: any) => {
                        if (nft.lazy_mint) {
                            let markupFee = nft?.attributes?.find((data: any) => data.key.toLowerCase() == 'markup fee');
                            let size = nft?.attributes?.find((data: any) => data.key.toLowerCase() == 'size');
                            let { price, priceWithFee }: any = await this.commonService.calculateGoldValue(size.value, markupFee.value, marketPrice);
                            nft.marketPrice = price;
                            if (nft.on_sale) {
                                nft.sale_details.exchange_price = priceWithFee;
                                nft.sale_details.price = await this.setExchangePrice(nft);
                            }
                        }
                    })
                }
            }
        });
    }

    /**
     * @function setExchangePrice
     * @param {object} nft
     * @returns {number} value
     */
    setExchangePrice = async (nft: any) => {
        let index = this.currencyConversions.findIndex((item) => item.address === nft.sale_details.currency_address);
        let value: number;
        if (index >= 0) {
            value = this.currencyConversions[index].value === 0 ? Math.ceil(nft.sale_details.exchange_price) : Math.ceil(nft.sale_details.exchange_price / this.currencyConversions[index].value);
        } else {
            let usdPrice = 0;
            try {
                let response: any = await this.commonService.getTokenPrice(nft.sale_details.currency_address);
                usdPrice = response[nft.sale_details.currency_address.toLowerCase()]?.usd || 1;
            } catch (error) {
                let currency = this.currencies.find((currency) => currency.address === nft.sale_details.currency_address);
                usdPrice = currency.usd_value || 1
            }
            this.currencyConversions.push({ address: nft.sale_details.currency_address, value: usdPrice });
            value = Math.ceil(nft.sale_details.exchange_price / usdPrice);
        }
        return value;
    }
    /**
     * Gets the appraisal value of an NFT.
     *
     * @param {any} nft - The NFT object containing details like category, lazy mint status, and sale details.
     * @returns {string | number} The appraisal value, which can be a number or a dash ('-') if the value is not available.
     */
    getAppraisalValue(nft: any): string | number {
        if (!nft) {
          return '-';
        }
      
        const isGoldCategory = nft.category === 'gold';
        const isLazyMint = nft.lazy_mint;
      
        if (isLazyMint) {
          const exchangePrice = Math.ceil(nft.sale_details?.exchange_price);
          const salePrice = Math.ceil(nft.sale_details?.price);
          const marketPrice = Math.ceil(nft.marketPrice);
      
          if (isGoldCategory) {
            return marketPrice || '-';
          } else {
            return exchangePrice > 0 ? salePrice : Math.ceil(nft.appraisal_value) || '-';
          }
        } else {
          return Math.ceil(nft.appraisal_value) || '-';
        }
      }

    ngOnDestroy() {
        this.searchKeywordObservable?.unsubscribe();
        this.socketService?.unsubscribeEvents();
    }
}
