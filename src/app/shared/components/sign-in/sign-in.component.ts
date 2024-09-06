import { SocialAuthService } from '@abacritt/angularx-social-login';
import { Component, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { OwlOptions } from 'ngx-owl-carousel-o';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { CommonService } from 'src/app/shared/services/common.service';
import { environment } from 'src/environments/environment';
import { forbidUppercase } from '../../Hepler/custom-form-validators';
import { AccountService } from '../../services/account.service';
import { WebStorageService } from '../../services/web-storage.service';
declare var AppleID: any;

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.css']
})
export class SignInComponent implements OnDestroy {
  account: any;
  regulated: boolean = false;
  password: string = '';
  fieldTextType:boolean=false;
  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email, forbidUppercase()]],
    password: ['', [Validators.required]]
  });
  loginFormSubmitted: boolean = false;
  loginFormProcessing: boolean = false;
  googleLoginProcessing: boolean = false;
  authSubscription!: Subscription;

  constructor(
    private commonService:CommonService,
    private fb: FormBuilder,
    private router: Router,
    private accountService: AccountService,
    private toastr: ToastrService,
    private webStorageService: WebStorageService,
    private authService: SocialAuthService,
  ){}

  ngOnInit():void{
    this.commonService.setHeaderHide(true);
    this.regulated = JSON.parse(this.webStorageService.getLocalStorage('regulated') || 'true');
    this.account = this.webStorageService.getLocalStorage('account') != null ? JSON.parse(this.webStorageService.getLocalStorage('account') || '') : this.account;
  }

  ngOnDestroy(): void {
    this.commonService.setHeaderHide(false);
    this.authSubscription?.unsubscribe();
  }

  toggleFieldTextType(){
    this.fieldTextType = !this.fieldTextType;
  }

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

  onLogin() {
    this.loginFormSubmitted = true;
    this.loginFormProcessing = true;

    if (this.loginForm.valid) {
      let params = {
        ...this.loginForm.value,
        wallet_address: this.account?.walletAddress
      }
      this.accountService.login(params).subscribe({
        next: (response: any) => {
          this.loginProcess(response);
        },
        error: (error: any) => {
          this.loginFormProcessing = false;
          this.loginFormSubmitted = false;
          this.toastr.error(error?.error?.message || "Something went wrong, try again later.");
          if (error.status === 403) {
            this.router.navigate(['/verify-email'], { queryParams: { login:'1',email:this.loginForm.value.email } });
          }
          // this.webStorageService.setLocalStorage('user', JSON.stringify(user.data));
          // this.webStorageService.setLocalStorage('account', JSON.stringify({ walletAddress: user.data.wallet_address, chainId: environment.DEFAULT_CHAIN, walletProvider: "", networkId: Number(environment.DEFAULT_NETWORK), init: false }));

        },
      });
    } else {
      this.loginFormProcessing = false;
      this.toastr.error('Please fill all the required fields.');
    }
  }

  get loginFormControls() {
    return this.loginForm.controls;
  }

  /**
   * Googles signin
   * @param googleWrapper
   */
  public googleSignin(googleWrapper: any) {
    this.googleLoginProcessing = true;
    googleWrapper.click();
    this.authSubscription?.unsubscribe();
    this.authSubscription = this.authService.authState.subscribe((user) => {
      const obj = {
        email:user.email,
        name:user.name,
        apple_signin: false,
        google_signIn: true
      }
      this.accountService.googleAuth(obj).subscribe((response) => {
        this.loginProcess(response);
      },
      (error) => {
        this.toastr.error(error?.error?.message || "Something went wrong, try again later.");
        this.googleLoginProcessing = false
      }
      )
    });
  }

  async appleSignin() {
    try {
      AppleID.auth.init({
        clientId : 'com.realworld.bundle.backend',
        scope : 'name email',
        redirectURI : environment.WEB_SITE_URL,
        state : 'init',
        nonce : 'test',
        usePopup : true //or false defaults to false
      });
      const data = await AppleID.auth.signIn();
      let user = this.parseJwt(data.authorization.id_token);
      if(!user?.name) {
        let emailSplit = (user.email).split('@');
        user.name = emailSplit[0];
      }
      this.accountService.googleAuth({email: user.email, name: user.name, apple_signin: true, google_signIn: false}).subscribe({
        next: (response) => {
          this.loginProcess(response);
        },
        error: (error) => {
          this.toastr.error(error?.error?.message || "Something went wrong, try again later.");
        }
      });
    } catch (error) {
      console.log(error)
    }
  }

  parseJwt (token: any) {
    let base64Url = token.split('.')[1];
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    let jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
  };

  /**
   * Logins process
   * @param response
   */
  async loginProcess(response:any){
    let user: any = response;
      this.webStorageService.setLocalStorage('user', JSON.stringify(user.data));
      this.webStorageService.setLocalStorage('account', JSON.stringify({ walletAddress: user.data.wallet_address, chainId: environment.DEFAULT_CHAIN, walletProvider: "", networkId: Number(environment.DEFAULT_NETWORK), init: false }));
      this.loginFormProcessing = false;
      this.loginFormSubmitted = false;
      this.googleLoginProcessing = false;
      this.loginForm.reset();
      this.toastr.success('Logged in successfully.');
      let route = await this.webStorageService.getItem('previousRoute');
      route ? this.router.navigateByUrl(route) : this.router.navigate(['/dashboard'])
  }

}

