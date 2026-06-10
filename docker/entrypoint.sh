#!/bin/bash
set -e

# Source ANTIGRAVITY_VERSION
. /env.sh

if [ -z "$ANTIGRAVITY_VERSION" ]; then
    echo "Error: ANTIGRAVITY_VERSION is empty" >&2
    exit 1
fi

# Extract ANTIGRAVITY_SESSION_ID using the original logic
export ANTIGRAVITY_SESSION_ID=$(ls ~/.gemini/antigravity-cli/conversations/*.db 2>/dev/null | head -1 | xargs strings 2>/dev/null | grep -A 1 "sessionID" | head -2 | grep -oP '\-?\d+')

if [ -z "$ANTIGRAVITY_SESSION_ID" ]; then
    echo "Error: ANTIGRAVITY_SESSION_ID is empty" >&2
    exit 1
fi

# Execute the main process
exec "$@"
