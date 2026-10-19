# Build stage
FROM node:18-alpine AS build-stage

WORKDIR /app

# Copy package manifests
COPY package*.json ./

# Install dependencies (including devDependencies for build)
RUN npm install

# Copy source code
COPY . ./

# Build the application
RUN npm run build

# Production stage
FROM nginx:stable-alpine AS production-stage

# Copy build artifacts to Nginx html directory
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration for SPA routing and API proxying
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
