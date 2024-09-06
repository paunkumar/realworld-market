import { ChangeDetectorRef, Component, ElementRef, HostListener, OnDestroy, OnInit, Renderer2, ViewChild } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { disconnect, switchNetwork, watchAccount, watchNetwork } from '@wagmi/core';
import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi';
import { ModalDirective, ModalOptions } from 'ngx-bootstrap/modal';
import { ToastrService } from 'ngx-toastr';
import { polygon } from 'viem/chains';
import { polygonAmoy } from './chains/polygonAmoy';

import { SocialAuthService } from '@abacritt/angularx-social-login';
import { FormControl } from '@angular/forms';
import moment from 'moment';
import { ClipboardService } from 'ngx-clipboard';
import { Subject, debounceTime, filter, takeUntil } from 'rxjs';
import { CommonService } from 'src/app/shared/services/common.service';
import { WebStorageService } from 'src/app/shared/services/web-storage.service';
import { environment } from 'src/environments/environment';
import { getAddress } from 'viem';
import { AccountService } from '../../services/account.service';
import { NftService } from '../../services/nft.service';
import { NotificationService } from '../../services/notification.service';
import { SocketService } from '../../services/socket.service';
import { AnnouncementService } from '../../services/announcement.service';
import { IApiResponse } from '../../utils/common.interface';

@Component({
    selector: 'app-header-new',
    templateUrl: './header-new.component.html',
    styleUrls: ['./header-new.component.css']
})
export class HeaderNewComponent implements OnInit, OnDestroy {

    @ViewChild('switchNetworkModal', { static: false }) switchNetworkModal?: ModalDirective;
    showProfile: boolean = false;
    showMenu: any;
    modalConfig: ModalOptions = {
        animated: true,
        keyboard: false,
        backdrop: 'static',
        ignoreBackdropClick: true
    };
    regulated: boolean = JSON.parse(localStorage.getItem('regulated') || 'null');
    web3Modal: any;
    unwatchAccount: any;
    unwatchNetwork: any;
    account: any = { walletAddress: "", chainId: "", walletProvider: "", networkId: "", init: true };
    user: any;
    connectObservable: any;
    authenticationObservable: any;
    clicked: any;
    regulatedBalance: number = 0;
    maticPrice: number = 0;
    public loaderStatus: boolean = true;
    public loaderObservable: any;
    searchKeyword: string = "";
    searchKeywordObservable: any;
    nftCount: number = 0;
    currencies: any[] = [];
    defaultNetwork: string = 'null'
    notifications: any[] = [];
    notificationCount: number = 0;
    kycStatus: any = {};
    hasUnreadNotifications: boolean = false;
    recentSearch: Array<any> = [];
    isSearch = false;
    searchControl = new FormControl({ value: '', disabled: true });
    private unsubscribeSearch$ = new Subject<void>();
    isSearchLoading = false;
    isNotification: boolean = false;
    notification: any = {};
    tokenBalanceInterval: any;
    isExpand: boolean = false;
    announceData: any = {}
    isShowSearch:boolean=true;
    constructor(
        private webStorageService: WebStorageService,
        public router: Router,
        private toastr: ToastrService,
        private commonService: CommonService,
        private accountService: AccountService,
        private nftService: NftService,
        private clipboardService: ClipboardService,
        private socketService: SocketService,
        private cdref: ChangeDetectorRef,
        private notificationService: NotificationService,
        private elementRef: ElementRef,
        private authService: SocialAuthService,
        private announce: AnnouncementService,
        private renderer: Renderer2
    ) { }

    ngOnInit() {
        this.commonService.showSearch$.subscribe((show) => this.isShowSearch = show);

        this.getAdminAnnouncement();
        this.defaultNetwork = environment.DEFAULT_NETWORK;
        this.loaderObservable = this.accountService.loaderStatus.subscribe((response) => {
            this.loaderStatus = response;
            response ? this.searchControl.disable() : this.searchControl.enable();
            this.cdref.detectChanges();
        })
        this.connectObservable = this.accountService.connectObservable.subscribe((response: any) => {
            if (response) {
                this.web3Modal?.open();
            }
        })

        this.account = this.webStorageService.getLocalStorage('account') != null ? JSON.parse(this.webStorageService.getLocalStorage('account') || '') : this.account;
        this.user = this.webStorageService.getLocalStorage('user') != null ? JSON.parse(this.webStorageService.getLocalStorage('user') || 'undefined') : this.user;
        if (this.user && !this.user?.name) {
            let emailSplit = (this.user.email)?.split('@');
            this.user.name = emailSplit?.[0];
        }

        // wallet connect initialization
        const metadata = {
            name: 'Real World',
            description: 'RealWorld.fi - Marketplace',
            url: environment.WEB_SITE_URL,
            icons: ['https://avatars.githubusercontent.com/u/37784886']
        }
        const chains = environment.ENVNAME === 'PRODUCTION' || environment.ENVNAME === 'PRE_PRODUCTION' ? [polygon] : environment.ENVNAME === 'STAGING' ? [polygon, polygonAmoy] : [polygonAmoy];
        const projectId = environment.WALLET_CONNECT_PROJECT_ID;
        const wagmiConfig = defaultWagmiConfig({ chains, projectId, metadata })

        this.searchKeywordObservable = this.nftService.searchKeywordObservable.subscribe(async (response: any) => {
            if (response) {
                this.searchKeyword = response;
                this.searchControl.setValue(response)
            }
        })

        this.socketService.connect();

        // Using router events to trigger code on every route change
        this.router.events.pipe(filter((event: any) => event instanceof NavigationEnd)).subscribe(async (data) => {
            if (data.url.includes('?regulated=')) {
                let urlSplit = data.url.split('?regulated=');
                let regulation = urlSplit[urlSplit.length - 1].includes('&') ? urlSplit[urlSplit.length - 1].split('&')[0] : urlSplit[urlSplit.length - 1];
                let regulationBoolean = (regulation === 'true');
                if (this.regulated != regulationBoolean) {
                    this.regulated = regulationBoolean;
                    await this.webStorageService.setLocalStorage('regulated', this.regulated);
                    disconnect();
                    this.webStorageService.clearItem();
                    this.user = undefined;
                    this.account = { walletAddress: "", chainId: "", walletProvider: "", networkId: "", init: true };
                    this.switchNetworkModal?.hide();
                    this.notificationCount = 0;
                    this.notifications = [];
                }
            } else {
                // regulated / unreguated
                this.regulated = JSON.parse(this.webStorageService.getLocalStorage('regulated') || 'true');
                await this.webStorageService.setLocalStorage('regulated', this.regulated);
            }
            if (!this.regulated) {
                // wallet connect
                this.web3Modal = createWeb3Modal({ wagmiConfig, projectId, chains, themeVariables: { '--w3m-accent': '#006736', '--w3m-z-index': 10000, '--w3m-font-family': 'Source Code Pro', '--w3m-font-size-master': 'sm' } })
            } else {
                this.getBalance();
            }
        });

        if (!this.regulated) {
            // Listen the wallet network
            this.unwatchAccount = watchAccount((account) => {
                if (account.isConnected) {
                    setTimeout(() => {
                        this.setAccount();
                    }, 1000);
                } else if (this.account.walletAddress !== '') this.logout();
            });
            this.unwatchNetwork = watchNetwork((network) => {
                setTimeout(() => {
                    this.setAccount();
                }, 1010);
            });
        }
        if (this.regulated && this.router.url != '/sign-in' && this.router.url != '/sign-up') {
            this.getMaticPrice();
            this.getCurrencies();
        }

        if (this.user?._id) {
            this.getNotifications();
            this.socketService.getNotification().subscribe((notification: any) => {
                if (notification) {
                    notification.timeDiff = moment(notification.createdAt).from(moment());
                    notification.data = JSON.parse(notification.data)
                    this.notifications.unshift(notification);
                    this.notificationCount += 1;
                    this.notification = notification;
                    this.isNotification = true;
                }
            });
        }

        this.authenticationObservable = this.accountService.authenticationObservable.subscribe((response: any) => {
            if (!response) {
                this.logout(true);
            }
        })
        this.user?._id && this.getRecentSearch();
        this.nftService.recentSearchObservable.subscribe((response) => {
            if (response) {
                this.user?._id && this.getRecentSearch();
                setTimeout(() => {
                    this.nftService.recentSearchStatus(false);
                }, 1000);
            }

        })

        this.searchControl.valueChanges
            .pipe(
                debounceTime(2000),
                takeUntil(this.unsubscribeSearch$)
            )
            .subscribe(value => {
                if ((value !== '' || (this.searchKeyword != '' && value === '')) && this.searchKeyword != value) this.search(value!);
            });

    }
   
    async getBalance() {
        if (this.account.walletAddress != '') {
            let balance = await this.commonService.getNativeBalance(this.account);
            this.regulatedBalance = Number(balance.formatted);
        }
    }

    getMaticPrice() {
        this.commonService.getMaticPrice('matic-network').subscribe((response: any) => {
            this.maticPrice = response['matic-network'].usd;
        });
    }

    public toggleMenu() {
        this.showMenu = !this.showMenu;
    }

    async slideToggle() {
        this.regulated = !this.regulated;
        await this.webStorageService.setLocalStorage('regulated', this.regulated);
        this.logout();
    }

    setAccount = async () => {
        let store: any = JSON.parse(await this.webStorageService.getLocalStorage('wagmi.store') || 'null');
        let isConnected: any = JSON.parse(await this.webStorageService.getLocalStorage('wagmi.connected') || 'false');
        if (isConnected) {
            let provider: any = JSON.parse(await this.webStorageService.getLocalStorage('wagmi.connectedRdns') || 'null');
            if (store && store.state?.data && !store.state?.data?.chain.unsupported) {
                let { account, chain } = store?.state.data;
                let { chainId, networkId } = await this.commonService.getNetwork((chain.id).toString());
                if (account !== this.account?.walletAddress || chainId !== this.account?.chainId) {
                    this.account = { walletAddress: getAddress(account), chainId, walletProvider: provider === 'io.metamask' ? 'metamask' : 'walletconnect', networkId };
                    this.webStorageService.setLocalStorage('account', JSON.stringify(this.account));
                    this.checkUserRegistration(account);
                    this.switchNetworkModal?.hide();
                    this.commonService.closeAllModals(false);
                }
            } else {
                this.account = { walletAddress: "", chainId: "", walletProvider: provider === 'io.metamask' ? 'metamask' : 'walletconnect', networkId: "" };
                this.webStorageService.setLocalStorage('account', JSON.stringify(this.account));
                if (store?.state?.data?.chain.unsupported) {
                    this.commonService.closeAllModals(true);
                    this.switchNetworkModal?.show();
                }
            }
        }
    }

    logout(authFailed: Boolean = false) {
        disconnect();
        this.webStorageService.clearItem();
        this.user = undefined;
        this.account = { walletAddress: "", chainId: "", walletProvider: "", networkId: "", init: true };
        this.switchNetworkModal?.hide();
        this.redirectToHome(authFailed);
        this.socketService.disconnect();
        this.notificationCount = 0;
        this.notifications = [];
        this.accountService.updateAuthentication(true);
        this.authService?.signOut();
    }

    switchNetwork(chainId: string) {
        switchNetwork({ chainId: Number(chainId) });
    }

    redirectToHome(authFailed: Boolean = false) {
        if (this.router.url === '/' || authFailed) window.location.reload();
        else this.router.navigate(['/']);
    }

    async checkUserRegistration(walletAddress: any) {
        this.accountService.getUser(walletAddress).subscribe({
            next: (response: any) => {
                let userDetails = response.data;
                Object.keys(userDetails).length > 0 ? this.webStorageService.setLocalStorage('user', JSON.stringify(userDetails)) : this.webStorageService.setLocalStorage('user', null);
                this.user = Object.keys(userDetails).length > 0 ? userDetails : null;
                window.location.reload();
            },
            error: (error) => {
                this.toastr.error('Whoops like something went wrong try again later.');
            },
        });

    }

    ngOnDestroy() {
        if (!this.regulated) {
            this.unwatchAccount();
            this.unwatchNetwork();
            this.connectObservable.unsubscribe();
        }
        this.loaderObservable.unsubscribe();
        this.searchKeywordObservable.unsubscribe();
        this.socketService.disconnect();
        this.authenticationObservable?.unsubscribe();
    }

    /**
     * Searchs for nft
     * @param {string} keyWord
     */
    search(keyWord: string) {
        this.nftService.setSearchKeyword(keyWord);
        this.searchKeyword = keyWord;
        this.isSearch = false;
    }

    addOverlay() {
        this.showProfile = true;
        this.getBalance();
        this.getTokenBalance();
        this.tokenBalanceInterval = setInterval(() => {
            this.getBalance();
            this.getTokenBalance();
        }, 10000)
        this.getUserNftsCount();
        this.getKycStatus();
    }

    copyWalletAddress(msg: any) {
        this.clipboardService.copy(msg);
        this.toastr.success('Copied wallet address.');
    }

    getUserNftsCount() {
        this.nftService.getUserNftsCount(this.user._id).subscribe({
            next: (response: any) => this.nftCount = response?.data?.no_of_user_nfts || 0
        })
    }

    getCurrencies() {
        this.commonService.getCurrencies().subscribe({
            next: async (response: any) => {
                this.currencies = response.data.filter((currency: any) => !currency.is_deleted);
                this.getTokenPrice();
            },
            error: (error) => {
                this.toastr.error(error?.data?.message || "Something went wrong, try again later.");
            }
        })
    }

    getTokenBalance() {
        this.currencies.map(async (currency: any, index) => {
            let balance = await this.commonService.getTokenBalance(this.account, currency.address);
            currency.balance = Number(balance.formatted);
            if (this.currencies.length == index + 1) {
                setTimeout(() => {
                    this.currencies.sort((a, b) => b.balance - a.balance);
                }, 500);
            }
        });
    }

    async getTokenPrice() {
        this.currencies.map((currency) => {
            setTimeout(async () => {
                let response: any = await this.commonService.getTokenPrice(currency.address);
                currency.usdValue = response[currency.address.toLowerCase()]?.usd || 0;
            }, 100);
        });
    }

    getNotifications() {
        this.notificationService.getNotifications(this.user._id).subscribe({
            next: (response: any) => {
                this.setNotifications(response.data);
            },
            error: async (error) => {
                if (error?.error?.status_code === 401) {
                    error.shortMessage = "Authentication failed. Login again to continue.";
                    await this.accountService.updateAuthentication(false);
                }
                this.toastr.error(error?.error?.data?.message || error?.data?.message || error.shortMessage || "Something went wrong, try again later.");
            }
        })
    }

    setNotifications(data: any) {
        this.notifications = data.results || [];
        this.notificationCount = data.unread_notification_count;
        this.notifications?.map(notification => {
            notification.timeDiff = moment(notification.createdAt).from(moment());
            if (notification.timeDiff === 'in a few seconds') notification.timeDiff = 'a few seconds ago';
            // set image based on response
            if (notification?.event_type !== 2 || notification?.event_type !== 3) notification.image = this.getNft(notification)?.preview_image
                ? this.getNft(notification)?.preview_image
                : (this.isHtmlFile(this.getNft(notification)?.primary_media)
                    ? this.getNft(notification)?.secondary_media[0]
                    : this.getNft(notification)?.primary_media)
        })
        let unreadNotifications = this.notifications.filter(item => item.read === 0)
        this.hasUnreadNotifications = unreadNotifications.length > 0;
    }

    readNotification(notification: any) {
        if (notification.read === 0) {
            this.notificationService.readNotification({ notifications: [notification._id] }).subscribe({
                next: (response: any) => {
                    this.setNotifications(response.data);
                    this.redirectNotifications(notification);
                },
                error: (error) => this.toastr.error(error?.data?.message || "Something went wrong, try again later.")
            })
        } else this.redirectNotifications(notification);
    }

    redirectNotifications(notification: any) {
        if (notification.event_type === NotificationEvent.ITEM_PURCHASED || notification.event_type === NotificationEvent.ITEM_TRANSFERRED || (notification?.event_type >= NotificationEvent.BID_RECEIVED && notification?.event_type <= NotificationEvent.BID_CANCELLED_NOTIFICATION_TO_SELLER)) {
            if (notification.data?.nft?.lazy_mint) {
                this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
                    this.router.navigate([`/lazy-mint/${notification.data?.nft?._id}`], { queryParams: { regulated: this.regulated } })
                });
            } else {
                this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
                    this.router.navigate([`/nft-detail/${notification.data?.nft?.collections?.collection_address}/${notification.data?.nft?.token_id}`], { queryParams: { regulated: this.regulated } })
                });
            }
        }
        if ((notification.event_type >= NotificationEvent.LOAN_FORECLOSED && notification.event_type <= NotificationEvent.LENDER_COUNTER_OFFER) || (notification.event_type >= NotificationEvent.LENDER_ACCEPT_RECOUNTER && notification.event_type <= NotificationEvent.LENDER_RECOUNTER_OFFER) || notification.event_type === NotificationEvent.LOAN_DEFAULTED_NOTIFICATION_TO_BORROWER) {
            this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
                let id = notification?.data?.loan_request_id?._id || notification.data?._id;
                this.router.navigate([`borrow-detail/${id}`], { queryParams: { regulated: this.regulated } });
            });
        }
        if (notification.event_type === NotificationEvent.LENDING_AMOUNT_REPAID || notification.event_type === NotificationEvent.BORROWER_ACCEPT_COUNTER || notification.event_type === NotificationEvent.BORROWER_RECOUNTER_OFFER || notification.event_type === NotificationEvent.BORROWER_ACCEPT_RECOUNTER || notification.event_type === NotificationEvent.LOAN_DEFAULTED) {
            this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
                let id = notification?.data?.loan_request_id?._id || notification.data?._id
                this.router.navigate([`lending-detail/${id}`], { queryParams: { regulated: this.regulated } });
            });
        }
    }

    async getKycStatus() {
        const kycStatus: any = await this.accountService.getKycStatus(this.account?.walletAddress);
        this.kycStatus = kycStatus?.data
    }

    readAllNotification() {
        let list = this.notifications.filter((item) => item.read === 0)
        this.notificationService.readNotification({ notifications: list.map(item => item._id) }).subscribe({
            next: (response: any) => {
                this.setNotifications(response.data);
            },
            error: (error) => this.toastr.error(error?.data?.message || "Something went wrong, try again later.")
        })
    }

    /**
     * Gets recent search
     */
    getRecentSearch() {
        if (this.user?._id) {
            this.nftService.getRecentSearch(this.user?._id).subscribe((response: any) => {
                this.recentSearch = response.data;
            })
        }
    }

    /**
     * Clicks search
     */
    clickSearch() {
        this.isSearch = true;
        this.isSearchLoading = true;
    }

    @HostListener('document:click', ['$event'])
    clickout(event: Event) {
        if (!this.elementRef.nativeElement.contains(event.target)) {
            this.isSearch = false;
            this.isSearchLoading = false;
            if (this.showProfile) this.closeProfile();
        }
    }

    closeProfile() {
        this.showProfile = false;
        clearInterval(this.tokenBalanceInterval);
    }


    /**
     * push notiifcation close
     */
    closePushnotification() {
        this.isNotification = false;
        this.notification = {};
    }

    setRoute() {
        this.webStorageService.setItem('previousRoute', this.router.url)
    }

    expandCollapse(event: any, notification: any) {
        event.stopPropagation();
        notification.isExpand = !notification.isExpand;
    }

    isHtmlFile(url: string): boolean {
        return url ? url.split('.').pop() === 'html' : false;
    }

    getNft(notification: any) {
        return notification?.data?.nft || notification?.data?.nft_id || notification?.data?.collateral_assets?.[0] || notification?.data?.loan_request_id?.collateral_assets?.[0];
    }
    getAdminAnnouncement() {
        this.announce.getAnnouncement().subscribe({
            next: (response: IApiResponse) => {
                this.announceData = response.data;
                if (this.announceData.enabled == true) {
                    document.body.classList.add('enable-status-scroll')
                }
                else {
                    document.body.classList.add('disable-status-scroll')
                }
            },
            error: (response: IApiResponse) => {
                console.log('error');

            }
        })
    }

  /**
   * Retrieves the total number of collateral assets from a notification object.
   *
   * @param {Object} notification - The notification object containing data.
   * @returns {number} The total number of collateral assets.
   */
  getTotalCollateralAssets(notification: { data: any }): number {
    return (( notification?.data?.['collateral_assets'] || notification?.data?.['loan_request_id']?.['collateral_assets'] || []) as any[]).length;
  }

  get _notification():typeof NotificationEvent {
    return NotificationEvent
  }
}

export enum NotificationEvent {
    // Purchase-related events
    ITEM_PURCHASED = 1, // To Seller, when their item(s) are purchased.
    ITEM_TRANSFERRED = 14, // To Buyer, when an item is transferred.

    // Admin-related events
    BLOCKED = 2, // Blocked by admin.
    UNBLOCKED = 3, // Unblocked by admin.

    // Loan-related events
    LENDING_AMOUNT_REPAID = 4, // To Lender, when lending amount is repaid by the borrower.
    LOAN_FORECLOSED = 5, // To Borrower, when the loan is foreclosed.
    LENDER_ACCEPTED_LOAN_REQUEST = 6, // To Borrower, when lender accepts the loan request.
    LENDER_COUNTER_OFFER = 7, // To Borrower, when a lender gives a counter offer.
    BORROWER_ACCEPT_COUNTER = 8, // To Lender, when a borrower accepts the counter offer.
    BORROWER_RECOUNTER_OFFER = 9, // To Lender, when a borrower gives a re-counter offer.
    LENDER_ACCEPT_RECOUNTER = 10, // To Borrower, when a lender accepts the re-counter offer.
    LENDER_RECOUNTER_OFFER = 12, // To Borrower, when a lender gives a re-counter offer.
    BORROWER_ACCEPT_RECOUNTER = 13, // To Lender, when a borrower accepts the re-counter offer.
    FORECLOSE_SUCCESS = 29, // To Sender, when the loan is successfully foreclosed.
    LOAN_DEFAULTED = 30, // To Lender, when the loan is defaulted.
    LOAN_DEFAULTED_NOTIFICATION_TO_BORROWER = 31, // To Borrower, when their loan is defaulted.
    LOAN_OFFER_RECEIVED = 32, // To Lender, when a new loan offer is received.
    LOAN_OFFER_CREATED = 33, // To Borrower, when a lender creates a loan offer.
    REVISED_LOAN_BID_RECEIVED = 34, // To Lender, when a revised loan bid is received.
    LOAN_BID_APPROVED = 35, // To Lender, when their loan bid is approved.
    LOAN_BID_APPROVED_NOTIFICATION_TO_OWNER = 36, // To Owner, when they approve a loan bid.
    LOAN_BID_CANCELLED = 37, // To Lender, when a borrower cancels their loan bid.

    // Bid-related events
    BID_RECEIVED = 17, // To Seller/Borrower, when a bid is received.
    REVISED_BID_RECEIVED = 18, // To Seller, when a revised bid is received.
    BID_CANCELLED = 19, // To Buyer, when their bid is cancelled.
    BID_APPROVED = 20, // To Buyer, when their bid is approved.
    BID_APPROVED_NOTIFICATION_TO_SELLER = 21, // To Seller, when they approve a bid.
    BID_SUBMITTED = 22, // To Buyer, when they submit a bid.
    REVISED_BID_SUBMITTED = 23, // To Buyer, when their bid is revised.
    BID_CANCELLED_NOTIFICATION_TO_SELLER = 24, // To Seller, when they cancel a bid.
    BID_RECEIVED_FOR_FORECLOSED_NFT = 38, // To Seller/Lender, when a bid is received for a foreclosed NFT.

    // Delivery-related events
    DELIVERY_REQUEST_SENT = 25, // To User, when they send a delivery request.
    DELIVERY_REQUEST_RECEIVED = 26, // To Admin, when a delivery request is received.
    DELIVERY_REQUEST_UPDATED = 27, // To Admin, when a delivery request is updated.
    DELIVERY_REQUEST_CANCELLED = 28, // To Admin, when a delivery request is cancelled.

    // Reminder-related events
    REMINDER_70_PERCENT_DUE = 11, // Reminder for 70% due.
    REMINDER_24_HOURS_DUE = 15, // Reminder for 24 hours due.
    REMINDER_90_PERCENT_DUE = 16, // Reminder for 90% due.
}

