# Breyus Frontend - Multi-stage Docker Build
# Stage 1: Build the React application

FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Accept build arguments for environment variables
ARG REACT_APP_BACKEND_URL=http://localhost:3001
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL

# Copy package files
COPY package*.json ./

# Install dependencies (using npm install to handle package.json/lock file sync)
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine AS production

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from build stage
COPY --from=build /app/build /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
