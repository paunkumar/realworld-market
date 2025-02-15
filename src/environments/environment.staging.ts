export const environment = {
    production: false,
    ENVNAME: 'STAGING',
    API_BASE_URL: "https://stagingapi.realworld.fi/api/v1",
    API_BASE_URL_V2: "https://stagingapi.realworld.fi/api/v2/market-place",
    SOCKET_BASE_URL: "https://stagingapi.realworld.fi:3060",
    WEB_SITE_URL: 'https://stagingmarket.realworld.fi/',
    '0x89': {
        EXPLORER: 'https://polygonscan.com',
        PROVIDER: 'https://polygon-mainnet.infura.io/v3/dd42eb8e92fb4f55b21dc1070bb1d997',
        CHAIN_NETWORK: '0x89',
        CHAINID: 137,
        CURRENCY_NAME: 'MATIC',
        CURRENCY_SYMBOL: 'MATIC',
        CHAIN_NAME: 'Polygon',
        ACCESS_CONTROL_CONTRACT: '0x4D46A881B53D7CbaF31fb438f5F77A918c666998',
        BORROW_LEND_CONTRACT: '0x1a82d7EC18D0b7f14fcA66CF348AF89293E2597E',
        EXCHANGE_CONTRACT: '0x27891344D21784069693E95Fba864220846f6468',
        LOAN_IN_DAYS: true
    },
    '0x13882': {
        EXPLORER: 'https://www.oklink.com/amoy‍',
        PROVIDER: 'https://rpc-amoy.polygon.technology/',
        CHAIN_NETWORK: '0x13882',
        CHAINID: 80002,
        CURRENCY_NAME: 'MATIC',
        CURRENCY_SYMBOL: 'MATIC',
        CHAIN_NAME: 'Polygon Testnet',
        ACCESS_CONTROL_CONTRACT: '0x7Fc41CcB5f94ABE4E56949B3F06042780F7cDDab',
        BORROW_LEND_CONTRACT: '0x4D41C7BeF6F96Cc5fB67D010E45d0a8CC3d78bBC',
        EXCHANGE_CONTRACT: '0xBc17a089ff98b896c9F9C0F1058bdA24BF50d95A',
        LOAN_IN_DAYS: false
    },
    WALLET_CONNECT_PROJECT_ID: "b6c201630414d0fd586cfc6add82cde7",
    COINGECKO_API: "https://api.coingecko.com/api/v3/simple",
    COINGECKO_API_KEY: "CG-eAbDVDxfBA1YYo4jncze1jrQ",
    DEFAULT_NETWORK: '137',
    DEFAULT_CHAIN: '0x89',
    PINATA_KEY: '3816585697981d38d50d',
    PINATA_SECRET: '4722d4967331aafb013d9dab2bc6e3534e654be9a1cbc8ce4aa4adaec3c13f27',
    PINATA_BASE_URL: 'https://chocolate-magnificent-blackbird-410.mypinata.cloud/ipfs/',
    GOOGLE_LOGIN_PROVIDER: '398286696618-p0aem6s2cghcp62g4hgvkd7offm7ota4.apps.googleusercontent.com',
    IDENFY_API_KEY: 'ppdYv8Gvqfu',
    IDENFY_API_SECRET: '9bTtDT2YW2pVU0lshdzB',

    // Gold category ENVs
    ONE_OUNCE: "28.35g",
    TEN_TOLA_BAR: "116.64g",
    ONE_KILO_GRAM: "1000g"
};
