#!/bin/bash
# ============================================================
# Notification Hook: macOS desktop notification
# ============================================================
# Trigger: When Claude Code sends a notification (e.g., task complete,
#          needs user input, long-running operation finished)
# Purpose: Alert the user via macOS notification center with sound
#          so they can step away during long tasks
# Input:   JSON via stdin: { "message": "..." }
# Output:  None (triggers OS notification)
# Exit:    Always 0 (non-blocking)
# Requires: macOS with osascript (Apple Script)
# ============================================================

# Extract notification message from JSON payload
INPUT=$(cat)
MESSAGE=$(echo "$INPUT" | jq -r '.message // "Claude Code needs your attention"')

# Truncate long messages to avoid notification overflow (macOS limit)
if [ ${#MESSAGE} -gt 200 ]; then
  MESSAGE="${MESSAGE:0:197}..."
fi

# Trigger macOS notification with "Glass" sound
# osascript calls Apple's Notification Center API
osascript -e "display notification \"$MESSAGE\" with title \"Claude Code\" sound name \"Glass\"" 2>/dev/null

exit 0
