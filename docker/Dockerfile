FROM node:22-slim AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:22-slim
# Install binutils for strings command
RUN apt-get update && apt-get install -y binutils curl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

ARG TARGETARCH=amd64
# The release manifest is a cache key, so a new agy release invalidates the install layer.
ADD https://antigravity-cli-auto-updater-974169037036.us-central1.run.app/manifests/linux_${TARGETARCH}.json /tmp/antigravity-manifest.json
RUN set -e && \
    output=$(curl -fsSL https://antigravity.google/cli/install.sh | bash 2>&1) && \
    echo "$output" && \
    ANTIGRAVITY_VERSION=$(node -p "JSON.parse(require('fs').readFileSync('/tmp/antigravity-manifest.json', 'utf8')).version") && \
    if [ -z "$ANTIGRAVITY_VERSION" ]; then \
        echo "Error: Failed to extract ANTIGRAVITY_VERSION" >&2; \
        exit 1; \
    fi && \
    echo "export ANTIGRAVITY_VERSION=$ANTIGRAVITY_VERSION" > /env.sh && \
    rm /tmp/antigravity-manifest.json

COPY --from=builder /app/dist ./dist
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
EXPOSE 3403
ENTRYPOINT ["/entrypoint.sh"]
CMD ["npm", "start"]
