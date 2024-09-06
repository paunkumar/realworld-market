export enum loanStatus{
    forLoan,
    repayLoan
}


export const TRANSACTIONS_TYPE = {
  USER_TRANSACTIONS: 'user-transactions',
  NFT_TRANSACTIONS: 'nft-transactions',
  OFFERS_LIST: 'offers_list',
}

/**
 * Infts
 */
export interface INfts {
  _id: string;
  name: string;
  primary_media: string;
  collectionAddress: string;
  preview_image?: string;
  secondary_media: string[];
  fileType?: string;
}
/**
 * Itransaction details
 */
export interface ITransactionDetails {
  activeNft: any;
  transactionHash: string;
  contractAddress: string;
  operationName: string;
  operationStatus: number;
  transactionTime: string;
  errorMessage: string;
  nfts: INfts[];
}
