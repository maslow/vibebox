import React from 'react';
import { LogtoProvider as LogtoSDKProvider } from '@logto/rn';
import { currentLogtoConfig } from '@/config/logto';

export function LogtoProvider({ children }: { children: React.ReactNode }) {
    return (
        <LogtoSDKProvider config={currentLogtoConfig}>
            {children}
        </LogtoSDKProvider>
    );
}
