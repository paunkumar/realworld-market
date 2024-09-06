import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { OwlOptions } from 'ngx-owl-carousel-o';
import { ToastrService } from 'ngx-toastr';
import { CommonService } from 'src/app/shared/services/common.service';
import { AccountService } from '../../services/account.service';
import { Router } from '@angular/router';
import { forbidUppercase } from '../../Hepler/custom-form-validators';

@Component({
  selector: 'app-forgotpassword',
  templateUrl: './forgotpassword.component.html',
  styleUrls: ['./forgotpassword.component.css']
})
export class ForgotpasswordComponent {

  forgotPasswordFormSubmitted: boolean = false;
  forgotPasswordFormProcessing: boolean = false;
  forgotPasswordForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email, forbidUppercase()]]
  });

  constructor(
    private commonservices:CommonService,
    private fb: FormBuilder,
    private toastr: ToastrService,
    private accountService: AccountService,
    private router: Router
  ){

  }
  ngOnInit():void{
    this.commonservices.setHeaderHide(true);
  }
  routingHome(){
    this.commonservices.setHeaderHide(false);
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

  get forgotPasswordFormControls() {
    return this.forgotPasswordForm.controls;
  }

  forgotPassword() {
    try {
      this.forgotPasswordFormSubmitted = true;
      this.forgotPasswordFormProcessing = true;
      if (!this.forgotPasswordForm.valid) return this.toastr.error('Enter valid email address.');
      this.accountService.forgotPassword(this.forgotPasswordForm.value.email).subscribe({
        next: (response: any) => {
          this.toastr.success('Check mail to reset password');
          this.router.navigate(['/sign-in'])
        },
        error: (error: any) => {
          this.handleError(error);
        }
      })
    } catch(error) {
      this.forgotPasswordFormSubmitted = false;
      this.forgotPasswordFormProcessing = false;
    }
  }

  async handleError(error: any) {
    error = await JSON.stringify(error, null, 2);
    error = await JSON.parse(error);
    this.toastr.error(error?.error?.data?.message || error.shortMessage || error.error.message || "Something went wrong, try again later.");
  }
}
