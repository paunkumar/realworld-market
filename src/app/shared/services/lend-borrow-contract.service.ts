import { Injectable } from '@angular/core';
import { getPublicClient, readContract, readContracts } from '@wagmi/core';
import { encodeFunctionData, getAddress } from 'viem';

import { Erc20ContractService } from 'src/app/shared/services/erc20-contract.service';
import { ContractUtils } from 'src/app/shared/utils/contract-utils';
import { environment } from 'src/environments/environment';

const erc20Abi = require('src/app/shared/abis/erc20.json');
const collectionAbi = require('src/app/shared/abis/collection.json');
const nftLoanAbi = require('src/app/shared/abis/nft-loan.json');

@Injectable({
    providedIn: 'root'
})
export class LendBorrowContractService {

    publicClient = getPublicClient();

    constructor(
        private contractUtils: ContractUtils,
        private erc20ContractService: Erc20ContractService
    ) { }

    public async getAllowance(account: any, currencyData: any) {
        const allowance: any = await readContract({
            address: await getAddress(currencyData.address),
            abi: erc20Abi,
            chainId: account.networkId,
            functionName: 'allowance',
            args: [account.walletAddress, (environment as any)[account.chainId].BORROW_LEND_CONTRACT]
        });
        const decimal = await this.erc20ContractService.getDecimal(account.networkId, currencyData.address);
        return await this.contractUtils.decimalDivider(Number(decimal), allowance);
    }

    public async getDurationInDays(account: any, loanId: string) {
        return await readContract({
            address: await getAddress((environment as any)[account.chainId].BORROW_LEND_CONTRACT),
            abi: nftLoanAbi,
            chainId: account.networkId,
            functionName: 'getDurationInDays',
            args: [loanId]
        });
    }

    public async getRepaymentAmountWithInterest(account: any, loanData: any, duration: number) {
        const repayAmount: any = await readContract({
            address: await getAddress((environment as any)[account.chainId].BORROW_LEND_CONTRACT),
            abi: nftLoanAbi,
            chainId: account.networkId,
            functionName: 'calculateRepaymentWithInterest',
            args: [loanData.nonce, duration]
        });
        const decimal: any = await this.erc20ContractService.getDecimal(account.networkId, loanData.currency_data.address)
        return await this.contractUtils.decimalDivider(decimal, repayAmount)
    }

    /**
     * Sets approval for all nfts abi
     * @param collectionAddress
     * @param approvalStatus
     * @param chainId
     * @returns
     */
    public async setApprovalForAllNFTsAbi({ chainId, walletAddress }: any, collectionAddress: string, { functionName, args }: any) {
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
        let approvalAbi = await encodeFunctionData({
            ...contractParams
        })
        return { approvalAbi, requiredGas }
    }

    public async lendNFTParams(borrower: string, lender: string, nfts: any[], requestId: string, startTime: number, duration: number, loanPaymentContract: string, loanAmount: number, loanPercentage: number, loanId: number, chainId: number) {
        const decimal = await this.erc20ContractService.getDecimal(chainId, loanPaymentContract);
        return {
            borrower,
            lender,
            nfts,
            requestId,
            startTime,
            duration,
            loanPaymentContract,
            loanAmount: loanAmount > 0 ? this.contractUtils.decimalMultipler(Number(decimal), loanAmount) : 0,
            loanPercentage,
            loanId,
        };
    }

    public async loanOfferParams(borrower: string, lender: string, nfts: any[], startTime: number, duration: number, loanPaymentContract: string, loanAmount: number, loanPercentage: number, chainId: number) {
        const decimal = await this.erc20ContractService.getDecimal(chainId, loanPaymentContract);
        return {
            borrower,
            lender,
            nfts,
            startTime,
            duration,
            loanPaymentContract,
            loanAmount: loanAmount > 0 ? this.contractUtils.decimalMultipler(Number(decimal), loanAmount) : 0,
            loanPercentage
        };
    }

    public async acceptCounterOfferABI({ chainId, walletAddress }: any, { functionName, args }: any) {
        let contractParams = {
            abi: nftLoanAbi,
            functionName,
            args
        }
        let requiredGas = await this.publicClient.estimateContractGas({
            address: await getAddress((environment as any)[chainId].BORROW_LEND_CONTRACT),
            account: walletAddress,
            ...contractParams
        });
        console.log(requiredGas)
        let acceptCounterOfferAbi = await encodeFunctionData({
            ...contractParams
        })
        return { acceptCounterOfferAbi, requiredGas }
    }

    public async acceptLoanOfferABI({ chainId, walletAddress }: any, { functionName, args }: any) {
        let contractParams = {
            abi: nftLoanAbi,
            functionName,
            args
        }
        let requiredGas = await this.publicClient.estimateContractGas({
            address: await getAddress((environment as any)[chainId].BORROW_LEND_CONTRACT),
            account: walletAddress,
            ...contractParams
        });
        let acceptLoanOfferAbi = await encodeFunctionData({
            ...contractParams
        })
        return { acceptLoanOfferAbi, requiredGas }
    }

    /**
     * Repays loan abi
     * @param chainId
     * @param loanId
     * @returns
     */
    public async repayLoanABI({ chainId, walletAddress }: any, { functionName, args }: any) {
        let contractParams = {
            abi: nftLoanAbi,
            functionName,
            args
        }
        let requiredGas = await this.publicClient.estimateContractGas({
            address: await getAddress((environment as any)[chainId].BORROW_LEND_CONTRACT),
            account: walletAddress,
            ...contractParams
        });
        let repayLoanAbi = await encodeFunctionData({
            ...contractParams
        })
        return { repayLoanAbi, requiredGas }
    }

    /**
     * Forces close abi
     * @returns
     */
    public async forceCloseABI({ chainId, walletAddress }: any, { functionName, args }: any) {
        let contractParams = {
            abi: nftLoanAbi,
            functionName,
            args
        }
        let requiredGas = await this.publicClient.estimateContractGas({
            address: await getAddress((environment as any)[chainId].BORROW_LEND_CONTRACT),
            account: walletAddress,
            ...contractParams
        });
        let forceCloseAbi = await encodeFunctionData({
            ...contractParams
        })
        return { forceCloseAbi, requiredGas }
    }

    public async createLoanRequest({ chainId, walletAddress }: any, { functionName, args }: any) {
        let contractParams = {
            abi: nftLoanAbi,
            functionName,
            args
        }
        let requiredGas = await this.publicClient.estimateContractGas({
            address: await getAddress((environment as any)[chainId].BORROW_LEND_CONTRACT),
            account: walletAddress,
            ...contractParams
        });
        let createLoanRequestAbi = await encodeFunctionData({
            ...contractParams
        })
        return { createLoanRequestAbi, requiredGas }
    }

    public async editLoanRequest({ chainId, walletAddress }: any, { functionName, args }: any) {
        let contractParams = {
            abi: nftLoanAbi,
            functionName,
            args
        }
        let requiredGas = await this.publicClient.estimateContractGas({
            address: await getAddress((environment as any)[chainId].BORROW_LEND_CONTRACT),
            account: walletAddress,
            ...contractParams
        });
        let editLoanRequestAbi = await encodeFunctionData({
            ...contractParams
        })
        return { editLoanRequestAbi, requiredGas }
    }

    public async cancelLoanRequest({ chainId, walletAddress }: any, { functionName, args }: any) {
        let contractParams = {
            abi: nftLoanAbi,
            functionName,
            args
        }
        let requiredGas = await this.publicClient.estimateContractGas({
            address: await getAddress((environment as any)[chainId].BORROW_LEND_CONTRACT),
            account: walletAddress,
            ...contractParams
        });
        let cancelLoanAbi = await encodeFunctionData({
            ...contractParams
        })
        return { cancelLoanAbi, requiredGas }
    }

    public async acceptLoanRequestABI({ chainId, walletAddress }: any, { functionName, args }: any) {
        let contractParams = {
            abi: nftLoanAbi,
            functionName,
            args
        }
        console.log(contractParams)
        let requiredGas = await this.publicClient.estimateContractGas({
            address: await getAddress((environment as any)[chainId].BORROW_LEND_CONTRACT),
            account: walletAddress,
            ...contractParams
        });
        let acceptLoanAbi = await encodeFunctionData({
            ...contractParams
        })
        return { acceptLoanAbi, requiredGas }
    }

    async loanParams(borrower: string, nfts: any[], duration: number, loanPaymentContract: string, loanAmount: number, loanPercentage: number, loanId: number, chainId: number) {
        const decimal = await this.erc20ContractService.getDecimal(chainId, loanPaymentContract);
        return {
            borrower,
            nfts,
            duration,
            loanPaymentContract,
            loanAmount: loanAmount > 0 ? this.contractUtils.decimalMultipler(Number(decimal), loanAmount) : 0,
            loanPercentage,
            loanId
        };
    }

    getLoanStatus = async (chainId: string, loanId: Number) => {
        return await readContract({
            address: await getAddress((environment as any)[chainId].BORROW_LEND_CONTRACT),
            abi: nftLoanAbi,
            chainId: (environment as any)[chainId].CHAINID,
            functionName: 'loanStatus',
            args: [loanId]
        });
    }

    getLoanClass = async (chainId: string) => {
        const collectionContract = {
            address: await getAddress((environment as any)[chainId].BORROW_LEND_CONTRACT),
            abi: nftLoanAbi,
            chainId: (environment as any)[chainId].CHAINID
        }
        return await readContracts({
            contracts: [
                {
                    ...collectionContract,
                    functionName: 'CANCELLED_LOAN_CLASS',
                    args: []
                },
                {
                    ...collectionContract,
                    functionName: 'COMPLETED_LOAN_CLASS',
                    args: []
                },
                {
                    ...collectionContract,
                    functionName: 'CLOSED_LOAN_CLASS',
                    args: []
                },
                {
                    ...collectionContract,
                    functionName: 'REPAYED_LOAN_CLASS',
                    args: []
                }
            ]
        });
    }
}
