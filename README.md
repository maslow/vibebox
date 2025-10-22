# VibeBox

AI-powered coding server platform built on [Happy](https://github.com/slopus/happy) open-source project (MIT License).

## Overview

A **mobile-first** AI coding platform that provides subscription-based coding environments with native mobile apps and web access. Differentiates from desktop-focused competitors by prioritizing mobile vibe coding experience.

### Core Value

- **Mobile-First Experience**: Native iOS/Android apps optimized for mobile coding scenarios, with web as secondary platform
- **Ready to Use**: Pre-configured with Claude Code, Happy CLI, and development tools
- **Zero Config**: No need to manually configure API keys or development environment
- **Seamless Access**: Single unified client across all platforms - no app switching or OAuth redirects
- **Subscription-based**: Monthly/yearly subscription with included Claude API quota

## Technical Approach

**Zero Modification Solution** - Core principles:

- ✅ **No modification to happy-server** - Uses native API only
- ✅ **No modification to happy-cli** - Integration via configuration files
- ✅ **Customize client only** - Based on happy-client with enhancements

See [docs/implementation/zero-modification-solution.md](docs/implementation/zero-modification-solution.md) for details.

## Project Structure

```
.
├── client/                        # Expo/React Native client (based on happy-client)
│   ├── sources/                  # Application code
│   │   ├── app/                 # Expo Router pages
│   │   ├── components/          # UI components
│   │   ├── auth/                # Authentication
│   │   ├── sync/                # Real-time sync
│   │   └── platform/            # Commercial features (subscriptions, etc.)
│   └── package.json
│
├── server/                        # Next.js backend
│   ├── app/
│   │   ├── api/                 # API Routes
│   │   └── admin/               # Admin dashboard
│   ├── lib/                     # Utilities
│   ├── components/              # React components
│   └── package.json
│
├── shared/                        # Shared types between client and server
│   └── types/
│
├── docs/                          # Documentation
│   ├── design/                   # Design documents
│   ├── research/                 # Research documents
│   ├── implementation/           # Implementation plans
│   └── verification/             # Verification documents
│
├── verify-happy-integration.js   # Verification script (important tool)
│
├── happy-cli/                     # Happy CLI reference (excluded in .gitignore)
├── happy-server/                  # Happy Server reference (excluded)
└── happy-client/                  # Happy Client reference (excluded)
```

## Quick Start

### Requirements

- Node.js >= 20
- Yarn (recommended)
- Git

### Client (Expo/React Native)

```bash
cd client
yarn install
yarn start          # Start Expo development server
yarn ios            # Run on iOS simulator
yarn android        # Run on Android emulator
yarn web            # Run in web browser
```

### Server (Next.js)

```bash
cd server
yarn install
yarn dev            # Start development server
yarn build          # Build for production
yarn start          # Start production server
```

### Verification Script

To verify the zero-modification solution:

```bash
# Install dependencies
npm install tweetnacl tweetnacl-util axios

# Step 1: Create Happy account
node verify-happy-integration.js step1

# Step 2: Configure CLI (follow step1 output)
node verify-happy-integration.js step2 --token "YOUR_TOKEN" --secret "YOUR_SECRET"

# Step 3: Generate Web URL (follow step2 output)
node verify-happy-integration.js step3 --token "YOUR_TOKEN" --secret "YOUR_SECRET"
```

See [docs/verification/guide.md](docs/verification/guide.md) for detailed guide.

## Documentation

### Design Phase
- [Product Requirements (PRD)](docs/design/prd.md) - Core features and user journeys
- [White Paper](docs/design/white-paper.md) - Project vision and requirements

### Architecture Decisions
- [ADR 001: Client Technology Stack](docs/decisions/001-client-technology-stack.md) - Mobile-first architecture rationale

### Research Phase
- [Authentication System Analysis](docs/research/authentication-system-analysis.md) - In-depth analysis of Happy authentication
- [Web Integration Analysis](docs/research/web-integration-analysis.md) - Web integration approach comparison

### Implementation Phase
- [Zero Modification Solution](docs/implementation/zero-modification-solution.md) - Complete implementation plan and code
- [Verification Guide](docs/verification/guide.md) - Manual verification steps
- [Verification Results](docs/verification/results.md) - Verification outcomes

## Development Roadmap

### Phase 1: Preparation (Completed)
- ✅ Technical research
- ✅ Solution design
- ✅ Feasibility verification
- ✅ Project structure initialization

### Phase 2: Implementation (In Progress)
- 🔄 Client customization (based on happy-client)
- ⏳ Backend API development
- ⏳ Subscription system
- ⏳ Admin dashboard

### Phase 3: Deployment (Pending)
- ⏳ Production deployment
- ⏳ User testing
- ⏳ Official release

## Tech Stack

### Client
- **Expo** (SDK 54) - React Native framework
- **React Native** (0.81) - Cross-platform mobile development
- **React Native Web** - Web platform support
- **Expo Router** - File-based routing (similar to Next.js App Router)
- **Unistyles** - Responsive styling system

### Server
- **Next.js** (15) - React framework with API Routes
- **TypeScript** - Type safety
- **Axios** - HTTP client
- **Zod** - Schema validation

### Infrastructure
- **Happy Server** (Official, unmodified) - Core backend
- **PostgreSQL** - Database
- **Redis** - Cache and pub/sub
- **Docker** - Containerization
- **Nginx** - Reverse proxy

## References

- [Happy Official Repository](https://github.com/slopus/happy)
- [Happy Documentation](https://github.com/slopus/happy/blob/main/CLAUDE.md)
- [Claude Code](https://www.anthropic.com/claude)
- [Expo Documentation](https://docs.expo.dev/)
- [Next.js Documentation](https://nextjs.org/docs)

## License

Built on the MIT-licensed Happy project.

## Contributing

This project is currently in development. For questions or suggestions, please contact the project maintainers.

---

**Note**: This project is currently in development and not yet released for production use.
