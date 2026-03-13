#!/bin/bash
# ============================================================
# SessionStart Hook: Inject project context at session start
# ============================================================
# Trigger: Runs once when a new Claude Code session starts
# Purpose: Provide Claude with current project state (git, deps, DB)
#          so it can make informed decisions without extra queries
# Input:   JSON via stdin with { "cwd": "/path/to/project" }
# Output:  Plain text context injected into conversation
# Exit:    Always 0 (non-blocking — context is informational)
# ============================================================

# Parse working directory from stdin JSON
# Claude Code passes session info as JSON; extract cwd field
CWD=$(echo "$(cat)" | jq -r '.cwd // empty')
if [ -z "$CWD" ]; then
  CWD="$(pwd)"
fi

cd "$CWD" 2>/dev/null || exit 0

CONTEXT=""

# --- Git State ---
# Collect branch, uncommitted changes, and recent history
# Helps Claude understand what's being worked on
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

# --- Node.js Project Info ---
# Extract app name from package.json for identification
if [ -f "package.json" ]; then
  APP_NAME=$(jq -r '.name // "unknown"' package.json 2>/dev/null)
  CONTEXT="$CONTEXT
App: $APP_NAME"
fi

# --- Prisma Migration Status ---
# Count migrations to indicate DB schema maturity
if [ -d "prisma" ]; then
  MIGRATION_COUNT=$(ls prisma/migrations 2>/dev/null | wc -l | tr -d ' ')
  CONTEXT="$CONTEXT
Prisma migrations: $MIGRATION_COUNT"
fi

# Output context — will be injected into Claude's conversation
if [ -n "$CONTEXT" ]; then
  echo "$CONTEXT"
fi

exit 0
