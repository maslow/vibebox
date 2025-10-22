import { LogtoConfig } from '@logto/rn';

// Development configuration
export const logtoConfig: LogtoConfig = {
    endpoint: 'http://localhost:3001',
    appId: '4bq12e6inwe0grgandxsx',
};

// Production configuration (will be used when deploying)
export const logtoConfigProd: LogtoConfig = {
    endpoint: process.env.EXPO_PUBLIC_LOGTO_ENDPOINT || 'http://localhost:3001',
    appId: process.env.EXPO_PUBLIC_LOGTO_APP_ID || '4bq12e6inwe0grgandxsx',
};

// Current config (dev for now, will add environment detection later)
export const currentLogtoConfig = __DEV__ ? logtoConfig : logtoConfigProd;
