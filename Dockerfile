# Stage 1: Builder
FROM node:22.16 AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* pnpm-lock.yaml* ./

# Install dependencies including devDependencies (for Prisma)
RUN npm install --include=dev

# Copy all source files including Prisma schema
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the app
RUN npm run build

# Stage 2: Production
FROM node:22.16

WORKDIR /app

# Copy only production dependencies and Prisma client from builder
COPY package.json package-lock.json* pnpm-lock.yaml* ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist   # adjust if your build output folder is./
COPY --from=builder /app/prisma ./prisma

# Set environment variables
ENV NODE_ENV=production

# Expose your app port
EXPOSE 3000

# Start the app
CMD ["node", "dist/server.js"]   # adjust to your server entry file
