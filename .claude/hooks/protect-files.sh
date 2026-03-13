#!/bin/bash
# PreToolUse hook: Block edits to protected files
# Ngăn Claude sửa các files nhạy cảm

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.command // empty')

# Chỉ check cho Edit, Write, và Bash commands liên quan đến file
case "$TOOL_NAME" in
  Edit|Write)
    ;;
  Bash)
    # Check nếu bash command chứa protected file patterns
    COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')
    case "$COMMAND" in
      *"rm "*.env*|*"rm "*.git/*|*"> .env"*|*"cat > .env"*)
        echo "Blocked: Command targets protected file" >&2
        exit 2
        ;;
    esac
    exit 0
    ;;
  *)
    exit 0
    ;;
esac

# Protected file patterns
PROTECTED=(
  ".env"
  ".env.local"
  ".env.production"
  "package-lock.json"
  "pnpm-lock.yaml"
  "prisma/migrations"
)

for pattern in "${PROTECTED[@]}"; do
  if [[ "$FILE_PATH" == *"$pattern"* ]]; then
    echo "Blocked: '$FILE_PATH' is a protected file ($pattern). Ask user for explicit permission." >&2
    exit 2
  fi
done

exit 0
