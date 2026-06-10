FROM node:22-slim AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:22-slim
# Install binutils for strings command
RUN apt-get update && apt-get install -y binutils && rm -rf /var/lib/apt/lists/*

# Install antigravity-cli
RUN set -e && \
    output=$(curl -fsSL https://antigravity.google/cli/install.sh | bash 2>&1) && \
    echo "$output" && \
    ANTIGRAVITY_VERSION=$(echo "$output" | grep "Latest available version:" | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -n 1) && \
    if [ -z "$ANTIGRAVITY_VERSION" ]; then \
        echo "Error: Failed to extract ANTIGRAVITY_VERSION" >&2; \
        exit 1; \
    fi && \
    echo "export ANTIGRAVITY_VERSION=$ANTIGRAVITY_VERSION" > /env.sh
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
EXPOSE 3403
ENTRYPOINT ["/entrypoint.sh"]
CMD ["npm", "start"]
