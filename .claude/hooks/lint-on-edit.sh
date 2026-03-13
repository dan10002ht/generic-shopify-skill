#!/bin/bash
# ============================================================
# PostToolUse Hook: Lint check after edits
# ============================================================
# Trigger: After Edit or Write tool completes successfully
# Purpose: Run ESLint on edited files and report issues as
#          additional context for Claude (non-blocking)
# Input:   JSON via stdin: { "tool_input": { "file_path": "..." } }
# Output:  JSON with additionalContext field if lint issues found
# Exit:    Always 0 (non-blocking — lint issues are informational)
# Note:    This does NOT block edits, only provides feedback
# ============================================================

# Extract the file path that was just edited/written
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Skip if no file path provided
if [ -z "$FILE_PATH" ] || [ "$FILE_PATH" = "null" ]; then
  exit 0
fi

# Only lint TypeScript/JavaScript files — skip CSS, JSON, etc.
case "$FILE_PATH" in
  *.ts|*.tsx|*.js|*.jsx)
    ;; # Continue to lint check
  *)
    exit 0
    ;;
esac

# Run ESLint and capture output
# --no-error-on-unmatched-pattern: don't fail if file doesn't match eslint config
# --format compact: single-line output, easier to parse
if command -v npx &> /dev/null && [ -f "$(dirname "$0")/../../package.json" ]; then
  LINT_OUTPUT=$(npx eslint --no-error-on-unmatched-pattern --format compact "$FILE_PATH" 2>/dev/null)
  LINT_EXIT=$?

  if [ $LINT_EXIT -ne 0 ] && [ -n "$LINT_OUTPUT" ]; then
    # Return lint issues as additional context for Claude
    # This JSON format is recognized by Claude Code and injected into the conversation
    echo "{\"additionalContext\": \"ESLint issues found in $FILE_PATH:\\n$LINT_OUTPUT\"}"
    exit 0
  fi
fi

exit 0
