# Build stage
FROM node:20-alpine AS builder

# Install security updates and build dependencies
RUN apk update && apk upgrade && \
    apk add --no-cache dumb-init && \
    rm -rf /var/cache/apk/*

WORKDIR /usr/src/app

# Copy package files for better layer caching
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including dev dependencies for build)
RUN npm ci --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma client and build the application
RUN npm run prisma:generate && \
    npm run build

# Create production dependencies
RUN npm ci --only=production --frozen-lockfile && \
    cp -R node_modules production_node_modules

# Production stage
FROM node:20-alpine AS production

# Install security updates and runtime dependencies
RUN apk update && apk upgrade && \
    apk add --no-cache dumb-init && \
    rm -rf /var/cache/apk/*

WORKDIR /usr/src/app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs

# Copy built application and production dependencies
COPY --from=builder --chown=nestjs:nodejs /usr/src/app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /usr/src/app/production_node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /usr/src/app/prisma ./prisma
COPY --from=builder --chown=nestjs:nodejs /usr/src/app/package*.json ./

# Create directories with proper permissions
RUN mkdir -p uploads logs && \
    chown -R nestjs:nodejs uploads logs

# Switch to non-root user
USER nestjs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/src/main.js"]