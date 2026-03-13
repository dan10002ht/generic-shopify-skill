#!/bin/bash
# ============================================================
# PostToolUse Hook: Auto-format files after edits
# ============================================================
# Trigger: After Edit or Write tool completes successfully
# Purpose: Run Prettier on the edited file to maintain consistent
#          code style without Claude needing to worry about formatting
# Input:   JSON via stdin: { "tool_input": { "file_path": "..." } }
# Output:  None (silent formatting)
# Exit:    Always 0 (non-blocking — formatting is best-effort)
# ============================================================

# Extract the file path that was just edited/written
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Skip if no file path provided (e.g., tool had no file target)
if [ -z "$FILE_PATH" ] || [ "$FILE_PATH" = "null" ]; then
  exit 0
fi

# Only format supported file types — skip binaries, images, etc.
case "$FILE_PATH" in
  *.ts|*.tsx|*.js|*.jsx|*.json|*.css|*.md|*.html)
    # Run Prettier if available in the project
    # Uses npx to find project-local Prettier installation
    # Silences stderr to avoid noise from missing config
    if command -v npx &> /dev/null && [ -f "$(dirname "$0")/../../package.json" ]; then
      npx prettier --write "$FILE_PATH" 2>/dev/null
    fi
    ;;
esac

exit 0
