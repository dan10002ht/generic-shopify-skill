#!/bin/bash
# ============================================================
# PreToolUse Hook: TypeScript check before git commit
# ============================================================
# Trigger: Before Bash tool executes a git commit command
# Purpose: Run TypeScript compiler to catch type errors before
#          committing, preventing broken code from entering history
# Input:   JSON via stdin: { "tool_name": "Bash", "tool_input": { "command": "git commit ..." } }
# Output:  Error message to stderr if typecheck fails
# Exit:    0 = allow commit, 2 = block commit (type errors found)
# ============================================================

# Read tool invocation JSON from stdin
INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')

# Only intercept Bash tool calls
if [ "$TOOL_NAME" != "Bash" ]; then
  exit 0
fi

# Extract the command being run
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# Only check git commit commands (not git status, git diff, etc.)
case "$COMMAND" in
  "git commit"*|*"&& git commit"*|*"; git commit"*)
    ;; # This is a commit command, continue to typecheck
  *)
    exit 0 # Not a commit, allow
    ;;
esac

# Find project root (where package.json lives)
PROJECT_DIR="$CLAUDE_PROJECT_DIR"
if [ -z "$PROJECT_DIR" ]; then
  PROJECT_DIR="$(pwd)"
fi

# Check if typecheck script exists in package.json
if [ ! -f "$PROJECT_DIR/package.json" ]; then
  exit 0 # No package.json, skip check
fi

HAS_TYPECHECK=$(jq -r '.scripts.typecheck // empty' "$PROJECT_DIR/package.json" 2>/dev/null)
if [ -z "$HAS_TYPECHECK" ]; then
  exit 0 # No typecheck script defined, skip
fi

# Run TypeScript check
echo "Running TypeScript check before commit..." >&2
TYPECHECK_OUTPUT=$(cd "$PROJECT_DIR" && npm run typecheck 2>&1)
TYPECHECK_EXIT=$?

if [ $TYPECHECK_EXIT -ne 0 ]; then
  # TypeScript errors found — block the commit
  ERROR_COUNT=$(echo "$TYPECHECK_OUTPUT" | grep -c "error TS")
  echo "" >&2
  echo "══════════════════════════════════════════════════" >&2
  echo "  ❌ TypeScript check failed ($ERROR_COUNT errors)" >&2
  echo "══════════════════════════════════════════════════" >&2
  echo "" >&2
  # Show only error lines (not the full output) for readability
  echo "$TYPECHECK_OUTPUT" | grep "error TS" | head -20 >&2
  if [ "$ERROR_COUNT" -gt 20 ]; then
    echo "  ... and $((ERROR_COUNT - 20)) more errors" >&2
  fi
  echo "" >&2
  echo "Fix type errors before committing." >&2
  exit 2 # Block the commit
fi

# TypeScript check passed
echo "✅ TypeScript check passed" >&2
exit 0
