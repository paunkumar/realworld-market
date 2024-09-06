import { Injectable } from '@angular/core';
import { readContract } from '@wagmi/core';
import { environment } from 'src/environments/environment';
import { getAddress } from 'viem';

const accessAbi = require('src/app/shared/abis/access.json');

@Injectable({
  providedIn: 'root'
})
export class AccessControlContractService {

  constructor() { }

  async isBlocked(account: any) {    
    return await readContract({
      address: await getAddress((environment as any)[account.chainId || environment.DEFAULT_NETWORK].ACCESS_CONTROL_CONTRACT),
      abi: accessAbi,
      chainId: account.networkId,
      functionName: 'blockedUsers',
      args: [account.walletAddress]
    });
  }
}
