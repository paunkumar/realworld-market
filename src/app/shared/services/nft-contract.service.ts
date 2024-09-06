import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { readContract, getContract, getPublicClient } from '@wagmi/core';
import { encodeFunctionData, getAddress, parseEther, parseGwei } from 'viem';
import { writeContract, waitForTransaction } from '@wagmi/core'
import { environment } from 'src/environments/environment';
import { WebStorageService } from './web-storage.service';

const collectionAbi = require('src/app/shared/abis/collection.json');
const lazyMintAbi = require('src/app/shared/abis/lazy-mint-nft.json');

@Injectable({
  providedIn: 'root'
})
export class NftContractService {

  publicClient = getPublicClient();

  constructor(
    private http: HttpClient,
    private webStorageService: WebStorageService
  ) { }

  /**
   * Gets nft owner
   * @param collectionAddress
   * @param tokenId
   * @param chainId
   * @returns
   */
  public async getNftOwner(collectionAddress: string, tokenId: number, chainId: number) {
    return await readContract({
      address: await getAddress(collectionAddress),
      abi: collectionAbi,
      chainId,
      functionName: 'ownerOf',
      args: [tokenId]
    });
  }


  /**
   * Gets nft meta data by url
   * @param url
   * @returns
   */
  public getNftMetaDataByURL(url: string) {
    return this.http.get(url);
  }

  public async lazyMint({chainId, walletAddress}: any, {functionName, args, value}: any, collectionAddress: string) {
    let contractParams = {
      abi: lazyMintAbi,
      functionName,
      args
    }
    let requiredGas = await this.publicClient.estimateContractGas({
      address: await getAddress(collectionAddress),
      account: await getAddress(walletAddress),
      value: value ? parseEther(value.toString()) : 0n,
      ...contractParams
    });
    let orderAbi = await encodeFunctionData({
      ...contractParams
    })
    return { orderAbi, requiredGas }
  }

  async getRoyaltyInfo(collection: string, tokenId: string, price: any) {
    return await readContract({
      address: await getAddress(collection),
      abi: collectionAbi,
      functionName: 'royaltyInfo',
      args: [tokenId, price]
    });
  }

  transferNft = async ({chainId, walletAddress}: any, collectionAddress: string, {functionName, args}: any) => {
    let contractParams = {
      abi: collectionAbi,
      functionName,
      args
    }
    let requiredGas = await this.publicClient.estimateContractGas({
      address: await getAddress(collectionAddress),
      account: await getAddress(walletAddress),
      ...contractParams
    });
    let transferAbi = await encodeFunctionData({
      ...contractParams
    })
    return { transferAbi, requiredGas }
  }

}
