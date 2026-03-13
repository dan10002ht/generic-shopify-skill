#!/bin/bash
# PostToolUse hook: Chạy ESLint check trên file vừa edit
# Chỉ report warnings, không block

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Skip nếu không có file path
if [ -z "$FILE_PATH" ] || [ "$FILE_PATH" = "null" ]; then
  exit 0
fi

# Chỉ lint TypeScript/JavaScript files
case "$FILE_PATH" in
  *.ts|*.tsx|*.js|*.jsx)
    ;;
  *)
    exit 0
    ;;
esac

# Check eslint tồn tại và có config
if command -v npx &> /dev/null && [ -f "$(dirname "$0")/../../package.json" ]; then
  LINT_OUTPUT=$(npx eslint --no-error-on-unmatched-pattern --format compact "$FILE_PATH" 2>/dev/null)
  LINT_EXIT=$?

  if [ $LINT_EXIT -ne 0 ] && [ -n "$LINT_OUTPUT" ]; then
    # Output lint errors as context cho Claude
    echo "{\"additionalContext\": \"ESLint issues found in $FILE_PATH:\\n$LINT_OUTPUT\"}"
    exit 0
  fi
fi

exit 0
