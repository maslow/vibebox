import { LogtoConfig } from '@logto/rn';

// Development configuration
export const logtoConfig: LogtoConfig = {
    endpoint: 'http://localhost:3001',
    appId: 'ctwsvtkhp7e0yn5nm6s93',
};

// Production configuration (will be used when deploying)
export const logtoConfigProd: LogtoConfig = {
    endpoint: process.env.EXPO_PUBLIC_LOGTO_ENDPOINT || 'http://localhost:3001',
    appId: process.env.EXPO_PUBLIC_LOGTO_APP_ID || 'ctwsvtkhp7e0yn5nm6s93',
};

// Current config (dev for now, will add environment detection later)
export const currentLogtoConfig = __DEV__ ? logtoConfig : logtoConfigProd;
