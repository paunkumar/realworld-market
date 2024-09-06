import { Injectable } from '@angular/core';
import { getPublicClient, readContract } from '@wagmi/core';

import { Observable, from } from 'rxjs';
import { encodeFunctionData, getAddress } from 'viem';
import { ContractUtils } from '../utils/contract-utils';

const erc20Abi = require('../abis/erc20.json');

@Injectable({
  providedIn: 'root'
})
export class Erc20ContractService {

  publicClient = getPublicClient();

  constructor(private contractUtils: ContractUtils) { }

  async approve({chainId, walletAddress}: any, tokenAddress: string, {functionName, args}: any) {
    let contractParams = {
      abi: erc20Abi,
      functionName,
      args
    }
    let requiredGas = await this.publicClient.estimateContractGas({
      address: await getAddress(tokenAddress),
      account: walletAddress,
      ...contractParams
    });
    let approveAbi = await encodeFunctionData({
      ...contractParams
    })
    return { approveAbi, requiredGas }
  }

  async getDecimal(chainId: number, contractAddress: string) {
    return await readContract({
      address: await getAddress(contractAddress),
      abi: erc20Abi,
      chainId,
      functionName: 'decimals',
      args: []
    });
  }
  getContractName(chainId: number, address: string): Observable<string> {
    return from(this._getContractName(chainId, address));
  }

  async _getContractName(chainId: number, address: string): Promise<string> {
   const result =   await readContract({
      address: await getAddress(address),
      abi: erc20Abi,
      chainId,
      functionName: 'name',
      args: []
    });
    return result as unknown as string;
  }

  async getBalance(chainId: number, tokenAddress: string, account: string) {
    let balance = await readContract({
      address: await getAddress(tokenAddress),
      abi: erc20Abi,
      chainId,
      functionName: 'balanceOf',
      args: [account]
    });
    return balance.toString();
  }

  async getAllowance(chainId: number, tokenAddress: string, owner: string, spender: string) {
    return await readContract({
      address: await getAddress(tokenAddress),
      abi: erc20Abi,
      chainId,
      functionName: 'allowance',
      args: [owner, spender]
    });
  }

  async transfer({chainId, walletAddress}: any, {functionName, args}: any, contractAddress: string, ) {
    let contractParams = {
      abi: erc20Abi,
      functionName,
      args
    }
    let requiredGas = await this.publicClient.estimateContractGas({
      address: await getAddress(contractAddress),
      account: walletAddress,
      ...contractParams
    });
    let transferAbi = await encodeFunctionData({
      ...contractParams
    })
    return { transferAbi, requiredGas }
  }
}
