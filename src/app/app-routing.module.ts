import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { BorrowHistoryComponent } from './module/borrow/borrow-history/borrow-history.component';
import { BorrowLoanComponent } from './module/borrow/borrow-loan/borrow-loan.component';
import { BorrowComponent } from './module/borrow/borrow.component';
import { DashboardComponent } from './module/dashboard/dashboard.component';
import { FaqComponent } from './module/faq/faq.component';
import { IdenfyRedirectionComponent } from './module/idenfy-redirection/idenfy-redirection.component';
import { LendComponent } from './module/lend/lend.component';
import { LendingHistoryComponent } from './module/lend/lending-history/lending-history.component';
import { LoanDetailComponent } from './module/loan-detail/loan-detail.component';
import { NewDashboardComponent } from './module/new-dashboard/new-dashboard.component';
import { SingleTransactionDetailsComponent } from './module/new-dashboard/single-transaction-details/single-transaction-details.component';
import { TransactionsDetailsComponent } from './module/new-dashboard/transactions-details/transactions-details.component';
import { NftDetailComponent } from './module/nft-detail/nft-detail.component';
import { OnboardassetsComponent } from './module/onboardassets/onboardassets.component';
import { PagenotfoundComponent } from './module/pagenotfound/pagenotfound.component';
import { RedeemAssetComponent } from './module/youritems/redeem-asset/redeem-asset.component';
import { YouritemsComponent } from './module/youritems/youritems.component';
import { CustodymailverificationComponent } from './shared/components/custodymailverification/custodymailverification.component';
import { ForgotpasswordComponent } from './shared/components/forgotpassword/forgotpassword.component';
import { KycComponent } from './shared/components/kyc/kyc.component';
import { PassowrdUpdateComponent } from './shared/components/passowrd-update/passowrd-update.component';
import { PrivacyComponent } from './shared/components/privacy/privacy.component';
import { SignInComponent } from './shared/components/sign-in/sign-in.component';
import { SignUpComponent } from './shared/components/sign-up/sign-up.component';
import { TermsComponent } from './shared/components/terms/terms.component';
import { AuthService } from './shared/services/auth.service';

const routes: Routes = [
  { path: '', component: DashboardComponent, pathMatch: 'full', canActivate: [authGuard] },
  { path: 'dashboard', component: NewDashboardComponent, canActivate: [authGuard] },
  { path: 'my-wallet', component: YouritemsComponent, canActivate: [authGuard] },
  { path: 'borrow', component: BorrowComponent, canActivate: [authGuard] },
  { path: 'lend', component: LendComponent, canActivate: [authGuard] },
  {
    path: 'sign-in',
    component: SignInComponent,
    canActivate: [AuthService]
  },
  {
    path: 'sign-up',
    component: SignUpComponent,
    canActivate: [AuthService]
  },
  {
    path: 'forgot-password',
    component: ForgotpasswordComponent,
    canActivate: [AuthService]
  },
  {
    path: 'reset-password',
    component: PassowrdUpdateComponent,
    canActivate: [AuthService]
  },
  { path: 'borrow-history', component: BorrowHistoryComponent, canActivate: [authGuard] },
  { path: 'loan-request', component: BorrowLoanComponent, canActivate: [authGuard] },
  { path: 'borrow-detail/:id', component: LoanDetailComponent, canActivate: [authGuard] },
  { path: 'lending-history', component: LendingHistoryComponent, canActivate: [authGuard] },
  { path: 'lending-detail/:id', component: LoanDetailComponent, canActivate: [authGuard] },
  { path: 'onboardassets', component: OnboardassetsComponent, canActivate: [authGuard] },
  { path: 'kyc', component: KycComponent, canActivate: [authGuard] },
  { path: 'nft-detail/:collection/:tokenId', component: NftDetailComponent, canActivate: [authGuard] },
  { path: 'lazy-mint/:id', component: NftDetailComponent, canActivate: [authGuard] },
  { path: 'kyc-verify/:status', component: IdenfyRedirectionComponent, canActivate: [authGuard] },
  { path: 'privacy-policy', component: PrivacyComponent },
  { path: 'terms-and-conditions', component: TermsComponent },
  { path: 'faq', component: FaqComponent },
  { path: 'dashboard/transactions-details', component: TransactionsDetailsComponent, canActivate: [authGuard] },
  { path: 'dashboard/single-transaction-details/:id', component: SingleTransactionDetailsComponent, canActivate: [authGuard] },
  { path: 'redeem-asset', component: RedeemAssetComponent, canActivate: [authGuard] },
  { path: 'verify-email', component: CustodymailverificationComponent },
  { path: 'confirm-email', component: CustodymailverificationComponent },
  { path: '**', component: PagenotfoundComponent, pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    scrollPositionRestoration: 'enabled',
    bindToComponentInputs: true
  })],
  exports: [RouterModule]
})
export class HomeNewRoutingModule {

}
