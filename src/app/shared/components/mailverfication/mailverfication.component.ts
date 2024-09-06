import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { forbidUppercase } from '../../Hepler/custom-form-validators';
import { AccountService } from '../../services/account.service';
import { WebStorageService } from '../../services/web-storage.service';
import { IApiResponse } from '../../utils/common.interface';

@Component({
  selector: 'app-mailverfication',
  templateUrl: './mailverfication.component.html',
  styleUrls: ['./mailverfication.component.css']
})
export class MailverficationComponent implements OnInit {
  submitted = false;
  emailForm!: FormGroup;
  showStepOne = false;
  showStepTwo = false;
  showStepThree = false;
  isEditing = false;
  @Output() closeModal = new EventEmitter();
  @Output() openModal = new EventEmitter();
  user!: { [key: string]: any };
  isDisabled = false;
  extractedPath = '';

  /**
   * constructor
   */
  constructor(
    private fb: FormBuilder,
    private accountService: AccountService,
    private toastr: ToastrService,
    private webStorageService: WebStorageService,
    private route: ActivatedRoute,
  ) {

  }
  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const id = params['id'];
      const token = params['token'];
      if (id && token) {
        this.confirmEmail(id,token);
      }

    });
    this.extractedPath = window.location.pathname + window.location.search;
    this.user = this.webStorageService.getLocalStorage('user') != null ? JSON.parse(this.webStorageService.getLocalStorage('user') || 'undefined') : this.user;
    this.emailForm = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email, forbidUppercase()]],
      wallet_address:[''],
      url:[this.extractedPath]
    })

  }
  get f() { return this.emailForm?.controls as { [key: string]: AbstractControl }; }


  onSubmit() {
    this.emailForm.patchValue({
      wallet_address: this.user?.['wallet_address'],
      // url:this.extractedPath
    });
    this.submitted = true;
    if (this.emailForm.invalid) {
      this.toastr.error('Please fill all the required fields.');
      this.emailForm.markAllAsTouched();
      return
    }
    console.log(this.emailForm.value);

    this.accountService.updateProfile(this.emailForm.value).subscribe({
      next: (response: IApiResponse) => {
        this.webStorageService.setLocalStorage('user', JSON.stringify(response?.data));
        this.user = this.webStorageService.getLocalStorage('user') != null ? JSON.parse(this.webStorageService.getLocalStorage('user') || 'undefined') : this.user;
        this.showStepTwo = true;
        this.showStepOne = this.isEditing=false;
        this.emailForm.reset();
        this.submitted = false;
      },
      error: (error: HttpErrorResponse) => {
        this.toastr.error(error?.error?.message || "Something went wrong, try again later.");
        this.submitted = false;
      }
    })
  }

    /**
   * resend verification email
   */
    resendVerificationEmail() {
      this.isDisabled = true;
      this.extractedPath = window.location.pathname + window.location.search;
      this.accountService.resendVerificationEmail({ email: this.user['email'],url:this.extractedPath }).subscribe({
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

  /**
   * on edit
   */
  onEdit() {
    this.showStepOne = this.isEditing=true;
    this.showStepTwo = false;
    this.user = this.webStorageService.getLocalStorage('user') != null ? JSON.parse(this.webStorageService.getLocalStorage('user') || 'undefined') : this.user;
    this.emailForm.patchValue({
      fullName: this.user?.['name'],
      email: this.user?.['email'],
    });

  }

  /**
   * close step one
   */
  closeStepOne() {
    this.showStepOne = this.isEditing = false;
    this.closeModal.emit();
    this.emailForm.reset()
  }

    /**
   * confirm email
   * @param {string}id
   * @param {string}token
   */
    private confirmEmail(id:string,token:string) {
      this.accountService.confirmEmail({ id: id, token: token }).subscribe({
        next: (response: IApiResponse) => {
          let userData = JSON.parse(this.webStorageService.getLocalStorage('user')!);
          userData.email_verified = true;
          this.webStorageService.setLocalStorage('user', JSON.stringify(userData));
          this.user = this.webStorageService.getLocalStorage('user') != null ? JSON.parse(this.webStorageService.getLocalStorage('user') || 'undefined') : this.user;
          this.openModal.emit();
          this.showStepThree = true;
          this.toastr.success(response.message);
        },
        error: (error: HttpErrorResponse) => {
          this.toastr.error(error?.error?.message || "Something went wrong, try again later.");
        }
      })
    }

}
