#!/bin/bash
# ============================================================
# PreToolUse Hook: Protect sensitive files from edits
# ============================================================
# Trigger: Before Edit or Write tool executes
# Purpose: Block Claude from modifying sensitive files like .env,
#          lock files, and migration files to prevent accidents
# Input:   JSON via stdin: { "tool_name": "Edit", "tool_input": { "file_path": "..." } }
# Output:  Error message to stderr if blocked
# Exit:    0 = allow, 2 = block the tool call
# ============================================================

# Read the full tool invocation JSON from stdin
INPUT=$(cat)

# Extract tool name and target file path from the JSON payload
# For Edit/Write: file_path is in tool_input.file_path
# For Bash: the command string is in tool_input.command
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.command // empty')

# Route based on tool type — only check Edit, Write, and dangerous Bash commands
case "$TOOL_NAME" in
  Edit|Write)
    ;; # Continue to file path check below
  Bash)
    # Check if bash command targets protected files directly
    COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')
    case "$COMMAND" in
      *"rm "*.env*|*"rm "*.git/*|*"> .env"*|*"cat > .env"*)
        echo "Blocked: Command targets protected file" >&2
        exit 2
        ;;
    esac
    exit 0 # Allow other bash commands
    ;;
  *)
    exit 0 # Not a file-modifying tool, allow
    ;;
esac

# List of protected file patterns
# These files should never be modified by Claude without explicit user permission:
# - .env files: contain secrets, API keys
# - Lock files: should only change via package manager
# - Migration files: immutable once created (Prisma convention)
PROTECTED=(
  ".env"
  ".env.local"
  ".env.production"
  "package-lock.json"
  "pnpm-lock.yaml"
  "prisma/migrations"
)

# Check if the target file matches any protected pattern
for pattern in "${PROTECTED[@]}"; do
  if [[ "$FILE_PATH" == *"$pattern"* ]]; then
    echo "Blocked: '$FILE_PATH' is a protected file ($pattern). Ask user for explicit permission." >&2
    exit 2 # Exit code 2 = block the tool call
  fi
done

exit 0 # File is not protected, allow the edit
