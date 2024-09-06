import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { getPublicClient, readContract, readContracts } from '@wagmi/core';
import { encodeFunctionData, getAddress } from 'viem';

import { environment } from 'src/environments/environment';

const collectionAbi = require('src/app/shared/abis/collection.json');

@Injectable({
  providedIn: 'root'
})
export class CollectionContractService {

  publicClient = getPublicClient();

  constructor(
    private http: HttpClient
  ) { }

  getCollectionMetadata = async (chainId: number, contractAddress: string) => {
    const collectionContract = {
      address: await getAddress(contractAddress),
      abi: collectionAbi,
      chainId
    }
    let contractResults:any = await readContracts({
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

  approveNft = async ({chainId, walletAddress}: any, collectionAddress: string, {functionName, args}: any) => {
    let contractParams = {
      abi: collectionAbi,
      functionName,
      args
    }
    let requiredGas = await this.publicClient.estimateContractGas({
      address: await getAddress(collectionAddress),
      account: walletAddress,
      ...contractParams
    });
    let approveAbi = await encodeFunctionData({
      ...contractParams
    })
    return { approveAbi, requiredGas }
  }

  getApproved = async (chainId: any, collectionAddress: string, tokenId: number) => {
    return await readContract({
      address: await getAddress(collectionAddress),
      abi: collectionAbi,
      chainId,
      functionName: 'getApproved',
      args: [tokenId]
    });
  }

  getNextMintableToken = async (chainId: any, collectionAddress: string) => {
    return await readContract({
      address: await getAddress(collectionAddress),
      abi: collectionAbi,
      chainId,
      functionName: 'getNextMintableToken',
      args: []
    });
  }

  supportsInterface = async (chainId: any, collectionAddress: string) => {
    return await readContract({
      address: await getAddress(collectionAddress),
      abi: collectionAbi,
      chainId,
      functionName: 'supportsInterface',
      args: ['0x80ac58cd']
    });
  }

  public async getPlatformFee({chainId}: any, collectionAddress: string) {
    return await readContract({
      address: await getAddress(collectionAddress),
      abi: collectionAbi,
      chainId,
      functionName: 'platformFee',
      args: []
    });
  }

}
