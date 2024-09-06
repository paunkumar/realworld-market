import { Component } from '@angular/core';
import { WebStorageService } from 'src/app/shared/services/web-storage.service';

@Component({
    selector: 'app-borrow-loan',
    templateUrl: './borrow-loan.component.html',
    styleUrls: ['./borrow-loan.component.css']
})
export class BorrowLoanComponent {
    account: any;

    constructor(
        private webStorageService: WebStorageService
    ) { }

    ngOnInit(): void {
        this.account = this.webStorageService.getLocalStorage('account') != null ? JSON.parse(this.webStorageService.getLocalStorage('account') || '') : this.account;
    }
}
