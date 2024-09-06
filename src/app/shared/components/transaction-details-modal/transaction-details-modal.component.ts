import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { getPublicClient } from '@wagmi/core';
import { environment } from 'src/environments/environment';
import { formatEther } from 'viem';
import { ITransactionDetails } from '../../Hepler/helper';
import { WebStorageService } from '../../services/web-storage.service';

interface ITxDetails {
  gasPrice: number;
  blockNumber: number;
}

@Component({
  selector: 'app-transaction-details-modal',
  templateUrl: './transaction-details-modal.component.html',
  styleUrls: ['./transaction-details-modal.component.css']
})
export class TransactionDetailsModalComponent {
  @Input() transactionModalData: ITransactionDetails;
  @Output() closeModal = new EventEmitter();
  transhUrl: string = '';
  account: any;
  publicClient: any = getPublicClient();
  public txDetails: ITxDetails = {
    gasPrice: 0,
    blockNumber: 0,
  }
  public isRegulated: boolean = false;
  imageLoading = true;

  /**
   * Creates an instance of transaction details modal component.
   * @param webStorageService
   */
  constructor(
    private webStorageService: WebStorageService
  ) {
    this.transactionModalData = this.getDefaultTransactionDetails();
  }

  /**
   * on init
   */
  ngOnInit() {
    this.account = this.webStorageService.getLocalStorage('account') != null ? JSON.parse(this.webStorageService.getLocalStorage('account') || '') : this.account;
    this.transhUrl = (environment as any)[this.account?.chainId]?.EXPLORER;
    this.isRegulated = JSON.parse(this.webStorageService.getLocalStorage('regulated') || 'true');
  }

  /**
   * Gets default transaction details
   * @param [overrides]
   * @returns default transaction details
   */
  getDefaultTransactionDetails(overrides?: Partial<ITransactionDetails>): ITransactionDetails {
    const defaultDetails: ITransactionDetails = {
      activeNft: '',
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

  async ngOnChanges(changes: SimpleChanges) {
    if(this.transactionModalData?.transactionHash) {
      const txData: any = await this.publicClient.getTransaction({
        hash: this.transactionModalData?.transactionHash
      })
      const gasInWei: any = formatEther(txData?.gasPrice);
      this.txDetails = {
        gasPrice: gasInWei,
        blockNumber: txData?.blockNumber
      }
    }
  }

  /**
   * Sets active nft
   * @param index
   */
  setActiveNft(index: number) {
    this.transactionModalData.activeNft = this.transactionModalData.nfts[index];
  }

  /**
   * Closes transaction modal
   */
  closeTransactionModal() {
    this.transactionModalData = this.getDefaultTransactionDetails();
    this.txDetails = {
      gasPrice: 0,
      blockNumber: 0
    }
    this.closeModal.emit();
  }

}
