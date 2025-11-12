FROM node:20-slim

# Set working directory to match docker-compose volume mount
WORKDIR /app

# Install minimal deps
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y curl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Install pnpm globally
RUN npm install -g pnpm

# Copy lockfile and package manifest first for better caching
COPY package.json pnpm-lock.yaml* ./

# Install dependencies (will use mounted node_modules in dev via compose)
RUN pnpm install --frozen-lockfile || pnpm install

# Copy application code
COPY . .

EXPOSE 5173

CMD ["pnpm", "run", "dev"]
