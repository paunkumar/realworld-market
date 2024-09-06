import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { fetchBalance, fetchFeeData, prepareSendTransaction, sendTransaction, waitForTransaction } from '@wagmi/core';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { getAddress, parseEther } from 'viem';
import { WebStorageService } from './web-storage.service';

@Injectable({
    providedIn: 'root'
})
export class CommonService {

    private showGridView = new BehaviorSubject(true);
    public showGridViewObservable = this.showGridView.asObservable();

    private signinPageHeader = new BehaviorSubject(false);
    public siginpageObservable = this.signinPageHeader.asObservable();

    private showoverlay = new BehaviorSubject(false);
    showmodaloverlayObservable = this.showoverlay.asObservable();

    private closeModals = new BehaviorSubject(false);
    closeModalsObservable = this.closeModals.asObservable();

    private tabEmitter: any;
    tabEmitterObserve!: Observable<{ type: string }>;

    private transactionProvider = new BehaviorSubject({});
    public transactionListener: Observable<any> = this.transactionProvider.asObservable();

    private showSearchSubject = new BehaviorSubject<boolean>(false);
    showSearch$ = this.showSearchSubject.asObservable();

    constructor(
        private http: HttpClient,
        private webStorageService: WebStorageService
    ) {
        this.tabEmitter = new BehaviorSubject({});
        this.tabEmitterObserve = this.tabEmitter.asObservable();
    }
    setShowSearch(value: boolean) {
        this.showSearchSubject.next(value);
    }

    setTabEmitter(data: { type: string }) {
        this.tabEmitter.next(data);
    }
    /**
     * overlay */
    public setOverlay(type: boolean) {
        this.showoverlay.next(type)
    }
    /**
     * set grid view / table view
     */
    public setView(type: boolean) {
        this.showGridView.next(type);
    }

    /**
     * set hider and header and footer
    */
    public setHeaderHide(type: boolean) {
        this.signinPageHeader?.next(type);
    }

    /**
     * Datas emit
     * @param data
     */
    public transactionEmitter(type: object) {
        this.transactionProvider.next(type);
    }

    /**
     * Uploads image
     * @param network
     * @returns
     */
    public uploadImage(body: any) {
        return firstValueFrom(this.http.post(`${environment.API_BASE_URL}/file-upload/document`, body));
    }

    /**
     * Images mime type validation
     * @param name
     * @returns mime type validation
     */
    public imageMimeTypeValidation(name: string): Boolean {
        var ext = name.substring(name.lastIndexOf('.') + 1);
        if (ext.toLowerCase() == 'pdf' || ext.toLowerCase() == 'png' || ext.toLowerCase() == 'jpeg' || ext.toLowerCase() == 'jpg' || ext.toLowerCase() == 'webp' || ext.toLowerCase() == 'gif' || ext.toLowerCase() == 'svg' || ext.toLowerCase() == 'docx' || ext.toLowerCase() == 'xlsx') {
            return true;
        } else {
            return false;
        }
    }

    public getCurrencies() {
        return this.http.get(`${environment.API_BASE_URL}/user/currencies`);
    }

    getNonce() {
        return firstValueFrom(this.http.get(`${environment.API_BASE_URL}/user/nonce`))
    }

    async sendTransaction(account: any, contractAddress: string, abi: any, requiredGas: any, args: any) {
        let regulated = JSON.parse(this.webStorageService.getLocalStorage('regulated') || 'true');
        let feeData = await fetchFeeData();
        const params = {
            account: account.walletAddress,
            to: contractAddress,
            data: abi,
            chainId: account.networkId,
            gasPrice: Number(feeData.gasPrice) ? Number(feeData.gasPrice) * 2 : undefined,
            gas: Number(requiredGas) * 2,
            value: args.value ? regulated ? Number(parseEther(args.value.toString())) : parseEther(args.value.toString()) : 0
        };
        if (regulated) return this.sendTransactionRegulated(params, args);
        else return this.sendTransactionUnregulated(params, account);
    }

    async sendTransactionRegulated(params: any, args: any,) {
        let user = JSON.parse(this.webStorageService.getLocalStorage('user') || '{}');
        params.accountId = user.fire_block_address;
        params.from = params.account;
        params.contractAddress = params.to;
        params.function = args.functionName;
        params.parameters = args.args;
        params.abi_type = args.abiType;
        delete params.account;
        delete params.data;
        delete params.chainId;
        delete params.gasPrice;
        try {
            const result = await this.http.post(`${environment.API_BASE_URL}/user/contract-transaction`, params).toPromise();
            return result;
        } catch (error) {
            console.error('Error fetching data:', error);
            throw error;
        }
    }

    async sendTransactionUnregulated(params: any, account: any) {
        const config = await prepareSendTransaction(params);
        let { hash } = await sendTransaction(config);
        return await waitForTransaction({ hash, confirmations: 1 });
    }

    getNetwork = (chainId: string) => {
        let network;
        let key;
        let networkId;
        switch (chainId) {
            case '0x1':
            case '1':
                chainId = '0x1';
                networkId = 1;
                network = 'Ethereum Mainnet';
                key = 'ETH';
                break;
            case '0x5':
            case '5':
                chainId = '0x5';
                networkId = 5;
                network = 'Goerli Testnet';
                key = 'GoerliETH';
                break;
            case '0x13882':
            case '80002':
                chainId = '0x13882';
                networkId = 80002;
                network = 'Polygon Testnet';
                key = 'MATIC';
                break;
            case '0x89':
            case '137':
                chainId = '0x89';
                networkId = 137;
                network = 'Polygon Mainnet';
                key = 'MATIC';
                break;
            default:
                network = 'Unknown';
                break;
        }
        return { network, key, chainId, networkId };
    }

    async getNativeBalance(account: any) {
        return await fetchBalance({
            address: await getAddress(account.walletAddress),
            chainId: account.networkId
        });
    }

    async getTokenBalance(account: any, tokenAddress: any) {
        return await fetchBalance({
            address: await getAddress(account.walletAddress),
            chainId: account.networkId,
            token: tokenAddress
        });
    }

    getMaticPrice(network: string) {
        return this.http.get(`${environment.COINGECKO_API}/price?ids=${network}&vs_currencies=USD&x_cg_demo_api_key=${environment.COINGECKO_API_KEY}`);
    }

    getTokenPrice(tokenAddress: any) {
        return firstValueFrom(this.http.get(`${environment.COINGECKO_API}/token_price/polygon-pos?contract_addresses=${tokenAddress}&vs_currencies=USD&x_cg_demo_api_key=${environment.COINGECKO_API_KEY}`));
    }

    /**
     * get token price from databse
     * @param {string} tokenId
     */
    getTokenPriceFromDb(tokenId: string) {
        return this.http.get(`${environment.API_BASE_URL}/admin/digital-value?address=${tokenId}`);

    }

    /**
     * Gets usdprice
     * @param network
     * @returns
     */
    public getUSDPrice(network: string) {
        return this.http.get(`${environment.COINGECKO_API}?ids=${network}&vs_currencies=usd&x_cg_demo_api_key=${environment.COINGECKO_API_KEY}`);
    }

    async getImage(media: any) {
        return fetch(media)
            .then(response => {
                return response.blob().then(blob => {
                    return {
                        contentType: response.headers.get("Content-Type"),
                        raw: blob
                    }
                })
            })
            .catch(error => console.log('fetch image'))
    }

    public closeAllModals(close: boolean) {
        this.closeModals.next(close)
    }

    getGoldPrice() {
        return firstValueFrom(this.http.get(`${environment.API_BASE_URL}/user/get-gold-value`));
    }

    calculateGoldValue = async (size: string, markupFee: number, goldValue: number = 0) => {
        // Define the conversion factors
        const OUNCE_TO_GRAM = 31.1035;
        const TOLA_TO_GRAM = 11.66;
        const KILO_TO_GRAM = 1000;
        let OUNCE_TO_USD: number;
        if (goldValue > 0) OUNCE_TO_USD = goldValue;
        else {
            let marketprice: any = await this.getGoldPrice();
            OUNCE_TO_USD = marketprice.data.gold_value
        }

        if (size.includes(environment.ONE_KILO_GRAM)) {
            const weightInGrams = 1 * KILO_TO_GRAM;
            const weightInOunces = weightInGrams / OUNCE_TO_GRAM;
            const valueInUSD = weightInOunces * OUNCE_TO_USD;
            const totalUSD = valueInUSD + (valueInUSD * markupFee) / 100;
            return { price: valueInUSD, priceWithFee: totalUSD };
        } else if (size.includes(environment.TEN_TOLA_BAR)) {
            const weightInGrams = 10 * TOLA_TO_GRAM;
            const weightInOunces = weightInGrams / OUNCE_TO_GRAM;
            const valueInUSD = weightInOunces * OUNCE_TO_USD;
            const totalUSD = valueInUSD + (valueInUSD * markupFee) / 100;
            return { price: valueInUSD, priceWithFee: totalUSD };
        } else if (size.includes(environment.ONE_OUNCE)) {
            const totalUSD = OUNCE_TO_USD + (OUNCE_TO_USD * markupFee) / 100;
            return { price: OUNCE_TO_USD, priceWithFee: totalUSD };
        } else return 0
    }


    /**
     * get time remaining from current time
     */
    getTimeRemaining(endDate: string | Date): string {
        const end = new Date(endDate).getTime();
        const now = new Date().getTime();
        const timeDiff = end - now;

        if (timeDiff < 0) {
            return ''
        }

        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

        return `(in ${days} days, ${hours} hours, ${minutes} minutes).`;

    }

    calculateInterest(loanAmount: number, loanDuration: number, loanPercentage: number, chainId: any) {
        let divisor = (environment as any)[chainId].LOAN_IN_DAYS ? (365 * 100) : (365 * 24 * 100)
        let interest_amount = (loanAmount * loanDuration * loanPercentage) / divisor;
        let total_amount = Number(loanAmount) + Number(interest_amount);
        return { interest_amount, total_amount }
    }

}
