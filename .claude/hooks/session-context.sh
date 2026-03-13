#!/bin/bash
# SessionStart hook: Inject dynamic context khi session bắt đầu
# Giúp Claude hiểu trạng thái hiện tại của project

CWD=$(echo "$(cat)" | jq -r '.cwd // empty')
if [ -z "$CWD" ]; then
  CWD="$(pwd)"
fi

cd "$CWD" 2>/dev/null || exit 0

CONTEXT=""

# Git branch hiện tại
if git rev-parse --git-dir &>/dev/null; then
  BRANCH=$(git branch --show-current 2>/dev/null)
  UNCOMMITTED=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
  RECENT_COMMITS=$(git log --oneline -3 2>/dev/null)

  CONTEXT="[Project State]
Branch: $BRANCH
Uncommitted changes: $UNCOMMITTED files"

  if [ -n "$RECENT_COMMITS" ]; then
    CONTEXT="$CONTEXT
Recent commits:
$RECENT_COMMITS"
  fi
fi

# Node.js project info
if [ -f "package.json" ]; then
  APP_NAME=$(jq -r '.name // "unknown"' package.json 2>/dev/null)
  CONTEXT="$CONTEXT
App: $APP_NAME"
fi

# Prisma migration status
if [ -d "prisma" ]; then
  MIGRATION_COUNT=$(ls prisma/migrations 2>/dev/null | wc -l | tr -d ' ')
  CONTEXT="$CONTEXT
Prisma migrations: $MIGRATION_COUNT"
fi

# Output context (sẽ được inject vào conversation)
if [ -n "$CONTEXT" ]; then
  echo "$CONTEXT"
fi

exit 0
