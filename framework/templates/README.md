# Long-Running Agentic Framework

Multi-agent coding framework. Human creates specs, AI agent team builds autonomously with 100% architecture compliance. Supports any tech stack.

## Quick Start

### 1. Generate Architecture

Open Claude Code in this project folder:

```
claude
> Read CLAUDE.md, then help me generate architecture-principles.json,
  architecture-patterns.json, and code-standards.json for my project.
  My stack is [your language/framework].
```

This creates real architecture principles with verification steps that agents enforce during code review and QA.

### 2. Create Features

Manually:

```bash
node .framework/bin/framework.js -p . feature create -d "User login with OAuth"
node .framework/bin/framework.js -p . feature create -d "Dashboard page" --depends FEAT-001
```

Or from OpenSpec (if initialized):

```bash
node .framework/bin/framework.js -p . openspec import <change-name>
node .framework/bin/framework.js -p . openspec import --all
```

**Tip:** Set up an alias to save typing:

```bash
alias framework='node .framework/bin/framework.js -p .'
# Then: framework feature create -d "My feature"
```

### 3. Start Building

Open Claude Code in this project folder and tell it:

```
> Create an agent team. Read CLAUDE.md and agent-prompts/team-lead-prompt.md.
  Implement all pending features following the pipeline.
```

The team lead will spawn dev, code-reviewer, and QA agents automatically.

### Agent Teams (Pre-Configured)

Agent Teams is Claude Code's native multi-agent feature. It's **already enabled** by `init.sh` — the project's `.claude/settings.json` contains:

```json
{
  "env": { "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1" },
  "teammateMode": "auto"
}
```

When you open Claude Code in this project, it will automatically support agent teams. The team lead can spawn teammates (dev, reviewer, QA) that share a task list and communicate via peer messaging.

If Agent Teams doesn't activate, verify `.claude/settings.json` exists and contains the settings above.

### 4. Monitor Progress

```bash
node .framework/bin/framework.js -p . status          # Pipeline status in terminal
node .framework/bin/framework.js -p . guided          # Shows next step to take
node .framework/bin/framework.js -p . dashboard       # Kanban board at localhost:3333
```

## Pipeline

Each feature goes through this pipeline:

```
pending --> in-dev --> ready-for-review --> approved --> qa-testing --> pr-open --> complete
                     \                  /             \            /
                      <-- needs-revision               <-- needs-revision
```

| Stage | Agent | What happens |
|-------|-------|-------------|
| pending | Team Lead | Assigns to dev agent |
| in-dev | Dev Agent | Implements feature with architecture compliance |
| ready-for-review | Code Reviewer | Verifies 100% compliance, approves or rejects |
| approved | QA Agent | End-to-end testing + architecture spot-check |
| qa-testing | QA Agent | Sets `passes: true` on success |
| pr-open | Orchestrator | Creates feature branch and PR |
| complete | Orchestrator | After merge, sets complete |

If rejected at review or QA, the feature loops back to dev (max 3 retries, then escalated to human).

## Execution Modes

| Mode | Command | How it works |
|------|---------|-------------|
| **team** (default) | Start Claude Code, use Agent Teams | Native multi-agent with shared task list |
| **orchestrator** | `node .framework/bin/framework.js -p . autoplay` | Spawns individual `claude -p` sessions automatically |
| **guided** | `node .framework/bin/framework.js -p . guided` | Shows next step, human runs each agent manually |

Change mode:

```bash
node .framework/bin/framework.js -p . config set execution_mode orchestrator
```

## CLI Reference

All commands use `node .framework/bin/framework.js -p .` (or your alias).

### Features

```bash
framework feature list                                    # List all features
framework feature get FEAT-001                            # Feature details (JSON)
framework feature create -d "Description"                 # Create feature
framework feature create -d "Desc" --depends FEAT-001     # Create with dependency
framework feature update FEAT-001 --status in-dev         # Update status
framework feature update FEAT-001 --passes true           # Mark QA passed
framework feature export                                  # Export to JSON file
```

### Pipeline

```bash
framework status                    # Pipeline overview
framework guided                    # Next step instructions
framework autoplay                  # Run orchestrator mode
framework autoplay --auto-merge     # Auto-merge PRs (no human review)
```

### OpenSpec

```bash
framework openspec install              # Install/update OpenSpec CLI globally
framework openspec refresh              # Regenerate tool configs (after CLI update)
framework openspec status               # Version + active changes
framework openspec import <change>      # Import one change as features
framework openspec import --all         # Import all active changes
framework openspec archive FEAT-001     # Archive change when all its features are complete
```

### Architecture

```bash
framework arch import               # Import JSON files to DB
framework arch export               # Export DB to JSON files
```

### Config

```bash
framework config get execution_mode         # Read a setting
framework config set execution_mode team    # Write a setting
framework config set max_retries 5          # Max review/QA retries
framework config set safe_mode true         # Stop at PR (human merges)
framework config set auto_merge false       # Auto-merge PRs
framework config set openspec_auto_archive true   # Archive change when all its features complete
framework config set openspec_auto_import true    # Import new changes at autoplay start
```

### Dashboard

```bash
framework dashboard                 # Kanban board at localhost:3333
```

## OpenSpec Integration

This framework integrates with [OpenSpec](https://github.com/Fission-AI/OpenSpec) for spec-driven development. OpenSpec manages the "what to build" (specs, proposals, designs, tasks), and this framework manages the "how to build it" (agent pipeline, code review, QA).

### Workflow

```
1. Create specs with OpenSpec:  /opsx:new add-dark-mode  →  /opsx:ff
2. Import to pipeline:          framework openspec import add-dark-mode
3. Agents build autonomously:   framework autoplay (or agent teams)
4. After all features complete:  framework openspec archive FEAT-XXX
```

Each OpenSpec change (with its tasks.md) becomes one or more framework features. The features inherit:
- **Requirements** from the spec scenarios
- **Verification steps** from GIVEN/WHEN/THEN blocks
- **Context** from proposal.md and design.md (agents read these during implementation)

OpenSpec is optional — features can also be created manually.

### Setup

```bash
npm install -g @fission-ai/openspec@latest    # Install CLI
openspec init                                   # Initialize in project
framework openspec status                       # Verify
```

Or during `init.sh` — it will prompt to install and initialize.

## Project Structure

```
your-project/
  CLAUDE.md                           # Master instructions for all agents
  README.md                           # This file
  claude-progress.txt                 # Session history log
  openspec/                           # OpenSpec (optional)
    specs/                            # Source of truth specs
    changes/                          # Active changes (proposal, specs, design, tasks)
    config.yaml                       # OpenSpec config
  agent-prompts/
    team-lead-prompt.md               # Team lead instructions
    dev-agent-prompt.md               # Dev agent instructions
    code-reviewer-prompt.md           # Code reviewer instructions
    qa-agent-prompt.md                # QA agent instructions
  architecture/
    architecture-principles.json      # Architecture principles + verification steps
    architecture-patterns.json        # File structure, module patterns, naming
    code-standards.json               # Formatting, linting, error handling
    feature-requirements.json         # Feature state (JSON export of DB)
  scripts/
    openspec-to-feature.js            # Deprecated shim → framework openspec import
  .framework/                         # Framework internals (gitignored)
    bin/framework.js                  # CLI entry point
    lib/                              # Core modules
    dashboard/                        # Kanban board UI
    framework.db                      # SQLite database
  .claude/
    settings.json                     # Agent Teams enabled
```

## Safe Mode (Default)

By default, the pipeline stops at PR creation and waits for a human to review and merge. To enable auto-merge:

```bash
framework config set auto_merge true
# or run: framework autoplay --auto-merge
```
