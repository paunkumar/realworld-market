import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OwlOptions } from 'ngx-owl-carousel-o';
import { ToastrService } from 'ngx-toastr';
import { AccountService } from '../../services/account.service';
import { CommonService } from '../../services/common.service';
import { WebStorageService } from '../../services/web-storage.service';
import { IApiResponse } from '../../utils/common.interface';

@Component({
  selector: 'app-custodymailverification',
  templateUrl: './custodymailverification.component.html',
  styleUrls: ['./custodymailverification.component.css']
})
export class CustodymailverificationComponent implements OnInit {
    customOptions: OwlOptions = {
      loop: true,
      margin: 20,
      autoplay: true,
      autoplayTimeout:10000,
      dots: true,
      nav: false,
      items: 1,
      mouseDrag: false,
      touchDrag: false,
      pullDrag: false,
    };
  user :{[key: string]: any}={};
  fromLoginPage = false;
  isEmailVerified = false;
  emailVerificationError = false;
  id = '';
  token = '';
  isDisabled = false;
  constructor(
    private commonService: CommonService,
    private webStorage: WebStorageService,
    private route: ActivatedRoute,
    private accountService: AccountService,
    private toastr: ToastrService,
    private router: Router,
  ) { }



  ngOnInit(): void {
    this.user = this.webStorage.getLocalStorage('user') != null ? JSON.parse(this.webStorage.getLocalStorage('user') || 'undefined') : {};
    this.route.queryParams.subscribe(params => {
      this.fromLoginPage = !!params['login'];
      this.id = params['id'];
      this.token = params['token'];
     if(params['email']) this.user['email'] = params['email'];
    });
    this.commonService.setHeaderHide(true);
    if (this.id && this.token) {
      this.confirmEmail();
    }

  }

  /**
   * confirm email
   */
  private confirmEmail() {
    this.accountService.confirmEmail({ id: this.id, token: this.token }).subscribe({
      next: (response: IApiResponse) => {
        this.isEmailVerified = true;
        this.toastr.success(response.message);
      },
      error: (error: HttpErrorResponse) => {
        this.isEmailVerified = false;
        this.toastr.error(error?.error?.message || "Something went wrong, try again later.");
        this.emailVerificationError = true;
      }
    })
  }

  /**
   * resend verification email
   */
  resendVerificationEmail() {
    this.isDisabled = true;
    this.accountService.resendVerificationEmail({ email: this.user['email'] }).subscribe({
      next: (response: IApiResponse) => {
        this.toastr.success(response.message);
        setTimeout(() => {
          this.isDisabled = false;
        }, 10000); //
      },
      error: (error: HttpErrorResponse) => {
        this.toastr.error(error?.error?.message || "Something went wrong, try again later.");
        this.isDisabled = false;
      }
    })
  }



  ngOnDestroy(): void {
    this.commonService.setHeaderHide(false);
  }

}
