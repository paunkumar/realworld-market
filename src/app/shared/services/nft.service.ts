import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

import { environment } from 'src/environments/environment';
import { IApiResponse } from '../utils/common.interface';

@Injectable({
  providedIn: 'root'
})
export class NftService {

  private searchKeyword: any;
  public searchKeywordObservable!: Observable<any>;
  private recentSearch: any;
  public recentSearchObservable!: Observable<any>;

  constructor(
    private http: HttpClient
  ) {
    // Search keyword
    this.searchKeyword = new BehaviorSubject('');
    this.searchKeywordObservable = this.searchKeyword.asObservable();
    this.recentSearch = new BehaviorSubject(false);
    this.recentSearchObservable = this.recentSearch.asObservable();
  }

  getNfts(page: number, limit: number, searchKey: string, collections: any[], location: any[], category: any[], sale: string, loan: string, from: number, to: number, appraisal_from: number, appraisal_to: number, sort: any, partition: string) {
    let sortByName = sort.type === 'name' ? sort.value : '';
    let sortByPrice = sort.type === 'price' ? sort.value : '';
    let sortByAppraisal = sort.type === 'appraisal' ? sort.value : '';
    let sortByPurchase = sort.type === 'purchase' ? sort.value : '';
    let sortByBid = sort.type === 'bid' ? sort.value : '';
    let sortByTransfer = sort.type === 'transfer' ? sort.value : '';
    let sortByOnLoan = sort.type === 'onLoan' ? sort.value : '';
    let sortByForLoan = sort.type === 'forLoan' ? sort.value : '';
    return this.http.get(`${environment.API_BASE_URL_V2}/nfts?page=${page}&limit=${limit}&key=${searchKey}&collections=${collections}&location=${location}&category=${category}&for_sale=${sale}&for_loan=${loan}&from=${from}&to=${to}&appraisal_from=${appraisal_from}&appraisal_to=${appraisal_to}&name_sort=${sortByName}&appraisal_sort=${sortByAppraisal}&price_sort=${sortByPrice}&sale_sort=${sortByPurchase}&forloan_sort=${sortByForLoan}&onloan_sort=${sortByOnLoan}&transfer_sort=${sortByTransfer}&bid_sort=${sortByBid}&partition=${partition}`);
  }

  getNft(collectionAddress: string, tokenId: string) {
    return this.http.get(`${environment.API_BASE_URL}/user/nft?collection_address=${collectionAddress}&token_id=${tokenId}`);
  }

  getNftById(id: string) {
    return this.http.get(`${environment.API_BASE_URL}/user/nft-by-id?id=${id}`);
  }


  /**
   * Gets collections
   * @param {any} category
   * @param {any} location
   * @returns
   */
  getCollections(category?: any, location?: any) {
    // return this.http.get(`${environment.API_BASE_URL}/user/collections?category=${category}&location=${location}`);
    let params = new URLSearchParams();

    if (category !== undefined) {
      params.append('category', category);
    }

    if (location !== undefined) {
      params.append('location', location);
    }

    const queryString = params.toString();
    const url = `${environment.API_BASE_URL}/user/collections${queryString ? `?${queryString}` : ''}`;

    return this.http.get(url);
  }

  getNftTriats() {
    return this.http.get(`${environment.API_BASE_URL}/user/nfttraits`);
  }

  getNftsByOwner(address: string, page: number, limit: number, searchKey: string, collections: any[], location: any[], category: any[], sale: string, loan: string, from: number, to: number, appraisal_from: number, appraisal_to: number, sort: any) {
    let sortByName = sort.type === 'name' ? sort.value : '';
    let sortByPrice = sort.type === 'price' ? sort.value : '';
    let sortByAppraisal = sort.type === 'appraisal' ? sort.value : '';
    return this.http.get(`${environment.API_BASE_URL}/user/nfts/owner?address=${address}&page=${page}&limit=${limit}&key=${searchKey}&collections=${collections}&location=${location}&category=${category}&for_sale=${sale}&for_loan=${loan}&from=${from}&to=${to}&appraisal_from=${appraisal_from}&appraisal_to=${appraisal_to}&name_sort=${sortByName}&appraisal_sort=${sortByAppraisal}&price_sort=${sortByPrice}`);
  }



  getInactiveNftsByOwner(address: string) {
    return this.http.get(`${environment.API_BASE_URL}/user/nfts/owner/no-sale-loan?address=${address}`);
  }

  searchNft(keyword: string) {
    return this.http.get(`${environment.API_BASE_URL}/user/nfts/search?key=${keyword}`);
  }

  setSearchKeyword(data: string) {
    this.searchKeyword.next(data);
  }

  /**
   * Gets signature for lazy mint order
   * @param order
   * @returns
   */
  getSignatureForLazyMintOrder(order: any) {
    return this.http.post(`${environment.API_BASE_URL}/user/lazy-mint-signature`, order);
  }

  getUserNftsCount(userId: string) {
    return this.http.get(`${environment.API_BASE_URL}/user/list-user-nfts-count?id=${userId}`);
  }

  transferNft(params: any) {
    return this.http.post(`${environment.API_BASE_URL}/user/nft/transfer-nft`, params);
  }

  getSalePrice() {
    return this.http.get(`${environment.API_BASE_URL}/user/sale-price`);
  }

  getSalePriceByUser(address: string) {
    return this.http.get(`${environment.API_BASE_URL}/user/sale-price-by-user?owner_address=${address}`);
  }

  getMaxSalePrice() {
    return this.http.get(`${environment.API_BASE_URL}/user/maximum-sale-price`);
  }

  getMaxSalePriceByUser(address: string) {
    return this.http.get(`${environment.API_BASE_URL}/user/maximum-sale-price-by-user?owner_address=${address}`);
  }

  /**
   *
   * @param{string} collectionAddress
   * @param{string} tokenId
   * @param{string} id
   * @param{number}page
   * @param{number}limit
   * @return{{}}
   */
  getNftAnalytics(collectionAddress: string, tokenId: string, id: string, page?: number, limit?: number): Observable<IApiResponse> {
    const paramsArray = [
      { key: 'collection_address', value: collectionAddress },
      { key: 'token_id', value: tokenId },
      { key: 'id', value: id },
      { key: 'page', value: page },
      { key: 'limit', value: limit }
    ];

    let url = `${environment.API_BASE_URL}/user/nft/sale-history?`;

    paramsArray.forEach(param => {
      if (param.value !== '' && param.value !== undefined && param.value !== null) {
        url += `${param.key}=${param.value}&`;
      }
    });

    // Remove the last '&' if present
    url = url.endsWith('&') ? url.slice(0, -1) : url;

    return this.http.get<IApiResponse>(url);
  }

  /**
   * Gets recent search keywords
   * @param {string} id
   */
  getRecentSearch(id: string) {
    return this.http.get(`${environment.API_BASE_URL}/user/search-history?id=${id}`);
  }

  /**
   * Recents search status
   * @param {boolean} status
   */
  recentSearchStatus(status: boolean) {
    this.recentSearch.next(status)
  }

  /**
   * get holding nfts /assets
   * @param{string} address
   * @param{number} page
   * @param{number} limit
   * @param{string} searchKey
   * @param{any[]} collections
   * @param{any[]} location
   * @param{any[]} category
   * @param{string} sale
   * @param{string} loan
   * @param{number} from
   * @param{number} to
   * @param{numnber} appraisal_from
   * @param{number} appraisal_to
   * @param{any} sort
   * @return{Observable<IApiResponse>}
   */

  getHoldingNftsByOwner(address: string, page: number, limit: number, searchKey: string, collections: any[], location: any[], category: any[], sale: string, loan: string, from: number, to: number, appraisal_from: number, appraisal_to: number, sort: any): Observable<IApiResponse> {
    let sortByName = sort.type === 'name' ? sort.value : '';
    let sortByPrice = sort.type === 'price' ? sort.value : '';
    let sortByAppraisal = sort.type === 'appraisal' ? sort.value : '';
    return this.http.get<IApiResponse>(`${environment.API_BASE_URL}/user/nfts/holding-assets?address=${address}&page=${page}&limit=${limit}&key=${searchKey}&collections=${collections}&location=${location}&category=${category}&for_sale=${sale}&for_loan=${loan}&from=${from}&to=${to}&appraisal_from=${appraisal_from}&appraisal_to=${appraisal_to}&name_sort=${sortByName}&appraisal_sort=${sortByAppraisal}&price_sort=${sortByPrice}`);
  }

  /**
   * get delivered nfts/assets
   * @param{string} userId
   * @param{number} page
   * @param{number} limit
   * @return{Observable<IApiResponse>}
   */

  getDeliveryNftsByOwner(userId: string, page: number, limit: number) {
    return this.http.get<IApiResponse>(`${environment.API_BASE_URL}/user/nfts/delivery-assets?id=${userId}&page=${page}&limit=${limit}`);
  }


}
