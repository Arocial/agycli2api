#!/bin/bash
# Source ANTIGRAVITY_VERSION
. /env.sh

if [ -z "$ANTIGRAVITY_VERSION" ]; then
    echo "Error: ANTIGRAVITY_VERSION is empty" >&2
    exit 1
fi

if ! ls -t ~/.gemini/antigravity-cli/conversations/*.db; then
    echo "No antigravity cli conversion found. creating one."
    agy -p hi
fi
# Extract ANTIGRAVITY_SESSION_ID using the original logic
export ANTIGRAVITY_SESSION_ID=$(ls -t ~/.gemini/antigravity-cli/conversations/*.db 2>/dev/null | head -1 | xargs strings 2>/dev/null | grep -A 1 "sessionID" | head -2 | grep -oP '\-?\d+')

if [ -z "$ANTIGRAVITY_SESSION_ID" ]; then
    echo "ANTIGRAVITY_SESSION_ID is empty. check your antigravity-cli status."
    exit 1
fi

# Execute the main process
exec "$@"
