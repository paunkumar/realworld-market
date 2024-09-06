import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChildren } from '@angular/core';
import { Router } from '@angular/router';
import { WebStorageService } from '../../services/web-storage.service';


@Component({
    selector: 'app-filters',
    templateUrl: './filters.component.html',
    styleUrls: ['./filters.component.css']
})
export class FiltersComponent implements OnInit, OnChanges {

    @Input() categories: any[] = [];
    @Input() locations: any[] = [];
    @Input() collections: any[] = [];
    @Output() filterEvent = new EventEmitter<{ value: any, checked: boolean, action: string, type: string }>();
    @Output() loader = new EventEmitter<boolean>(false);
    @Input() saleOptions: any[] = [];
    @Input() collateralOptions: any[] = [];
    @Input() priceSlider = {
        floor: 0,
        ceil: 0,
        minValue: 0,
        maxValue: 0,
        loader: false
    };
    @Input() appraisalSlider = {
        floor: 0,
        ceil: 0,
        minValue: 0,
        maxValue: 0,
        loader: false
    }
    @Input() isInSale: boolean = true;

    initialCollections: any[] = [];
    initialLocations: any[] = [];
    initialCategories: any[] = [];
    options = ["yes", "no"];

    @Output() clearFilterEvent = new EventEmitter();
    @Output() loaderEvent = new EventEmitter();
    @Output() clearFilter = new EventEmitter();
    @ViewChildren('checkbox') checkboxes: any;
    @ViewChildren('selectAll') selectAll: any;

    @Output() closeFilter = new EventEmitter();
    filterview: boolean = false;

    maxSalePrice: boolean = false;
    maxAppraisal: boolean = false;

    appraisalMinValueError: boolean = false;
    filters: any[] = [];
    minValueDebounceTimeout: any;
    maxValueDebounceTimeout: any;
    minValueError: boolean = false;
    category_expand: boolean = true;
    location_expand: boolean = false;
    collection_expand: boolean = false;
    price_expand: boolean = false;
    appraisal_expand: boolean = false;
    sale_expand: boolean = false;
    collateral_expand: boolean = false;
    showAll = false;
    account: any = {};
    seeAllCategory: boolean = false;
    seeAllLocation: boolean = false;
    seeAllCollection: boolean = false;
    collectionLoader: boolean = false;
    nftTraitsLoader: boolean = false;
    @Output('totalCount') totalCount = new EventEmitter();
    searchCategory: any = [];
    searchLocation: any = [];
    searchCollection: any = [];
    isSale = false;
    isWalletpage = false;
    showOnlyButtonCategory = false;
    showOnlyButtonLocation = false;
    showOnlyButtonCollection = false;
    hoveredIndex!: number;

    constructor(
        private webStorageService: WebStorageService,
        private router: Router,
    ) { }


    ngOnInit(): void {
        this.isWalletpage = this.router.url === '/my-wallet';
        this.account = this.webStorageService.getLocalStorage('account') != null ? JSON.parse(this.webStorageService.getLocalStorage('account') || '') : this.account;
    }

    ngOnChanges(changes: SimpleChanges) {
        this.initialCollections = changes['collections']?.currentValue || [];
        this.initialCategories = changes['categories']?.currentValue || [];
        this.initialLocations = changes['locations']?.currentValue || [];
    }

    onFilter(event: any, type: string) {
        const { value, checked, action } = event.target;
        setTimeout(() => {
            this.loader.emit(false);
            this.filterEvent.emit({ value, checked, action, type });
        }, 1000);
    }

    selectOnly(type: any, name: string) {
        this.loader.emit(true);
        this.closeFilter.emit();
        const event = { target: { value: name, action: 'only' } };
        this.onFilter(event, type);
    }

    reset(type: string) {
        if (type === 'price') {
            this.priceSlider.minValue = 0;
            this.priceSlider.maxValue = 0;
        }
        if (type === 'appraisal') {
            this.appraisalSlider.minValue = 0;
            this.appraisalSlider.maxValue = 0;
        }
        const event = { target: { action: 'reset' } };
        this.onFilter(event, type);
    }

    setPriceFilter() {
        this.priceSlider.loader = true;
        // this.priceSlider.disabled = true;
        let { minValue, maxValue } = this.priceSlider;
        const event = { target: { value: { minValue, maxValue } } };
        this.onFilter(event, 'price');
    }

    setAppraisalFilter() {
        this.appraisalSlider.loader = true;
        let { minValue, maxValue } = this.appraisalSlider;
        const event = { target: { value: { minValue, maxValue } } };
        this.onFilter(event, 'appraisal');
    }

    onSliderMinValueChange(event: any) {

        this.minValueError = false;
        clearTimeout(this.minValueDebounceTimeout);

        // Set a new debounce timeout
        this.minValueDebounceTimeout = setTimeout(() => {
            const newMinValue = event.target.valueAsNumber;
            if (newMinValue > this.priceSlider.maxValue) {
                // Swap values and set error flag
                this.minValueError = true;
                const temp = this.priceSlider.maxValue;
                this.priceSlider.maxValue = newMinValue;
                this.priceSlider.minValue = temp;
            } else {
                this.minValueError = false; // Clear error if corrected
                this.priceSlider.minValue = newMinValue;
            }
            this.priceSlider.minValue = event.target.value
            if (event.target.value && Number(event.target.value) < Number(this.priceSlider.maxValue)) {
                this.minValueError = false;
            } else {
                this.minValueError = true;
            }
        }, 100);
    }

    onSliderMaxValueChange(event: any) {
        this.minValueError = false;
        clearTimeout(this.maxValueDebounceTimeout);

        // Set a new debounce timeout
        this.maxValueDebounceTimeout = setTimeout(() => {
            const newMaxValue = event.target.valueAsNumber;
            if (newMaxValue < this.priceSlider.minValue) {
                // Swap values and set error flag
                this.minValueError = true;
                const temp = this.priceSlider.minValue;
                this.priceSlider.minValue = newMaxValue;
                this.priceSlider.maxValue = temp;
            } else {
                this.minValueError = false; // Clear error if corrected
                this.priceSlider.maxValue = newMaxValue;
            }
            this.priceSlider.maxValue = event.target.value
            if (event.target.value && Number(event.target.value) > Number(this.priceSlider.minValue)) {
                this.minValueError = false;
            } else {
                this.minValueError = true;
            }
        }, 1000);
    }

    onSliderAppraisalMinValueChange(event: any) {

        this.appraisalMinValueError = false;
        clearTimeout(this.minValueDebounceTimeout);

        // Set a new debounce timeout
        this.minValueDebounceTimeout = setTimeout(() => {
            const newMinValue = event.target.valueAsNumber; // Get the typed value
            if (newMinValue > this.appraisalSlider.maxValue) {
                // Swap values
                const temp = this.appraisalSlider.maxValue;
                this.appraisalSlider.maxValue = newMinValue;
                this.appraisalSlider.minValue = temp;
            } else {
                this.appraisalSlider.minValue = newMinValue;
            }
            this.appraisalSlider.minValue = event.target.value
            if (event.target.value && Number(event.target.value) < Number(this.appraisalSlider.maxValue)) {
                this.appraisalMinValueError = false;
            } else {
                this.appraisalMinValueError = true;
            }
        }, 100);
    }

    onSliderAppraisalMaxValueChange(event: any) {

        this.appraisalMinValueError = false;
        clearTimeout(this.maxValueDebounceTimeout);

        // Set a new debounce timeout
        this.maxValueDebounceTimeout = setTimeout(() => {
            const newMaxValue = event.target.valueAsNumber;
            if (newMaxValue < this.appraisalSlider.minValue) {
                // Swap values
                const temp = this.appraisalSlider.minValue;
                this.appraisalSlider.minValue = newMaxValue;
                this.appraisalSlider.maxValue = temp;
            } else {
                this.appraisalSlider.maxValue = newMaxValue;
            }
            this.appraisalSlider.maxValue = event.target.value
            if (event.target.value && Number(event.target.value) > Number(this.appraisalSlider.minValue)) {
                this.appraisalMinValueError = false;
            } else {
                this.appraisalMinValueError = true;
            }
        }, 1000);
    }

    /**
     * expand and collapse
     */
    categoryViewFilter() {
        this.category_expand = !this.category_expand;
    }
    locationExpand() {
        this.location_expand = !this.location_expand;
    }
    collectionAll() {
        this.collection_expand = !this.collection_expand;
    }
    priceExpand() {
        this.price_expand = !this.price_expand;
    }
    appraisalExpand() {
        this.appraisal_expand = !this.appraisal_expand;
    }
    saleExpand() {
        this.sale_expand = !this.sale_expand;
    }
    colletralExpand() {
        this.collateral_expand = !this.collateral_expand
    }
    toggleShowAll() {
        this.showAll = !this.showAll
    }

    /**
     * Changes category list
     */
    changeCategoryList() {
        this.seeAllCategory = !this.seeAllCategory;
        this.categories = this.unshiftSelectedItems(this.categories);
    }

    /**
     * Changes location list
     */
    changeLocationList() {
        this.seeAllLocation = !this.seeAllLocation;
        this.locations = this.unshiftSelectedItems(this.locations);
    }

    /**
     * Changes collection list
     */
    changeCollectionList() {
        this.seeAllCollection = !this.seeAllCollection;
        this.collections = this.unshiftSelectedItems(this.collections);
    }

    /**
     * Searchs data
     * @param {any} event
     */
    searchData(event: any) {
        if (event.target.value != '') {

            this.categories = this.initialCategories.filter((data) => data.name.toLowerCase().includes(event.target.value.toLowerCase()));
            this.locations = this.initialLocations.filter((data) => data.name.toLowerCase().includes(event.target.value.toLowerCase()));
            this.collections = this.initialCollections.filter((data) => data.name.toLowerCase().includes(event.target.value.toLowerCase()));
        }
        else {
            this.categories = this.initialCategories;
            this.locations = this.initialLocations;
            this.collections = this.initialCollections;
        }
    }

    closeNewfilter() {
        // reset category seeAll value and move selected categories to top of the list
        this.seeAllCategory = false;
        this.categories = this.unshiftSelectedItems(this.categories);

        // reset location seeAll value and move selected locations to top of the list
        this.seeAllLocation = false;
        this.locations = this.unshiftSelectedItems(this.locations);


        // reset collection seeAll value and move selected collections to top of the list
        this.seeAllCollection = false;
        this.collections = this.unshiftSelectedItems(this.collections);

        this.closeFilter.emit();
    }

    // Move selected items to top of the list
    unshiftSelectedItems(items: any[] = []) {
        let selectedItems = items.filter((item) => item.checked === true)
        let unselectedItems = items.filter((item) => item.checked === false)
        return [...selectedItems, ...unselectedItems]
    }

    trackByCategory(index: number, category: any): string {
        return category?.name;
    }

    /**
     *@param{number} index
     *@param{string} type
     */
    onHoveringLabel(index: number, type: string) {
        switch (type) {
            case 'category':
                this.showOnlyButtonCategory = true;
                this.hoveredIndex = index;

                break;
            case 'location':
                this.showOnlyButtonLocation = true;
                this.hoveredIndex = index;

                break;
            case 'collection':
                this.showOnlyButtonCollection = true;
                this.hoveredIndex = index;

                break;

            default:
                break;
        }

    }

}
