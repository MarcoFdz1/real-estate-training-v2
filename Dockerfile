# Multi-stage build for production
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install yarn globally
RUN npm install -g yarn

# Copy package files (yarn.lock is important!)
COPY frontend/package.json frontend/yarn.lock ./

# Install dependencies using yarn
RUN yarn install --frozen-lockfile --production=false

# Copy source code
COPY frontend/ .

# Build the application
RUN yarn build

# Production stage
FROM nginx:alpine AS production

# Copy built app from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]