import React from 'react';
import { Platform } from 'react-native';
import { currentLogtoConfig } from '@/config/logto';

// Platform-specific imports
// Web: Use @logto/react for redirect-based authentication
// Native: Use @logto/rn for native browser authentication
const LogtoSDKProvider = Platform.OS === 'web'
    ? require('@logto/react').LogtoProvider
    : require('@logto/rn').LogtoProvider;

export function LogtoProvider({ children }: { children: React.ReactNode }) {
    return (
        <LogtoSDKProvider config={currentLogtoConfig}>
            {children}
        </LogtoSDKProvider>
    );
}
