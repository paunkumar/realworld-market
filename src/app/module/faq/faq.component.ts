import { Component } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { FaqManagementService } from 'src/app/shared/services/faq-management.service';
import { IApiResponse } from 'src/app/shared/utils/common.interface';

@Component({
    selector: 'app-faq',
    templateUrl: './faq.component.html',
    styleUrls: ['./faq.component.css']
})
export class FaqComponent {
    filterSelected: string = '';
    filterSearch: string = '';
    filterCategory: string = '';
    faqDataPaginations = [];
    faqData: any = [];
    categoryData = [];
    loader: boolean = false;

    constructor(
        private faqManagementService: FaqManagementService,
        private toastr: ToastrService
    ) { }

    /**
     * on init
     */
    ngOnInit(): void {
        this.getcategory();
    }

    /**
     * Gets faq
     * @param {string} search
     * @param {string} category
     * @param {string} selected
     */
    getFaq(search: string, category: string, selected: string) {
        this.loader = true;
        this.faqManagementService.getFaq(search, category, selected).subscribe({
            next: (response: IApiResponse) => {
                this.faqData = response['data'].docs;
                this.faqDataPaginations = response['data'];
                this.loader = false;
            },
            error: (error: any) => {
                this.loader = false;
                if (error.error.message != '') this.toastr.error(error.error.message)
            }
        })

    }

    /**
     * Searchs filter
     * @param {string} value
     * @param {string} type
     */
    searchFilter(value: any, type: string) {
        value = value.target.value;
        switch (type) {
            case 'selected': {
                this.filterSelected = value;
                break;
            }
            case 'category': {
                this.filterCategory = value;
                break;
            }
            case 'search': {
                this.filterSearch = value;
                break;
            }
            default: {
                this.filterSelected = '';
                this.filterCategory = '';
                this.filterSearch = '';
            }

        }
        this.getFaq(this.filterSearch, this.filterCategory, this.filterSelected)
    }

    /**
     * Gets category
     */
    getcategory() {
        this.faqManagementService.getCategory().subscribe((response: any) => {
            this.categoryData = response['data'];
        },
            (error: any) => {
                if (error.error.message != '') this.toastr.error(error.error.message)
            })
    }
}
