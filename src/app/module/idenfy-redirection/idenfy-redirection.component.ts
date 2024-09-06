import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AccountService } from 'src/app/shared/services/account.service';
import { CommonService } from 'src/app/shared/services/common.service';
import { WebStorageService } from 'src/app/shared/services/web-storage.service';

@Component({
  selector: 'app-idenfy-redirection',
  templateUrl: './idenfy-redirection.component.html',
  styleUrls: ['./idenfy-redirection.component.css']
})
export class IdenfyRedirectionComponent implements OnDestroy {

  account: any;
  user: any;
  regulated: boolean = false;
  kycVerified: string = '';

  constructor(
    private commonService: CommonService,
    private webStorageService: WebStorageService,
    private accountService: AccountService,
    private router: Router,
    private toastr: ToastrService,
    private route: ActivatedRoute
  ) {}

  ngOnInit():void{
    this.commonService.setHeaderHide(true);

    this.kycVerified = this.route.snapshot.paramMap.get('status') || '';

    this.account = this.webStorageService.getLocalStorage('account') != null ? JSON.parse(this.webStorageService.getLocalStorage('account') || '') : this.account;
    this.user = this.webStorageService.getLocalStorage('user') != null ? JSON.parse(this.webStorageService.getLocalStorage('user') || 'undefined') : this.user;
    this.regulated = JSON.parse(this.webStorageService.getLocalStorage('regulated') || 'true');

    this.updateUser();
    if(this.kycVerified !== 'success' && this.kycVerified !== 'failed') this.router.navigate(['**']);
  }

  updateUser() {
    this.accountService.updateUser(this.user._id, {kyc_verified: this.kycVerified === 'success' ? 1 : 2}).subscribe({
      next: async (response: any) => {
        if(this.kycVerified === 'success') {
          this.webStorageService.setLocalStorage('user', JSON.stringify({...response?.data, token: this.user.token, admin_kyc_enable: this.user.admin_kyc_enable}));
          let url = await this.webStorageService.getItem('previousRoute') || '';
          window.open(url, '_top');
        }
      },
      error: (error) => this.toastr.error('Failed to update user.')
    })
  }

  ngOnDestroy(): void {
    this.commonService.setHeaderHide(false);
  }
}
