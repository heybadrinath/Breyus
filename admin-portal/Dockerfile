# Breyus Admin Portal - Multi-stage Docker Build
# Stage 1: Build the Vite React application

FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Accept build arguments for environment variables
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --silent

# Copy source code
COPY . .

# Remove local .env to ensure build args take precedence
RUN rm -f .env .env.local .env.production

# Build the application
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine AS production

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from build stage (Vite outputs to dist/)
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
