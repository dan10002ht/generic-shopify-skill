#!/bin/bash
# PostToolUse hook: Auto-format files after Edit/Write
# Chạy Prettier trên file vừa được sửa

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Skip nếu không có file path
if [ -z "$FILE_PATH" ] || [ "$FILE_PATH" = "null" ]; then
  exit 0
fi

# Chỉ format các file types được support
case "$FILE_PATH" in
  *.ts|*.tsx|*.js|*.jsx|*.json|*.css|*.md|*.html)
    # Check prettier tồn tại
    if command -v npx &> /dev/null && [ -f "$(dirname "$0")/../../package.json" ]; then
      npx prettier --write "$FILE_PATH" 2>/dev/null
    fi
    ;;
esac

exit 0
