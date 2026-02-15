#!/bin/bash

# Long-Running Agentic Framework — Bootstrap
# Usage: ./init.sh [target-project-folder]
#
# Creates the full framework structure inside a target project.
# Non-invasive: checks prerequisites and prompts, never forces installs.

set -e

FRAMEWORK_DIR="$(cd "$(dirname "$0")" && pwd)"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo "${BLUE}=========================================${NC}"
echo "${BLUE}  Long-Running Agentic Framework v1.0   ${NC}"
echo "${BLUE}=========================================${NC}"
echo ""

# ─── Target folder ───

if [ -n "$1" ]; then
  TARGET="$1"
else
  read -p "Enter target project folder: " TARGET
fi

TARGET="$(cd "$(dirname "$TARGET")" 2>/dev/null && pwd)/$(basename "$TARGET")" 2>/dev/null || TARGET="$(pwd)/$TARGET"

if [ ! -d "$TARGET" ]; then
  echo "${YELLOW}Directory does not exist. Create it? (y/n)${NC}"
  read -p "> " CREATE
  if [ "$CREATE" = "y" ] || [ "$CREATE" = "Y" ]; then
    mkdir -p "$TARGET"
    echo "${GREEN}Created $TARGET${NC}"
  else
    echo "${RED}Aborted.${NC}"
    exit 1
  fi
fi

echo ""
echo "Target: ${GREEN}$TARGET${NC}"
echo ""

# ─── Prerequisites Check ───

echo "${BLUE}Checking prerequisites...${NC}"
echo ""

MISSING=0

# Node.js
if command -v node &>/dev/null; then
  NODE_VERSION=$(node --version)
  NODE_MAJOR=$(echo "$NODE_VERSION" | sed 's/v//' | cut -d. -f1)
  if [ "$NODE_MAJOR" -ge 18 ]; then
    echo "  ${GREEN}[OK]${NC} Node.js $NODE_VERSION"
  else
    echo "  ${RED}[!!]${NC} Node.js $NODE_VERSION (need >= 18)"
    echo "       Install: https://nodejs.org/"
    MISSING=1
  fi
else
  echo "  ${RED}[!!]${NC} Node.js not found"
  echo "       Install: https://nodejs.org/"
  MISSING=1
fi

# Git
if command -v git &>/dev/null; then
  echo "  ${GREEN}[OK]${NC} Git $(git --version | cut -d' ' -f3)"
else
  echo "  ${RED}[!!]${NC} Git not found"
  echo "       Install: https://git-scm.com/"
  MISSING=1
fi

# Claude CLI
if command -v claude &>/dev/null; then
  echo "  ${GREEN}[OK]${NC} Claude CLI found"
else
  echo "  ${RED}[!!]${NC} Claude CLI not found"
  echo "       Install: npm install -g @anthropic-ai/claude-code"
  MISSING=1
fi

# tmux (optional)
if command -v tmux &>/dev/null; then
  echo "  ${GREEN}[OK]${NC} tmux $(tmux -V | cut -d' ' -f2) (split-pane agent teams)"
else
  echo "  ${YELLOW}[--]${NC} tmux not found (optional, recommended for agent teams)"
  echo "       Install: brew install tmux (macOS) / apt install tmux (Linux)"
fi

# OpenSpec (optional)
OPENSPEC_AVAILABLE=0
if command -v openspec &>/dev/null; then
  OPENSPEC_VERSION=$(openspec --version 2>/dev/null || echo "unknown")
  echo "  ${GREEN}[OK]${NC} OpenSpec ${OPENSPEC_VERSION} (spec-driven development)"
  OPENSPEC_AVAILABLE=1
else
  echo "  ${YELLOW}[--]${NC} OpenSpec not found (optional, recommended for spec-driven development)"
  echo "       Install: npm install -g @fission-ai/openspec@latest"
  echo -n "       Install now? (y/n) "
  read INSTALL_OPENSPEC
  if [ "$INSTALL_OPENSPEC" = "y" ] || [ "$INSTALL_OPENSPEC" = "Y" ]; then
    npm install -g @fission-ai/openspec@latest 2>&1 | tail -3
    if command -v openspec &>/dev/null; then
      echo "  ${GREEN}[OK]${NC} OpenSpec installed"
      OPENSPEC_AVAILABLE=1
    else
      echo "  ${YELLOW}[!!]${NC} Install failed. You can install later: npm install -g @fission-ai/openspec@latest"
    fi
  fi
fi

echo ""

if [ "$MISSING" -eq 1 ]; then
  echo "${RED}Missing required prerequisites. Install them and re-run.${NC}"
  exit 1
fi

echo "${GREEN}All required prerequisites met.${NC}"
echo ""

# ─── Initialize Git if needed ───

if [ ! -d "$TARGET/.git" ]; then
  echo "${YELLOW}No git repo detected. Initialize? (y/n)${NC}"
  read -p "> " INIT_GIT
  if [ "$INIT_GIT" = "y" ] || [ "$INIT_GIT" = "Y" ]; then
    git -C "$TARGET" init
    echo "${GREEN}Git initialized.${NC}"
  fi
  echo ""
fi

# ─── Create directory structure ───

echo "${BLUE}Creating framework structure...${NC}"
echo ""

mkdir -p "$TARGET/.claude"
mkdir -p "$TARGET/.framework"
mkdir -p "$TARGET/architecture"
mkdir -p "$TARGET/agent-prompts"
mkdir -p "$TARGET/scripts"

# ─── Copy templates ───

# .claude/settings.json (enables Agent Teams)
if [ ! -f "$TARGET/.claude/settings.json" ]; then
  cp "$FRAMEWORK_DIR/templates/settings.json" "$TARGET/.claude/settings.json"
  echo "  ${GREEN}+${NC} .claude/settings.json (Agent Teams enabled)"
else
  echo "  ${YELLOW}~${NC} .claude/settings.json (exists, skipped)"
  # Ensure Agent Teams is enabled even in existing settings
  if ! grep -q "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS" "$TARGET/.claude/settings.json" 2>/dev/null; then
    echo "  ${YELLOW}!${NC} WARNING: Agent Teams may not be enabled in existing settings.json"
    echo "       Add to .claude/settings.json: \"env\": {\"CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS\": \"1\"}"
  fi
fi

# README.md
if [ ! -f "$TARGET/README.md" ]; then
  cp "$FRAMEWORK_DIR/templates/README.md" "$TARGET/README.md"
  echo "  ${GREEN}+${NC} README.md"
else
  echo "  ${YELLOW}~${NC} README.md (exists, skipped)"
fi

# CLAUDE.md
if [ ! -f "$TARGET/CLAUDE.md" ]; then
  cp "$FRAMEWORK_DIR/templates/CLAUDE.md" "$TARGET/CLAUDE.md"
  echo "  ${GREEN}+${NC} CLAUDE.md"
else
  echo "  ${YELLOW}~${NC} CLAUDE.md (exists, skipped)"
fi

# Agent prompts
for PROMPT in team-lead-prompt.md dev-agent-prompt.md code-reviewer-prompt.md qa-agent-prompt.md; do
  if [ -f "$FRAMEWORK_DIR/templates/agent-prompts/$PROMPT" ]; then
    cp "$FRAMEWORK_DIR/templates/agent-prompts/$PROMPT" "$TARGET/agent-prompts/$PROMPT"
    echo "  ${GREEN}+${NC} agent-prompts/$PROMPT"
  fi
done

# Architecture templates (empty/starter files)
for ARCH in architecture-principles.json architecture-patterns.json code-standards.json; do
  if [ ! -f "$TARGET/architecture/$ARCH" ]; then
    cp "$FRAMEWORK_DIR/templates/architecture/$ARCH" "$TARGET/architecture/$ARCH"
    echo "  ${GREEN}+${NC} architecture/$ARCH"
  else
    echo "  ${YELLOW}~${NC} architecture/$ARCH (exists, skipped)"
  fi
done

# Feature requirements (empty starter)
if [ ! -f "$TARGET/architecture/feature-requirements.json" ]; then
  echo '{"features":[]}' > "$TARGET/architecture/feature-requirements.json"
  echo "  ${GREEN}+${NC} architecture/feature-requirements.json"
fi

# Progress file
if [ ! -f "$TARGET/claude-progress.txt" ]; then
  echo "# Project Progress Log" > "$TARGET/claude-progress.txt"
  echo "" >> "$TARGET/claude-progress.txt"
  echo "Framework initialized: $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> "$TARGET/claude-progress.txt"
  echo "  ${GREEN}+${NC} claude-progress.txt"
fi

# Scripts
if [ -f "$FRAMEWORK_DIR/scripts/openspec-to-feature.js" ]; then
  cp "$FRAMEWORK_DIR/scripts/openspec-to-feature.js" "$TARGET/scripts/openspec-to-feature.js"
  echo "  ${GREEN}+${NC} scripts/openspec-to-feature.js"
fi

# .gitignore entries
GITIGNORE="$TARGET/.gitignore"
ENTRIES=(".framework/" "*.db" ".framework/framework.db" ".framework/node_modules/")
if [ -f "$GITIGNORE" ]; then
  for ENTRY in "${ENTRIES[@]}"; do
    if ! grep -qxF "$ENTRY" "$GITIGNORE" 2>/dev/null; then
      echo "$ENTRY" >> "$GITIGNORE"
    fi
  done
  echo "  ${GREEN}+${NC} .gitignore (updated with framework entries)"
else
  printf '%s\n' "${ENTRIES[@]}" > "$GITIGNORE"
  echo "  ${GREEN}+${NC} .gitignore (created)"
fi

echo ""

# ─── Install framework dependencies ───

echo "${BLUE}Installing framework dependencies...${NC}"
echo ""

# Copy package files needed for the CLI
if [ ! -f "$TARGET/.framework/package.json" ]; then
  cp "$FRAMEWORK_DIR/package.json" "$TARGET/.framework/package.json"
  cp "$FRAMEWORK_DIR/schema.sql" "$TARGET/.framework/schema.sql"
  cp -r "$FRAMEWORK_DIR/lib" "$TARGET/.framework/lib"
  cp -r "$FRAMEWORK_DIR/bin" "$TARGET/.framework/bin"
  cp -r "$FRAMEWORK_DIR/dashboard" "$TARGET/.framework/dashboard"

  cd "$TARGET/.framework" && npm install --production 2>&1 | tail -1
  echo "  ${GREEN}[OK]${NC} Dependencies installed"
else
  echo "  ${YELLOW}~${NC} Framework already installed"
fi

# Create convenience symlink/alias
echo ""
echo "${BLUE}Framework CLI available as:${NC}"
echo "  node $TARGET/.framework/bin/framework.js"
echo ""
echo "  Add to your shell for convenience:"
echo "  alias framework='node $TARGET/.framework/bin/framework.js -p $TARGET'"
echo ""

# ─── Initialize database ───

echo "${BLUE}Initializing database...${NC}"
cd "$TARGET" && node .framework/bin/framework.js -p "$TARGET" config get execution_mode 2>/dev/null && echo "  ${GREEN}[OK]${NC} Database ready" || echo "  ${YELLOW}Database will initialize on first use${NC}"

# Import architecture files into DB
echo "${BLUE}Importing architecture into DB...${NC}"
cd "$TARGET" && node .framework/bin/framework.js -p "$TARGET" arch import 2>/dev/null || echo "  ${YELLOW}Architecture import skipped (will run on first use)${NC}"
echo ""

# ─── Initialize OpenSpec (if available and user confirms) ───

OPENSPEC_INITIALIZED=0
if [ "$OPENSPEC_AVAILABLE" -eq 1 ] && [ ! -d "$TARGET/openspec" ]; then
  echo "${YELLOW}Initialize OpenSpec in this project? (y/n)${NC}"
  read -p "> " INIT_OPENSPEC
  if [ "$INIT_OPENSPEC" = "y" ] || [ "$INIT_OPENSPEC" = "Y" ]; then
    echo "${BLUE}Initializing OpenSpec...${NC}"
    cd "$TARGET" && openspec init --tools claude --force 2>&1 | tail -5
    if [ -d "$TARGET/openspec" ]; then
      echo "  ${GREEN}[OK]${NC} OpenSpec initialized"
      OPENSPEC_INITIALIZED=1
    else
      echo "  ${YELLOW}OpenSpec init may not have completed. Run 'openspec init' manually.${NC}"
    fi
  fi
elif [ "$OPENSPEC_AVAILABLE" -eq 1 ] && [ -d "$TARGET/openspec" ]; then
  echo "  ${YELLOW}~${NC} OpenSpec already initialized (openspec/ exists)"
  OPENSPEC_INITIALIZED=1
fi
echo ""

# ─── Done ───

echo "${GREEN}=========================================${NC}"
echo "${GREEN}  Framework initialized successfully!    ${NC}"
echo "${GREEN}=========================================${NC}"
echo ""
echo "What's configured:"
echo ""
echo "  ${GREEN}[OK]${NC} Agent Teams enabled (.claude/settings.json)"
echo "       Claude Code will use multi-agent mode when you start it in this project."
if [ "$OPENSPEC_INITIALIZED" -eq 1 ]; then
  echo "  ${GREEN}[OK]${NC} OpenSpec initialized (openspec/ directory)"
  echo "       Create changes with: openspec or /opsx:new in Claude Code"
  echo "       Import to framework: node .framework/bin/framework.js -p . openspec import <change>"
elif [ "$OPENSPEC_AVAILABLE" -eq 1 ]; then
  echo "  ${YELLOW}[--]${NC} OpenSpec available but not initialized in this project"
  echo "       Run: cd $TARGET && openspec init"
else
  echo "  ${YELLOW}[--]${NC} OpenSpec not installed"
  echo "       Install later: npm install -g @fission-ai/openspec@latest"
  echo "       Then init: cd $TARGET && openspec init"
fi
echo ""
echo "Next steps:"
echo ""
echo "  1. ${BLUE}Generate architecture${NC} (interactive):"
echo "     cd $TARGET"
echo "     claude"
echo "     > Read CLAUDE.md, then help me generate architecture-principles.json,"
echo "       architecture-patterns.json, and code-standards.json for my project."
echo "       My stack is [your language/framework]."
echo ""
echo "  2. ${BLUE}Create features${NC} — with OpenSpec or manually:"
if [ "$OPENSPEC_INITIALIZED" -eq 1 ]; then
  echo "     ${YELLOW}OpenSpec:${NC}  openspec  (or /opsx:new in Claude Code)"
  echo "               then: node .framework/bin/framework.js -p . openspec import <change-name>"
  echo "               or:   node .framework/bin/framework.js -p . openspec import --all"
elif [ "$OPENSPEC_AVAILABLE" -eq 1 ]; then
  echo "     ${YELLOW}OpenSpec:${NC}  cd $TARGET && openspec init"
  echo "               then: node .framework/bin/framework.js -p . openspec import <change>"
else
  echo "     ${YELLOW}OpenSpec:${NC}  npm install -g @fission-ai/openspec@latest && openspec init"
  echo "               then: node .framework/bin/framework.js -p . openspec import <change>"
fi
echo "     ${YELLOW}Manual:${NC}   node .framework/bin/framework.js -p . feature create -d \"My feature\""
echo ""
echo "  3. ${BLUE}Start building${NC}:"
echo "     claude"
echo "     > Create an agent team. Read CLAUDE.md and agent-prompts/."
echo "       Implement all pending features following the pipeline."
echo ""
echo "  4. ${BLUE}Monitor progress${NC}:"
echo "     node .framework/bin/framework.js status"
echo "     node .framework/bin/framework.js dashboard"
echo ""
