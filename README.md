# agycli2api

A lightweight, single-user API proxy for Antigravity, exposing a standard Gemini API but proxying the requests to Google's Cloud Code (`daily-cloudcode-pa.googleapis.com`) infrastructure.

## Features

- **Standard Gemini API**: Clients can just send Gemini standard requests to `/v1beta/models/:model:generateContent`.
- **Anti-Ban Workarounds**: Automatically rewrites User-Agent, Client versions, and headers to match the official Antigravity IDE plugins.
- **Anti-Lobotomy**: Optionally injects the required System Instructions without causing the model to identify unnecessarily as Antigravity to the user (disabled by default).
- **Streaming Support**: Full Server-Sent Events (SSE) pass-through.
- **Seamless Authentication**: Directly reads and automatically refreshes tokens managed by `antigravity-cli`.

## Prepare

This proxy automatically uses the token maintained by `antigravity-cli`. 
The proxy will read from `~/.gemini/antigravity-cli/antigravity-oauth-token` and will automatically refresh the token for you when it expires.

Run `agy -p hi` to initialize.

## Usage

### Docker Deployment

You can run `agycli2api` using Docker. A `docker-compose.yml` file is provided in the `docker` directory.

1. Ensure you have run `agy -p hi` locally first to generate the necessary credentials and a valid session database.
2. The Docker setup uses a named volume `gemini-data` for the `/root/.gemini` directory. You will need to copy your local `~/.gemini` contents into this volume (or mount it appropriately) for the proxy to access the OAuth token and conversation databases.
3. Start the container:

```bash
docker-compose -f docker/docker-compose.yml up -d
```

The container's entrypoint script will automatically extract the latest `ANTIGRAVITY_VERSION` and a valid `ANTIGRAVITY_SESSION_ID` for you.

### Manual Installation (npm)

Start the proxy server:

```bash
npm install
npm run build
npm run start
```

Alternatively, for active development with auto-reloading:

```bash
npm run dev
```

The server will run on port `3403` by default.

### Example Request

```bash
curl -X POST http://localhost:3403/v1beta/models/gemini-3-flash:generateContent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "contents": [{
      "parts": [{"text": "Hello, how are you?"}],
      "role": "user"
    }]
  }'
```

## Proxy Logic & Telemetry Simulation

To accurately simulate the telemetry and behavior of the official Antigravity IDE plugins, the proxy implements sophisticated session and step tracking logic:

- **Session Identification via Content Hashing**: Since the API receives stateless requests, the proxy hashes the conversation history (`contents`) to correlate incoming requests and group them into persistent logical sessions.
- **Dynamic Step Indexing**: To mimic real IDE background step progression, the `stepIndex` for a new session starts at `3`. For subsequent requests in the same session, the index randomly increments by `2` to `5` steps each time.
- **Execution ID Injection**: The proxy keeps track of user message counts to identify distinct user turns. For any non-first user turn within a session, a random UUID is generated as the `last_execution_id` and automatically injected into the outgoing request labels.

## Configuration

Some behaviors can be configured via environment variables, while others are intentionally hardcoded to maintain compatibility with the official Antigravity IDE plugins.

- **`AGYCLI2API_KEY`**: The API key required to authenticate requests to the proxy server. If not specified, a random key will be generated automatically and printed to the server logs on startup.
- **`ANTIGRAVITY_VERSION`**: Allows you to override the default Antigravity CLI version (`1.0.6`) used in the `User-Agent`. Set this environment variable if the official client updates and you need to match it.
- **`ANTIGRAVITY_SESSION_ID`**: The session ID to use for requests. You can find a valid session ID by inspecting the files in `~/.gemini/antigravity-cli/conversations/` or by capturing packets from the official plugin. If not provided, a random session ID will be generated. Try `extract_session_id` script.
- **`INJECT_SYSTEM_PROMPT`**: Set to `"true"` to enable injection of the Anti-Lobotomy System Instruction into the payload. Disabled by default.

**Hardcoded Configurations (Do not modify unless official endpoints/credentials change):**
- **`OAUTH_CONFIG`**: The OAuth Client ID and Secret are hardcoded to match the official desktop CLI. Changing these will break authentication.
- **`ANTIGRAVITY_ENDPOINT_DAILY`**: Points to `daily-cloudcode-pa.googleapis.com` internally.
- **`ANTIGRAVITY_SYSTEM_INSTRUCTION`**: The Anti-Lobotomy system instruction payload itself.
