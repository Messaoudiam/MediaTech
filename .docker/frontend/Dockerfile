# Build stage
FROM node:20-alpine AS builder

# Install security updates
RUN apk update && apk upgrade && \
    rm -rf /var/cache/apk/*

WORKDIR /usr/src/app

# Copy package files for better layer caching
COPY package*.json ./

# Install dependencies with frozen lockfile
RUN npm ci --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN npm run build:prod

# Production stage
FROM nginx:alpine AS production

# Install security updates
RUN apk update && apk upgrade && \
    apk add --no-cache dumb-init && \
    rm -rf /var/cache/apk/*

# Create non-root user (nginx group already exists)
RUN adduser -S appuser -u 1001 -G nginx

# Copy built application (Angular 19 creates browser subfolder)
COPY --from=builder /usr/src/app/dist/frontend/browser /usr/share/nginx/html

# Remove default nginx config and create optimized one
RUN rm /etc/nginx/conf.d/default.conf
COPY <<EOF /etc/nginx/conf.d/default.conf
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;
    
    # Security headers
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/json
        application/xml
        image/svg+xml;
    
    # Handle Angular client-side routing
    location / {
        try_files \$uri \$uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webp|avif)\$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            add_header Vary "Accept-Encoding";
        }
    }
    
    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\\n";
        add_header Content-Type text/plain;
    }
    
    # Security: block sensitive files
    location ~* \.(env|log|ini|conf|bak|old|tmp)\$ {
        deny all;
        return 404;
    }
    
    # Block access to hidden files
    location ~ /\\. {
        deny all;
        return 404;
    }
}
EOF

# Set proper permissions
RUN chown -R appuser:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

EXPOSE 80

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["nginx", "-g", "daemon off;"]