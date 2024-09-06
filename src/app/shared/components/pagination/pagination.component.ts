import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { TRANSACTIONS_TYPE } from '../../Hepler/helper';
import { DashboardService } from '../../services/dashboard.service';
import { ExchangeService } from '../../services/exchange.service';
import { NftService } from '../../services/nft.service';
import { IApiResponse, IPagination } from '../../utils/common.interface';
import { ITransactionParams } from '../transaction-logs/transaction-logs.interface';

@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.css']
})

/**
 * Reusable Pagination Component
 */
export class PaginationComponent implements OnInit, OnChanges {

  @Input() paginationData: IPagination;
  @Input() pageType: string = '';
  @Input() userWalletAddress: string = '';
  @Input() nftParams: ITransactionParams;
  @Input() nftId: string = '';
  @Output() dataList: EventEmitter<any> = new EventEmitter();
  page = 1;
  limit = 10;


  /**
   * constructor
   */
  constructor(
    private nftService: NftService,
    private dashboardService: DashboardService,
    private toastr: ToastrService,
    private exchangeService: ExchangeService
  ) {
    this.paginationData = {
      totalDocs: 0,
      limit: 10,
      totalPages: 1,
      page: 1,
      pagingCounter: 1,
      hasPrevPage: false,
      hasNext_page: false,
      prevPage: null,
      nextPage: null
    };
    this.nftParams = {
      nftCollection: '',
      nftTokenId: '',
      nftId: '',
    }
  }


  /**
   * ng on changes
   */
  ngOnChanges(changes: SimpleChanges): void {

  }

  /**
   * will load on component initialization
   */
  ngOnInit(): void {
    this.getList();
  }


  /**
   * get list
   * @param {number} page
   * @param {number} limit
   */
  getList(page: number = 1, limit: number = 10) {
    let apiCall$;
    switch (this.pageType) {
      case TRANSACTIONS_TYPE.USER_TRANSACTIONS:
        if (this.userWalletAddress) {
          apiCall$ = this.dashboardService.logsByUser(this.userWalletAddress, page, limit);
        }

        break;

      case TRANSACTIONS_TYPE.NFT_TRANSACTIONS:
        apiCall$ = this.nftService.getNftAnalytics(this.nftParams.nftCollection, this.nftParams.nftTokenId, this.nftParams.nftId, page, limit);

        break;

      case TRANSACTIONS_TYPE.OFFERS_LIST:
        apiCall$ = this.exchangeService.getBids(this.nftId, page, 5);
        break;

      default:
        console.log('Invalid');

        break;
    }

    apiCall$?.subscribe({
      next: (res: IApiResponse) => {
        this.dataList.emit(res.data.docs);
        this.paginationData = res.data;
      },
      error: (error: HttpErrorResponse) => {
        this.toastr.error(error.error.message)
      }
    })

  }

}
