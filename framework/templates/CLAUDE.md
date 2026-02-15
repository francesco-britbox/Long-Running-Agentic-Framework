# Project Agent Framework

This project uses the Long-Running Agentic Framework for multi-agent development with 100% architecture compliance.

## Architecture Files (READ AT SESSION START)

Every agent session MUST read these files before doing any work:

- `architecture/architecture-principles.json` — All architecture principles with verification steps
- `architecture/architecture-patterns.json` — Required file structure, module patterns, naming conventions
- `architecture/code-standards.json` — Formatting, linting, documentation, error handling standards

## Feature State

Features are tracked in the project database. Use the framework CLI to query:

```bash
framework feature list
framework feature get FEAT-XXX
framework feature update FEAT-XXX --status <status>
```

Fallback: `architecture/feature-requirements.json` (JSON export of DB state)

## Agent Roles

| Role | Prompt | Responsibility |
|------|--------|----------------|
| Team Lead | `agent-prompts/team-lead-prompt.md` | Coordinate pipeline, assign work, monitor progress |
| Dev Agent | `agent-prompts/dev-agent-prompt.md` | Implement one feature per session, full compliance |
| Code Reviewer | `agent-prompts/code-reviewer-prompt.md` | Verify 100% architecture compliance, approve/reject |
| QA Agent | `agent-prompts/qa-agent-prompt.md` | End-to-end testing, architecture spot-check, pass/fail |

## Pipeline

```
pending → in-dev → ready-for-review → approved → qa-testing → pr-open → complete
                  ↖ needs-revision ←↙         ↖ needs-revision ←↙
```

## OpenSpec Integration

If this project uses OpenSpec (`openspec/` directory), features may have an `openspec_reference` field pointing to a change folder. Agents should read the artifacts:

- `<openspec_reference>/proposal.md` — why this change exists
- `<openspec_reference>/specs/` — requirements and test scenarios
- `<openspec_reference>/design.md` — technical approach
- `<openspec_reference>/tasks.md` — implementation checklist

Import changes: `node .framework/bin/framework.js -p . openspec import <change-name>`

## Rules

- Agents read architecture files at session start — no exceptions
- One feature per dev session
- 100% compliance required for approval
- Only QA sets `passes: true` — orchestrator handles `status: complete` after PR/merge
- Per-feature instructions go in the task, not here
- Do not modify this file during agent sessions
