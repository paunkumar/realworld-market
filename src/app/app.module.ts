import { GoogleLoginProvider, SocialAuthServiceConfig, SocialLoginModule } from '@abacritt/angularx-social-login';
import { CommonModule } from '@angular/common';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgApexchartsModule } from 'ng-apexcharts';
import { ModalModule } from 'ngx-bootstrap/modal';
import { ClipboardModule } from 'ngx-clipboard';
import { NgxFileDropModule } from 'ngx-file-drop';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { CarouselModule } from 'ngx-owl-carousel-o';
import { ToastrModule } from 'ngx-toastr';
import { environment } from 'src/environments/environment';
import { HomeNewRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { RegulatedInterceptor } from './core/interceptors/regulated.interceptor';
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
import { NftsListingComponent } from './module/youritems/nfts-listing/nfts-listing.component';
import { RedeemAssetComponent } from './module/youritems/redeem-asset/redeem-asset.component';
import { YouritemsComponent } from './module/youritems/youritems.component';
import { ConfirmationModalComponent } from './shared/components/confirmation-modal/confirmation-modal.component';
import { KycComponent } from './shared/components/kyc/kyc.component';
import { ProgressModalComponent } from './shared/components/progress-modal/progress-modal.component';
import { SharedModule } from './shared/shared.module';
import { ContractUtils } from './shared/utils/contract-utils';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    YouritemsComponent,
    BorrowComponent,
    LendComponent,
    BorrowHistoryComponent,
    PagenotfoundComponent,
    LendingHistoryComponent,
    OnboardassetsComponent,
    ProgressModalComponent,
    NftDetailComponent,
    LoanDetailComponent,
    KycComponent,
    IdenfyRedirectionComponent,
    BorrowLoanComponent,
    NftsListingComponent,
    ConfirmationModalComponent,
    NewDashboardComponent,
    FaqComponent,
    TransactionsDetailsComponent,
    SingleTransactionDetailsComponent,
    RedeemAssetComponent
  ],
  imports: [
    CommonModule,
    BrowserModule,
    SharedModule,
    HomeNewRoutingModule,
    ModalModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    CarouselModule,
    BrowserAnimationsModule,
    NgxFileDropModule,
    ToastrModule.forRoot(
      {
        timeOut: 10000,
        closeButton: true,
        preventDuplicates: true
      }),
    SocialLoginModule,
    ClipboardModule,
    InfiniteScrollModule,
    NgApexchartsModule,
    NgxSkeletonLoaderModule.forRoot({ animation: 'pulse' })
  ],
  bootstrap: [AppComponent],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: RegulatedInterceptor, multi: true },
    {
      provide: 'SocialAuthServiceConfig',
      useValue: {
        autoLogin: false,
        providers: [
          {
            id: GoogleLoginProvider.PROVIDER_ID,
            provider: new GoogleLoginProvider(
              environment.GOOGLE_LOGIN_PROVIDER
            )
          }
        ],
        onError: (err) => {
          console.error(err);
        }
      } as SocialAuthServiceConfig,
    },
    ContractUtils
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule { }


