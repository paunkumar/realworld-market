import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, firstValueFrom, lastValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { IApiResponse } from '../utils/common.interface';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  public loaderStatus = new BehaviorSubject(true);
  account: any = {};
  accountObserve: Observable<{
    walletAddress: string,
    chainId: string,
    networkId: any,
    walletProvider: string,
    init: boolean;
  }>;
  private connectWalletModal: any;
  public connectObservable!: Observable<any>;
  private authenticated: any;
  public authenticationObservable!: Observable<any>;

  constructor(private http: HttpClient) {
    // Account
    this.account = new BehaviorSubject({
      walletAddress: '',
      chainId: '',
      networkId: '',
      walletProvider: '',
      init: true
    });
    this.accountObserve = this.account.asObservable();
    this.loaderStatus.asObservable();
    // Network connection
    this.connectWalletModal = new BehaviorSubject(false);
    this.connectObservable = this.connectWalletModal.asObservable();

    this.authenticated = new BehaviorSubject(true);
    this.authenticationObservable = this.authenticated.asObservable();
  }

  /**
   * Set Account
   * @param {object} data
   */
  public setAccount(data: {
    walletAddress: string,
    chainId: string,
    networkId: any,
    walletProvider: string,
    init: boolean
  }) {
    this.account.next(data);
  }

  /**
   * Enables meta mask connection
   * @param data
   */
  public enableMetaMaskConnection(data: boolean) {
    this.connectWalletModal.next(data);
  }

  public updateAuthentication(data: boolean) {
    this.authenticated.next(data);
  }

  /**
   * Gets user
   * @param userId
   * @returns
   */
  public getUser(walletAddress: string) {
    return this.http.get(`${environment.API_BASE_URL}/user/user-available?wallet_address=${walletAddress}`);
  }

  async getUserById(userId: string) {
    let userDetails = this.http.get(`${environment.API_BASE_URL}/user?id=${userId}`);
    return await lastValueFrom(userDetails);
  }

  public updateUser(userId: string, params: any) {
    return this.http.patch(`${environment.API_BASE_URL}/user?id=${userId}`, params);
  }

  /**
   * Registers account service
   * @param params
   * @returns
   */
  public register(params: any, regulated: boolean) {
    return regulated ? this.http.post(`${environment.API_BASE_URL}/user/regulated-sign-up`, params) : this.http.post(`${environment.API_BASE_URL}/user/sign-up`, params);
  }

  /**
   * Logins account service
   * @param params
   * @returns
   */
  public login(params: any) {
    return this.http.post(`${environment.API_BASE_URL}/user/regulated-sign-in`, params);
  }

  /**
   * Sends email
   * @param userId
   * @returns
   */
  public sendEmail(userId: string) {
    return this.http.get(`${environment.API_BASE_URL}/user/send-mail?id=${userId}`);
  }

  /**
   * Verifys email
   * @param params
   * @returns
   */
  public verifyEmail(params: any) {
    return this.http.post(`${environment.API_BASE_URL}/user/verify-mail`, params);
  }

  /**
   * Updates email
   * @param params
   * @returns
   */
  public updateEmail(userId: string, params: any) {
    return this.http.patch(`${environment.API_BASE_URL}/user?id=${userId}`, params);
  }

  public forgotPassword(email: string) {
    return this.http.get(`${environment.API_BASE_URL}/user/regulated/forget-password?email=${email}`);
  }

  public resetPassword(userId: string, params: any) {
    return this.http.patch(`${environment.API_BASE_URL}/user/regulated/update-password?id=${userId}`, params);
  }

  public validateToken(token: string) {
    return this.http.get(`${environment.API_BASE_URL}/user/regulated/validate-token?token=${token}`);
  }

  /**
   * Loaders status update
   * @param {boolean} status
   */
  public loaderStatusUpdate(status:boolean){
    this.loaderStatus.next(status);
  }

  /**
   * Googles auth
   * @param {object} params
   * @returns
   */
  public googleAuth(params: object) {
    return this.http.post(`${environment.API_BASE_URL}/user/googleAuth`, params);
  }

  public getKycStatus(address: string) {
    return firstValueFrom(this.http.get(`${environment.API_BASE_URL}/user/get-user-admin-kyc-status?wallet_address=${address}`));
  }

  /**
   * confirm email verfication
   * @param {{id:string,token:string}} ayload
   * @returns
   */
    public confirmEmail(payload: {id:string,token:string}):Observable<IApiResponse> {
      return this.http.patch<IApiResponse>(`${environment.API_BASE_URL}/user/email-verification?id=${payload.id}&token=${payload.token}`,{});
    }

  /**
   * resend email verification mail
   * @param{{email:string}}payload
   */
  resendVerificationEmail(payload:{email:string,url?:string}):Observable<IApiResponse> {
    return this.http.get<IApiResponse>(`${environment.API_BASE_URL}/user/resend-email?email=${payload.email}&url=${payload.url}`);
  }

  /**
   * update self custody user's email and name
   */
  updateProfile(payload:{fullName:string,email:string,wallet_address:string,url?:string}) {
    return this.http.patch<IApiResponse>(`${environment.API_BASE_URL}/user/update-user-details?wallet_address=${payload.wallet_address}`,{name:payload.fullName,email:payload.email,url:payload.url});
  }
}
