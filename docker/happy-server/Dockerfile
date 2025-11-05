# Simplified Happy Server Dockerfile for e2e testing
# Based on official happy-server but with minimal dependencies

FROM node:20-slim AS runner

WORKDIR /app

# Install only essential dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    python3 \
    wget \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Clone and setup happy-server from local upstream
# Note: In production, this should be built from the actual source
COPY ./upstream/happy-server/package.json ./upstream/happy-server/yarn.lock ./
COPY ./upstream/happy-server/prisma ./prisma/
COPY ./upstream/happy-server/sources ./sources/
COPY ./upstream/happy-server/tsconfig.json ./

# Install dependencies
RUN yarn install --frozen-lockfile --ignore-engines --production

# Generate Prisma client
RUN yarn prisma generate

# Set environment to production
ENV NODE_ENV=production

# Expose the port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=15s --timeout=5s --start-period=40s --retries=5 \
    CMD wget --spider -q http://localhost:3000/health || exit 1

# Start the server
CMD ["yarn", "start"]
