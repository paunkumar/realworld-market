import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { ToastrService } from 'ngx-toastr';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ITransactionDetails } from '../../Hepler/helper';
import { CommonService } from '../../services/common.service';
import { TransactionService } from '../../services/transaction.service';
import { WebStorageService } from '../../services/web-storage.service';
import { AccountService } from '../../services/account.service';

@Component({
  selector: 'app-contract-transactions',
  templateUrl: './contract-transactions.component.html',
  styleUrls: ['./contract-transactions.component.css']
})
export class ContractTransactionsComponent implements OnInit, OnDestroy {
  @ViewChild('transactionDetailsModal', { static: false }) transactionDetailsModal?: ModalDirective;

  showtransactiondetail: boolean = false;
  account: any;
  user: any;
  transactions: any[] = [];
  transaction: any = {};
  transhUrl: string = '';
  private commonServiceSubscription: any;
  transactionData: any = {};
  activeIndices: number[] = [];
  activeNft: any[] = [];
  transactionModalData: ITransactionDetails;
  transactionLoader = false;
  searchControl = new FormControl();
  unsubscribeSearchControl = new Subject<void>();
  viewTransactionDetails: any;
  imageLoading: boolean = true;


  /**
   * Creates an instance of contract transactions component.
   * @param transactionService
   * @param webStorageService
   * @param toastr
   * @param commonService
   */
  constructor(
    private transactionService: TransactionService,
    private webStorageService: WebStorageService,
    private toastr: ToastrService,
    private commonService: CommonService,
    private accountService: AccountService
  ) {
    this.transactionModalData = this.getDefaultTransactionDetails();
  }

  /**
   * Gets default transaction details
   * @param [overrides]
   * @returns default transaction details
   */
  getDefaultTransactionDetails(overrides?: Partial<ITransactionDetails>): ITransactionDetails {
    const defaultDetails: ITransactionDetails = {
      activeNft: {},
      transactionHash: '',
      contractAddress: '',
      operationName: '',
      operationStatus: 0,
      transactionTime: '',
      errorMessage: '',
      nfts: [
        {
          _id: '',
          name: '',
          primary_media: '',
          collectionAddress: '',
          secondary_media:[]
        }
      ]
    };

    return { ...defaultDetails, ...overrides };
  }


  /**
   * on init
   */
  ngOnInit(): void {
    this.account = this.webStorageService.getLocalStorage('account') != null ? JSON.parse(this.webStorageService.getLocalStorage('account') || '') : this.account;
    this.user = this.webStorageService.getLocalStorage('user') != null ? JSON.parse(this.webStorageService.getLocalStorage('user') || 'undefined') : this.user;
    if (this.account?.chainId) {
      this.transhUrl = (environment as any)[this.account?.chainId].EXPLORER;
      this.getTransactions();
      this.getViewTransactions();
    }

    this.commonServiceSubscription = this.commonService.transactionListener.subscribe(response => {
      if (response.status) {
        this.getTransactions();
        if(response.count == 1){
          this.updateViewTransactions();
        }

      }
    });

    this.searchControl.valueChanges.
    pipe(debounceTime(2000),takeUntil(this.unsubscribeSearchControl)).
    subscribe((response) => {
      this.search(response);
    })
  }

  /**
   * on destroy
   */
  ngOnDestroy(): void {
    if (this.commonServiceSubscription) {
      this.commonServiceSubscription.unsubscribe();
    }
  }

  /**transacation expand and collapse */
  showTransacation() {
    this.showtransactiondetail = !this.showtransactiondetail;
    this.updateViewTransactions(0);
  }

  setTransaction(transaction: any) {
    this.transaction = transaction;
    this.transactionData = transaction
    this.transactionDetailsModal?.show();
  }

  public openTransactionDetailsPopup(transaction: any, activeNft: any): void {
    for (const nft of transaction.nft_id) {
      nft.fileType = nft.preview_image ? nft?.preview_image.split('.')[nft?.preview_image.split('.').length - 1] : nft?.primary_media.split('.')[nft?.primary_media.split('.').length - 1];
    }
    this.transactionModalData = this.getDefaultTransactionDetails({
      activeNft: activeNft,
      transactionHash: transaction.transaction_hash,
      contractAddress: transaction.to,
      operationName: transaction.transaction_name,
      operationStatus: transaction.status,
      transactionTime: transaction.createdAt,
      errorMessage: transaction.error_message,
      nfts: transaction.nft_id
    });
    console.log(this.transactionModalData);

    this.transactionData = transaction
    this.transactionDetailsModal?.show();
  }

  /**
   * Closes transaction modal
   */
  closeTransactionModal() {
    this.transactionModalData = this.getDefaultTransactionDetails();
    this.transactionDetailsModal?.hide()
  }

  /**
   * Gets transactions
   * @param [keyword]
   */
  getTransactions(keyword?: string) {
    this.transactionLoader = true;
    this.transactionService.getTransactions(this.user._id, keyword).subscribe({
      next: (response: any) => {
        this.transactionLoader = false;
        this.transactions = response.data || [];
        this.transactions.map((transaction) => transaction.nft_id.map((nft: any) => {
          nft.fileType = nft.preview_image ? nft?.preview_image.split('.')[nft?.preview_image.split('.').length - 1] : nft?.primary_media.split('.')[nft?.primary_media.split('.').length - 1];
        }));
        // Initialize active indices to 0 for each ngFor block
        this.activeIndices = new Array(response.data.length).fill(0);
        this.setActiveNft();
      },
      error: (error: any) => {
        this.transactionLoader = false;
        // this.toastr.error(error?.data?.message || "Something went wrong, try again later.");
      }
    })
  }

  /**
   * Sets active nft
   */
  setActiveNft(): void {
    this.transactions = this.transactions.map(nfts => {
      return {
        ...nfts,
        active_nft: nfts.nft_id[0]
      };
    });
    this.transactions.map((tx: any) => {
      if (tx.active_nft) {
        tx.active_nft.fileType = tx.active_nft?.preview_image ?
          tx.active_nft?.preview_image.split('.')[tx.active_nft?.preview_image.split('.').length - 1] :
          tx.active_nft?.primary_media.split('.')[tx.active_nft?.primary_media.split('.').length - 1];
      }
    });
  }

  /**
   * Search with transaction details
   * @param keyword
   */
  search(keyword: string): void {
    this.getTransactions(keyword);
  }

  /**
   * Sets active index
   * @param index
   */
  setActiveIndex(transactionIndex: number, nftIndex: number): void {
    this.activeIndices[transactionIndex] = nftIndex;
    this.transactions[transactionIndex].active_nft = this.transactions[transactionIndex].nft_id[nftIndex]
  }

  /**
   * Gets view transactions
   */
  getViewTransactions(){
    this.transactionService.getViewTransactions(this.user._id).subscribe({
      next: (response: any) => {
        this.viewTransactionDetails = response['data'];
      },
      error: (error) => {
        if (error?.error?.status_code === 401) {
          this.accountService.updateAuthentication(false);
          this.toastr.error("Authentication failed. Login again to continue.");
        }
      }
    })
  }

  /**
   * Updates view transactions
   * @param {number} count
   */
  updateViewTransactions(count?:number){
    let totalCount = 0;
    if(count != 0){
      totalCount = this.viewTransactionDetails?.['count'] ? this.viewTransactionDetails?.['count'] + 1 : 1;
    }
    const data = {
      user_id:this.user._id,
      count:totalCount
    }
    this.transactionService.updateViewTransactions(data).subscribe((response) => {
      this.getViewTransactions();
    })

  }

}
