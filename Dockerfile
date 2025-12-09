# Use official Node.js image as base
FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies (including production ones)
RUN npm ci

# Copy source code
COPY . .

# Build step (optional if using tsx in prod/preview, but good for type checking)
# RUN npm run biome && npm run cf-typegen 

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Command to run the application using TSX for simplicity, 
# or you could compile to JS and run with node
CMD ["npm", "run", "start:node"]
