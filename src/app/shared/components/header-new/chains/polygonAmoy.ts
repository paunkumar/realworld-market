import { defineChain } from "viem";

export const polygonAmoy = /*#__PURE__*/ defineChain({
  id: 80_002,
  name: 'Polygon Amoy',
  network: 'maticmum',
  nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
  rpcUrls: {
    default: {
      http: ['https://rpc-amoy.polygon.technology'],
    },
    public: {
      http: ['https://rpc-amoy.polygon.technology'],
    },
  },
  blockExplorers: {
    default: {
      name: 'OK LINK',
      url: 'https://www.oklink.com/amoy',
    },
  },
  testnet: true,
})