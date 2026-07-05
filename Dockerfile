# Stage 1: Build the frontend and compile the server
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package configuration files
COPY package*.json ./

# Install all dependencies including devDependencies
RUN npm ci

# Copy the rest of the application files
COPY . .

# Build the frontend and compile the Express server with esbuild
RUN npm run build

# Stage 2: Production environment
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy compiled assets and server from the builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/.env.example ./.env.example

# Set standard environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose the default application port
EXPOSE 3000

# Run the compiled production CJS server
CMD ["npm", "run", "start"]
