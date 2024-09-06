import { SocialAuthService } from '@abacritt/angularx-social-login';
import { Component, OnDestroy } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { OwlOptions } from 'ngx-owl-carousel-o';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { CommonService } from 'src/app/shared/services/common.service';
import { environment } from 'src/environments/environment';
import { forbidUppercase } from '../../Hepler/custom-form-validators';
import { AccountService } from '../../services/account.service';
import { ManageDocumentService } from '../../services/manage-document.service';
import { WebStorageService } from '../../services/web-storage.service';
import { customPasswordValidator } from 'src/app/core/helpers/custom-password-validator.helper';
declare var AppleID: any;

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.css']
})
export class SignUpComponent implements OnDestroy {
  account:any;
  fieldTextType:boolean = false;
  fieldTextTypeCp:boolean = false;
  regulated: boolean = false;
  registerForm!: FormGroup;
  registerFormSubmitted: boolean = false;
  registerFormProcessing: boolean = false;
  authSubscription!: Subscription;
  privacyPolicyUrl: string = '';
  userAggrementUrl: string = '';

  passwordValidations: Array<{ validation: string; message: string }> = [
    { validation: 'hasMinlength', message: 'At least a minimum of 12 characters.' },
    { validation: 'hasNumeric', message: 'At least one digit.' },
    { validation: 'hasLowerCase', message: 'At least one lowercase letter.' },
    { validation: 'hasUpperCase', message: 'At least one uppercase letter.' },
    { validation: 'hasSpecialCharacters', message: 'At least one special character.' },
  ];

  constructor(
    private commonService: CommonService,
    private webStorageService: WebStorageService,
    private fb: FormBuilder,
    private toastr: ToastrService,
    private router: Router,
    private accountService: AccountService,
    private authService: SocialAuthService,
    private manageDocumentService: ManageDocumentService
  ){}

  ngOnInit():void{
    this.account = this.webStorageService.getLocalStorage('account') != null ? JSON.parse(this.webStorageService.getLocalStorage('account') || '') : this.account;
    this.commonService.setHeaderHide(true);
    this.regulated = JSON.parse(this.webStorageService.getLocalStorage('regulated') || 'true');
    if(this.regulated) {
      this.registerForm = this.fb.group({
        name: ['', [Validators.required]],
        email: ['', [Validators.required, Validators.email, forbidUppercase()]],
        password: ['', [Validators.required, customPasswordValidator()]],
        confirmPassword: ['', [Validators.required]],
        is_policy_accepted: ['', [Validators.required]]
      }, { validators: this.checkPasswords });
    } else {
      this.registerForm = this.fb.group({
        name: ['', [Validators.required]],
        email: ['', [Validators.required, Validators.email]],
        is_policy_accepted: ['', [Validators.required]]
      })
    }
    this.getDocument();
  }

  ngOnDestroy(): void {
    this.commonService.setHeaderHide(false);
    this.authSubscription?.unsubscribe();
  }

  checkPasswords: ValidatorFn = (group: AbstractControl):  ValidationErrors | null => {
    let pass = group.get('password')?.value;
    let confirmPass = group.get('confirmPassword')?.value
    return pass === confirmPass ? null : { passwordNotSame: true }
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

  toggleFieldTextType(){
    this.fieldTextType = !this.fieldTextType;
  }

  toggleFieldTextTypeTwo(){
    this.fieldTextTypeCp = !this.fieldTextTypeCp;
  }

  get registerFormControls() {
    return this.registerForm.controls;
  }

  /**
   * Registrations Process
   */
  onRegister() {
    this.registerFormSubmitted = true;
    this.registerFormProcessing = true;
    if (this.registerForm.valid) {
      let params = {
        ...this.registerForm.value,
      }
      if(!this.regulated) params.wallet_address = this.account?.walletAddress
      else delete params.confirmPassword;
      this.accountService.register(params, this.regulated).subscribe({
        next: (response: any) => {
          this.registerProcess(response);
        },
        error: (error: any) => {
          this.registerFormProcessing = false;
          this.registerFormSubmitted = false;
          this.toastr.error(error?.error?.message || "Something went wrong, try again later.");
        },
      });
    } else {
      this.registerFormProcessing = false;
      this.toastr.error('Please fill all the required fields.');
    }
  }

  /**
   * Registers process
   * @param response
   */
  public registerProcess(response:any){
    let user: any = response;
    this.webStorageService.setLocalStorage('user', JSON.stringify(user.data));
    this.webStorageService.setLocalStorage('account', JSON.stringify({walletAddress: user.data.wallet_address, chainId: environment.DEFAULT_CHAIN, walletProvider: "", networkId: Number(environment.DEFAULT_NETWORK), init: false }));
    this.registerFormProcessing = false;
    this.registerFormSubmitted = false;
    this.registerForm.reset();
    // this.toastr.success('Registered successfully.');
    this.router.navigate(['/verify-email'])
  }
  /**
   * Googles signin
   * @param googleWrapper
   */
  public googleSignin(googleWrapper: any) {
    googleWrapper.click();
    this.authSubscription = this.authService.authState.subscribe((user) => {
      const obj = {
        email:user.email,
        name:user.name,
        apple_signin: false,
        google_signIn: true
      }
      this.accountService.googleAuth(obj).subscribe((response) => {
        this.registerProcess(response)
      },
      (error) => {
        this.toastr.error(error?.error?.message || "Something went wrong, try again later.");
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
          this.registerProcess(response);
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

  getDocument() {
    this.manageDocumentService.getDocument('privacy_policy').subscribe((response:any) => {
      if(response['data'].file){
      this.privacyPolicyUrl = response['data'].file[0].Url;
      }
    })
    this.manageDocumentService.getDocument('user_agreement').subscribe((response:any) => {
      if(response['data'].file){
      this.userAggrementUrl = response['data'].file[0].Url;
      }
    })
  }

  /**
   * Checks if a specific password strength validation error is present.
   * @param {string} validation - The name of the validation rule to check.
   * @returns {boolean} - True if the specified validation error is present; otherwise, false.
   */
    isValid(validation: string): boolean {
      return this.registerFormControls['password']?.errors?.['passwordStrength']?.[validation];
    }
}
