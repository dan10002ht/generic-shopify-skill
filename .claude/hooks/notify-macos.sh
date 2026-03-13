#!/bin/bash
# Notification hook: macOS notification khi Claude cần attention
# Hữu ích khi Claude chạy task dài và cần user input

INPUT=$(cat)
MESSAGE=$(echo "$INPUT" | jq -r '.message // "Claude Code needs your attention"')

# Truncate message nếu quá dài
if [ ${#MESSAGE} -gt 200 ]; then
  MESSAGE="${MESSAGE:0:197}..."
fi

osascript -e "display notification \"$MESSAGE\" with title \"Claude Code\" sound name \"Glass\"" 2>/dev/null

exit 0
