# agy-cli-proxy

A lightweight, single-user API proxy for Antigravity, exposing a standard Gemini API but proxying the requests to Google's Cloud Code (`daily-cloudcode-pa.googleapis.com`) infrastructure.

## Features

- **Standard Gemini API**: Clients can just send Gemini standard requests to `/v1beta/models/:model:generateContent`.
- **Anti-Ban Workarounds**: Automatically rewrites User-Agent, Client versions, and headers to match the official Antigravity IDE plugins.
- **Anti-Lobotomy**: Injects the required System Instructions without causing the model to identify unnecessarily as Antigravity to the user.
- **Streaming Support**: Full Server-Sent Events (SSE) pass-through.
- **Seamless Authentication**: Directly reads and automatically refreshes tokens managed by `antigravity-cli`.

## Installation

```bash
npm install
```

## Authentication

This proxy automatically uses the token maintained by `antigravity-cli`. 

Ensure you have authenticated through `antigravity-cli` at least once:
```bash
# Run whatever command is normally used by antigravity-cli to login
antigravity-cli login
```

The proxy will read from `~/.gemini/antigravity-cli/antigravity-oauth-token` and will automatically refresh the token for you when it expires.

## Usage

Start the proxy server:

```bash
npm start
```

The server will run on port `8080` by default.

### Example Request

```bash
curl -X POST http://localhost:8080/v1beta/models/gemini-1.5-pro:generateContent \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{
      "parts": [{"text": "Hello, how are you?"}],
      "role": "user"
    }]
  }'
```

## Configuration

Some behaviors can be configured via environment variables, while others are intentionally hardcoded to maintain compatibility with the official Antigravity IDE plugins.

- **`FALLBACK_ANTIGRAVITY_VERSION`**: Allows you to override the default Antigravity CLI version (`1.0.6`) used in the `User-Agent`. Set this environment variable if the official client updates and you need to match it.

**Hardcoded Configurations (Do not modify unless official endpoints/credentials change):**
- **`OAUTH_CONFIG`**: The OAuth Client ID and Secret are hardcoded to match the official desktop CLI. Changing these will break authentication.
- **`ANTIGRAVITY_ENDPOINT_DAILY`**: Points to `daily-cloudcode-pa.googleapis.com` internally.
- **`ANTIGRAVITY_SYSTEM_INSTRUCTION`**: System instructions are injected into the payload automatically to prevent lobotomy.
