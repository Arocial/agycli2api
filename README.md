# agy-cli-proxy

A lightweight, single-user API proxy for Antigravity, exposing a standard Gemini API but proxying the requests to Google's Cloud Code (`daily-cloudcode-pa.googleapis.com`) infrastructure.

## Features

- **Standard Gemini API**: Clients can just send Gemini standard requests to `/v1beta/models/:model:generateContent`.
- **Anti-Ban Workarounds**: Automatically rewrites User-Agent, Client versions, and headers to match the official Antigravity IDE plugins.
- **Anti-Lobotomy**: Injects the required System Instructions without causing the model to identify unnecessarily as Antigravity to the user.
- **Streaming Support**: Full Server-Sent Events (SSE) pass-through.

## Installation

```bash
npm install
```

## Authentication

Before running the proxy, you must authenticate once using your Google account:

```bash
node index.js auth
```

This will open a local web server and print a URL to your console. Open the URL in your browser, log in, and the token will be automatically retrieved and stored in `~/.config/agy-cli-proxy/token.json`. It will automatically refresh when expired.

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
