import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { OwlOptions } from 'ngx-owl-carousel-o';
import { ToastrService } from 'ngx-toastr';
import { AccountService } from '../../services/account.service';
import { CommonService } from '../../services/common.service';

@Component({
    selector: 'app-passowrd-update',
    templateUrl: './passowrd-update.component.html',
    styleUrls: ['./passowrd-update.component.css']
})
export class PassowrdUpdateComponent {

    showpassword: boolean = false;
    showcpassword: boolean = false;
    resetPasswordForm!: FormGroup;
    resetPasswordFormSubmitted: boolean = false;
    userId: any;
    token: string = '';
    email: string = '';
    loader: boolean = true;

    constructor(
        private commonservices: CommonService,
        private fb: FormBuilder,
        private toastr: ToastrService,
        private accountService: AccountService,
        private router: Router,
        private route: ActivatedRoute
    ) { }

    ngOnInit(): void {
        this.commonservices.setHeaderHide(true);
        this.resetPasswordForm = this.fb.group({
            password: ['', [Validators.required, Validators.pattern(/^(?=[^A-Z]*[A-Z])(?=[^a-z]*[a-z])(?=\D*\d)(?=.*?[#?!@$%^&*-]).{12,}$/)]],
            confirmPassword: ['', [Validators.required]],
        }, { validators: this.checkPasswords });
        this.token = this.route.snapshot.queryParamMap.get('token') || '';
        this.validateToken();
    }

    validateToken() {
        this.accountService.validateToken(this.token).subscribe({
            next: (response: any) => {
                this.userId = response.data.user_id;
                this.email = response.data.email;
                this.loader = false;
            },
            error: (error) => {
                this.loader = false;
                this.toastr.error(error.error.message);
            }
        })
    }

    checkPasswords: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
        let pass = group.get('password')?.value;
        let confirmPass = group.get('confirmPassword')?.value
        return pass === confirmPass ? null : { passwordNotSame: true }
    }

    routingHome() {
        this.commonservices.setHeaderHide(false);
    }
    customOptions: OwlOptions = {
        loop: true,
        margin: 20,
        autoplay: true,
        autoplayTimeout: 10000,
        dots: true,
        nav: false,
        items: 1,
        mouseDrag: false,
        touchDrag: false,
        pullDrag: false,
    };
    passwordView() {
        this.showpassword = !this.showpassword;
    }
    passwordConfirmView() {
        this.showcpassword = !this.showcpassword;
    }

    get resetPasswordFormControls() {
        return this.resetPasswordForm.controls;
    }

    resetPassword() {
        this.resetPasswordFormSubmitted = true;
        if (!this.resetPasswordForm.valid) return;
        this.accountService.resetPassword(this.userId, { password: this.resetPasswordForm.value.password }).subscribe({
            next: (response: any) => {
                this.toastr.success('Password changed. Login with new password');
                this.router.navigate(['/sign-in']);
            },
            error: (error: any) => {
                this.handleError(error);
            }
        })
    }

    async handleError(error: any) {
        error = await JSON.stringify(error, null, 2);
        error = await JSON.parse(error);
        this.toastr.error(error?.error?.data?.message || error.shortMessage || "Something went wrong, try again later.");
    }
}
