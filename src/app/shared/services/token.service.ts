import { Injectable } from '@angular/core';
import { readContracts } from '@wagmi/core';
import { publicClient } from '../utils/viem-client';
// import { erc20Abi } from '../abis/erc20';
import { getAddress } from 'viem';
const erc20Abi = require('src/app/shared/abis/erc20.json');

@Injectable({
  providedIn: 'root'
})
export class TokenService {

  constructor() { }


  /**
   * Gets token details
   * @param chainId
   * @param address
   * @returns
   */
  public async getTokenDetails(chainId: number, address: string) {
    const collectionContract = {
      address: await getAddress(address),
      abi: erc20Abi,
      chainId
    }
    let contractResults: any = await readContracts({
      contracts: [
        {
          ...collectionContract,
          functionName: 'name',
          args: []
        },
        {
          ...collectionContract,
          functionName: 'symbol',
          args: []
        },
        {
          ...collectionContract,
          functionName: 'totalSupply',
          args: []
        }
      ]
    })
    return { name: contractResults[0].result, symbol: contractResults[1].result, supply: Number(contractResults[2].result) };
  }
}
