import { Injectable } from '@angular/core';
import { encodeFunctionData, getAddress } from 'viem';
import { getPublicClient, readContract, readContracts } from '@wagmi/core';


import { environment } from 'src/environments/environment';
import { ContractUtils } from '../utils/contract-utils';
import { Erc20ContractService } from './erc20-contract.service';

const exchangeAbi = require('../abis/exchange.json');

@Injectable({
  providedIn: 'root'
})
export class ExchangeContractService {

  publicClient = getPublicClient();

  constructor(
    private contractUtils: ContractUtils,
    private erc20ContractService: Erc20ContractService
  ) { }

  getSaleStatus = async (chainId: string, nftAddress: string, tokenId: string) => {
    return await readContract({
      address: await getAddress((environment as any)[chainId].EXCHANGE_CONTRACT),
      abi: exchangeAbi,
      chainId: (environment as any)[chainId].CHAINID,
      functionName: 'getSaleStatus',
      args: [nftAddress, tokenId]
    });
  }

  getOrderStatus = async (chainId: string, bytes: string) => {
    return await readContract({
      address: await getAddress((environment as any)[chainId].EXCHANGE_CONTRACT),
      abi: exchangeAbi,
      chainId: (environment as any)[chainId].CHAINID,
      functionName: 'OrderStatus',
      args: [bytes]
    });
  }

  getOrderClass = async (chainId: string) => {
    const collectionContract = {
      address: await getAddress((environment as any)[chainId].EXCHANGE_CONTRACT),
      abi: exchangeAbi,
      chainId: (environment as any)[chainId].CHAINID
    }
    return await readContracts({
      contracts: [
        {
          ...collectionContract,
          functionName: 'CANCELLED_ORDER_CLASS',
          args: []
        },
        {
          ...collectionContract,
          functionName: 'COMPLETED_ORDER_CLASS',
          args: []
        }
      ]
    });
  }

  organizeSellOrder = async (chainId: number, seller: string, tokenAddress: string, tokenId: string, currencyAddress: string, price: string, nonce: number) => {
    const decimal = await this.erc20ContractService.getDecimal(chainId, currencyAddress);
    return {seller, tokenAddress, tokenId, currencyAddress, price: this.contractUtils.decimalMultipler(Number(decimal), Number(price)), nonce}
  }

  createExchangeAbi = async ({chainId, walletAddress}: any, {functionName, args}: any) => {
    let contractParams = {
      abi: exchangeAbi,
      functionName,
      args
    }
    let requiredGas = await this.publicClient.estimateContractGas({
      address: await getAddress((environment as any)[chainId].EXCHANGE_CONTRACT),
      account: await getAddress(walletAddress),
      ...contractParams
    });
    let orderAbi = await encodeFunctionData({
      ...contractParams
    })
    return { orderAbi, requiredGas }
  }
}
