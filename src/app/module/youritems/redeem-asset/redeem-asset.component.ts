import { HttpErrorResponse } from '@angular/common/http';
import { Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { ToastrService } from 'ngx-toastr';
import { AccountService } from 'src/app/shared/services/account.service';
import { CommonService } from 'src/app/shared/services/common.service';
import { DeliveryService } from 'src/app/shared/services/delivery.service';
import { NftService } from 'src/app/shared/services/nft.service';
import { SocketService } from 'src/app/shared/services/socket.service';
import { WebStorageService } from 'src/app/shared/services/web-storage.service';
import { IApiResponse } from 'src/app/shared/utils/common.interface';
@Component({
  selector: 'app-redeem-asset',
  templateUrl: './redeem-asset.component.html',
  styleUrls: ['./redeem-asset.component.css']
})
export class RedeemAssetComponent {
  @ViewChild('progressModal', { static: false }) progressModal?: ModalDirective;
  Math: any = Math;
  account: any;
  isGridView: boolean = true;
  nfts: any[] = [];
  imageLoading: boolean = true;
  regulated: boolean = false;
  progressData: any = {};
  nonce: any;
  user: any;
  loader: boolean = true;
  showoverlay: boolean = false;
  currencyConversions: any[] = [];
  page: number = 1;
  limit: number = 10;
  routerUrl: string = '';
  nftsCount: number = 0;
  disableInfiniteScroll: boolean = false;
  showSortOptions: boolean = false;
  isCancellingDelivery = false;
  selectedNft : {[ket:string]:any} = {};
  @ViewChild('confirmationModal', { static: false }) confirmationModal?: ModalDirective;
  confirmationData: { [ket: string]: any } = {};
  processedImage: any = {};


  constructor(
    private commonService: CommonService,
    private webStorageService: WebStorageService,
    private nftService: NftService,
    private toastr: ToastrService,
    private router: Router,
    private accountService: AccountService,
    private deliveryService: DeliveryService,
    private socketService: SocketService,
  ) { }

  ngOnInit(): void {
    this.account = this.webStorageService.getLocalStorage('account') != null ? JSON.parse(this.webStorageService.getLocalStorage('account') || '') : this.account;
    this.user = this.webStorageService.getLocalStorage('user') != null ? JSON.parse(this.webStorageService.getLocalStorage('user') || 'undefined') : this.user;
    this.regulated = JSON.parse(this.webStorageService.getLocalStorage('regulated') || 'true');

    this.commonService.showGridViewObservable.subscribe((response: boolean) => {
      if (response) {
        this.isGridView = response;
      } else {
        this.isGridView = response;
      }
    })

    this.socketService.getCurrentDeliveryStatus().subscribe({
      next: (response: { [key: string]: any }) => {
        if (Object.keys(response).length > 0) {
          const index = this.nfts.findIndex(item => item._id === response['_id']);
          if (index !== -1) {
            this.nfts[index].status = response['status'];
          }
        }
      },
      error: (error: any) => {
        console.log('error');

      }
    })

    this.routerUrl = this.router.url;
    this.commonService.setTabEmitter({ type: 'assets' });
    this.account && this.getOwnerNfts();
    /*
     * overlay
     */
    this.commonService.showmodaloverlayObservable.subscribe((response: boolean) => this.showoverlay = response)
    this.commonService.closeModalsObservable.subscribe((response: boolean) => {
      if (response) {
        this.progressModal?.hide();
      }
    })
  }
  closeOveraly() {
    this.showoverlay = false;
    this.commonService.setOverlay(false)
  }
  getOwnerNfts() {
    if (this.page != null) {
      this.disableInfiniteScroll = true;
      this.nftService.getDeliveryNftsByOwner(this.user?._id, this.page, this.limit).subscribe({
        next: (response: any) => {
          if (this.page === 1) this.nfts = [];
          response?.data?.nfts && this.nfts.push(...response?.data?.nfts);
          this.nfts.forEach((nft: any) => {
            if (nft.nft_id) {
              const media = nft.nft_id.preview_image || nft.nft_id.primary_media;
              if (media) {
                const parts = media.split('.');
                nft.nft_id.fileType = parts[parts.length - 1];
              }
            }
          });
          this.page = response.data?.next_page;
          this.nftsCount = response.data?.total_NFTs;
          this.loader = false;
          this.disableInfiniteScroll = false;
          this.setTooltip(this.nfts);
        },
        error: (error: any) => {
          this.loader = false;
          this.disableInfiniteScroll = false;
          this.handleError(error);
        }
      })
    }
  }

  /**
   * cancel delivery request
   * @param{{[key:string]:any}}nft
   */
  cancelDelivery(nft:{[key:string]:any}) {
    this.isCancellingDelivery = true;
    this.selectedNft = nft;
    this.confirmationData = {
      image: [this.processImage()],
      content: `Are you sure you want to cancel the delivery of ` + `<b>${this.selectedNft?.['nft_id']?.['name']}</b>?`
    }
    this.confirmationModal?.show();

  }



  /**
   * cancel delivery request
   */
  confirmCancelDelivery() {
    const payload = {
      status: 6,
      user_id: this.user?._id
    }
    this.deliveryService.cancelDeliveryRequest(this.selectedNft?.['_id'], payload).subscribe({
      next: (response: IApiResponse) => {
        this.toastr.success(response.message);
        this.isCancellingDelivery = false;
        this.confirmationModal?.hide();
        this.selectedNft = {};
        this.page = 1;
        this.getOwnerNfts();
      },
      error: (error: HttpErrorResponse) => {
        this.isCancellingDelivery = false;
        this.confirmationModal?.hide();
        this.selectedNft = {};
        this.handleError(error);

      }

    })

  }

  async handleError(error: any, txId: any = '') {
    if (error?.error?.status_code === 401) {
      error.shortMessage = "Authentication failed. Login again to continue.";
      await this.accountService.updateAuthentication(false);
    }
    if (error?.shortMessage?.includes('reverted with the following reason:')) {
      let errorMessage = error?.shortMessage?.split('reverted with the following reason:');
      error.shortMessage = errorMessage[errorMessage.length - 1]
    }
    error = await JSON.stringify(error, null, 2);
    error = await JSON.parse(error);
    this.toastr.error(error?.error?.data?.message || error.shortMessage || "Something went wrong, try again later.");
    this.progressData.steps[this.progressData.currentStep].status = 3;
    this.progressData.failed = true;

  }



  async connectWallet() {
    await this.accountService.enableMetaMaskConnection(true)
  }

  /**
   * Sets tooltip
   * @param {any} allNfts
   */
  public setTooltip(allNfts: any) {
    setTimeout(() => {
      allNfts.forEach((_response: any, index: any) => {
        (<HTMLElement>document.getElementById(`tooltip-title${index}`)).classList.remove('add-content');
        const contentHeight = (<HTMLElement>document.getElementById(`tooltip-title${index}`)).scrollHeight;
        (<HTMLElement>document.getElementById(`tooltip-title${index}`)).classList.add('add-content');
        if (contentHeight > 59) {
          (<HTMLElement>document.getElementById(`tooltip-head${index}`)).classList.add('tooltip-details');
        }
        else {
          (<HTMLElement>document.getElementById(`tooltip-head${index}`)).classList.remove('tooltip-details');
        }
      })
    }, 1000);
  }

  /**
   * Sets tooltip based on screen size
   * @param {number} index
   */
  public setTooltipSize(index: number) {
    (<HTMLElement>document.getElementById(`tooltip-title${index}`)).classList.remove('add-content');
    const contentHeight = (<HTMLElement>document.getElementById(`tooltip-title${index}`)).scrollHeight;
    (<HTMLElement>document.getElementById(`tooltip-title${index}`)).classList.add('add-content');
    if (contentHeight > 59) {
      (<HTMLElement>document.getElementById(`tooltip-head${index}`)).classList.add('tooltip-details');
    }
    else {
      (<HTMLElement>document.getElementById(`tooltip-head${index}`)).classList.remove('tooltip-details')
    }
  }



  /**
   * on clicking redeem
   */
  onClickingRedeem() {
    this.commonService.setTabEmitter({ type: 'assets' })
  }

  setRoute() {
    this.webStorageService.setItem('previousRoute', this.router.url)
  }

  /**
   * process images to send to confirmation modal
   */
      private processImage() {
        if (this.selectedNft?.['nft_id']?.['fileType'] === 'html') {
          this.processedImage = {
            ...this.selectedNft,
            displayImage: this.selectedNft?.['nft_id']?.['preview_image'] ? this.selectedNft?.['nft_id']?.['preview_image'] : this.selectedNft?.['nft_id']?.['secondary_media'][0]
          };
        } else {
          this.processedImage = {
            ...this.selectedNft,
            displayImage: this.selectedNft?.['nft_id']?.['preview_image'] ? this.selectedNft?.['nft_id']?.['preview_image'] : this.selectedNft?.['nft_id']?.['primary_media']
          };
        }
        return this.processedImage;

      }
}
