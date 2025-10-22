# Shared Types

Shared type definitions between client and server.

## Usage

### In Client (Expo/React Native)

```typescript
import type { PlatformUser, VibeServer } from '@/../../shared/types';
```

### In Server (Next.js)

```typescript
import type { PlatformUser, VibeServer } from '@/shared/types';
```

## Type Categories

- **User types**: Platform user and account mappings
- **VibeBox server types**: Server status and configuration
- **Subscription types**: Subscription plans and status
- **API types**: Common API response formats
- **Happy types**: Types from Happy ecosystem (credentials, machines, sessions)
