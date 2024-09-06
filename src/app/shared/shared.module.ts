import { NgxSliderModule } from '@angular-slider/ngx-slider';
import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ModalModule } from 'ngx-bootstrap/modal';
import { CarouselModule } from 'ngx-owl-carousel-o';
import { DebounceClickDirective } from './../shared/directives/debounce-click.directive';
import { ContractTransactionsComponent } from './components/contract-transactions/contract-transactions.component';
import { FiltersComponent } from './components/filters/filters.component';
import { FooterNewComponent } from './components/footer-new/footer-new.component';
import { ForgotpasswordComponent } from './components/forgotpassword/forgotpassword.component';
import { GoogleSigninComponent } from './components/google-signin/google-signin.component';
import { HeaderNewComponent } from './components/header-new/header-new.component';
import { PaginationComponent } from './components/pagination/pagination.component';
import { PassowrdUpdateComponent } from './components/passowrd-update/passowrd-update.component';
import { PrivacyComponent } from './components/privacy/privacy.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { SignInComponent } from './components/sign-in/sign-in.component';
import { SignUpComponent } from './components/sign-up/sign-up.component';
import { TermsComponent } from './components/terms/terms.component';
import { TransactionDetailsModalComponent } from './components/transaction-details-modal/transaction-details-modal.component';
import { TransactionLogsComponent } from './components/transaction-logs/transaction-logs.component';
import { CopyDirective } from './directives/copy.directive';
import { CustomTooltipDirective } from './directives/custom-tooltip.directive';
import { PreventNegativeDirective } from './directives/prevent-negative.directive';
import { ThousandSeparatorPipe } from './pipes/thousand-separator.pipe';
import { UtcConverterPipe } from './pipes/utc-convwrter.pipe';
import { MailverficationComponent } from './components/mailverfication/mailverfication.component';
import { CustodymailverificationComponent } from './components/custodymailverification/custodymailverification.component';
import { SafePipe } from './pipes/safe.pipe';
import { SafeHtmlPipe } from './pipes/safe-html.pipe';

@NgModule({
  declarations: [
    HeaderNewComponent,
    FooterNewComponent,
    SidebarComponent,
    FiltersComponent,
    SignInComponent,
    SignUpComponent,
    ForgotpasswordComponent,
    GoogleSigninComponent,
    PassowrdUpdateComponent,
    CustomTooltipDirective,
    DebounceClickDirective,
    PrivacyComponent,
    TermsComponent,
    UtcConverterPipe,
    CopyDirective,
    ThousandSeparatorPipe,
    ContractTransactionsComponent,
    TransactionLogsComponent,
    PaginationComponent,
    TransactionDetailsModalComponent,
    PreventNegativeDirective,
    MailverficationComponent,
    CustodymailverificationComponent,
    SafePipe,
    SafeHtmlPipe
  ],
  imports: [
    CommonModule,
    FormsModule, ReactiveFormsModule,
    RouterModule,
    ModalModule,
    CarouselModule,
    NgxSliderModule
  ],
  exports: [
    HeaderNewComponent,
    FooterNewComponent,
    SidebarComponent,
    FiltersComponent,
    SignInComponent,
    SignUpComponent,
    ForgotpasswordComponent,
    GoogleSigninComponent,
    CustomTooltipDirective,
    DebounceClickDirective,
    UtcConverterPipe,
    NgxSliderModule,
    ThousandSeparatorPipe,
    ContractTransactionsComponent,
    TransactionLogsComponent,
    PaginationComponent,
    PreventNegativeDirective,
    MailverficationComponent,
    SafePipe
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [CopyDirective]
})
export class SharedModule { }
