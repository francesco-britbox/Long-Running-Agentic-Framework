# Complete Workflow with OpenSpec Integration

**End-to-end process from idea to compliant code**

**This is USAGE documentation** - How to USE the framework once built, not how to build it.

---

## Overview

Complete pipeline with time estimates:

```
Idea → OpenSpec Spec → Architecture Mapping → Dev → Review → QA → Archive
       (15-30min)         (10-15min)        (1-2hr)  (30-45min) (30-60min) (5min)
```

**Total per feature:** 3-5 hours with full quality guarantee

**Quality output:** Well-specified AND architecture-compliant code with full traceability

---

## Complete Documentation Set

This workflow references:
- `openspec-integration-guide.md` - How to set up (one-time)
- `agent-prompts/` - Agent system prompts
- `architecture/` - Your architecture files
- `openspec/specs/` - Your OpenSpec specifications

---

## Phase 1: Specification (OpenSpec)

**Who:** Product Owner, Team Lead, Developer, or AI
**Time:** 15-30 minutes
**Output:** Structured spec with proposal, requirements, design, tasks

### Create New Spec

In your AI assistant:
```
/opsx:new user-authentication
```

### Generate Artifacts

```
/opsx:ff
```

Creates:
```
openspec/specs/user-authentication/
├── proposal.md    - Business justification ("Why?")
├── spec.md        - Requirements & scenarios ("What?")
├── design.md      - Design decisions ("How?")
└── tasks.md       - Implementation steps
```

### Review & Refine

**Check spec.md structure:**
```markdown
## Scenarios
**Given** user with valid credentials
**When** they submit login
**Then** they are authenticated

## Acceptance Criteria
- [ ] Login with valid credentials works
- [ ] Invalid credentials show error
```

Refine until clear and complete.

### Commit

```bash
git add openspec/specs/user-authentication/
git commit -m "spec: user authentication"
```

---

## Phase 2: Architecture Mapping

**Who:** Tech Lead or Team Lead Agent
**Time:** 10-15 minutes
**Output:** feature-requirements.json entry with architecture mapping

### Run Bridge

```bash
node scripts/openspec-to-feature.js user-authentication
```

### Review Generated Feature

Check `architecture/feature-requirements.json`:
```json
{
  "id": "FEAT-003",
  "openspec_reference": "openspec/specs/user-authentication/",
  "architecture_compliance": ["SOLID-DIP", "DRY-001", "ERROR-001"]
}
```

### Adjust & Commit

Add missing principles, refine verification steps, commit.

---

## Phase 3: Implementation (Dev Agent)

**Who:** Dev Agent
**Time:** 1-2 hours
**Reference:** `agent-prompts/dev-agent-prompt.md`

### Agent Reads

```bash
cat openspec/specs/user-authentication/spec.md      # WHAT
cat architecture/architecture-principles.json       # HOW
```

### Agent Implements

Satisfies BOTH OpenSpec requirements AND architecture principles.

### Agent Commits

```bash
git commit -m "feat(auth): user authentication [FEAT-003]

OpenSpec: openspec/specs/user-authentication/
- ✅ OAuth2 flow
- ✅ Token storage

Architecture:
- ✅ SOLID-DIP: IAuthService interface
- ✅ DRY-001: HTTPClient reused"
```

---

## Phase 4: Code Review (Reviewer Agent)

**Who:** Code Reviewer Agent
**Time:** 30-45 minutes
**Reference:** `agent-prompts/code-reviewer-prompt.md`

### Two-Layer Verification

**Layer 1:** OpenSpec compliance (functional)
**Layer 2:** Architecture compliance (structural)

### Decision

```bash
git notes add -m "Code review: APPROVED
OpenSpec: ✅ All requirements met
Architecture: ✅ All principles verified"
```

---

## Phase 5: QA Testing (QA Agent)

**Who:** QA Agent
**Time:** 30-60 minutes
**Reference:** `agent-prompts/qa-agent-prompt.md`

### Test Scenarios

From OpenSpec spec.md Given/When/Then scenarios.

### Validate Architecture

Spot-check code reviewer's approval.

### Mark Complete

```json
{
  "passes": true
}
```

---

## Phase 6: Archive

```bash
/opsx:archive user-authentication
```

Updates specs, preserves git history.

---

## Summary

| Phase | Duration | Quality Gate |
|-------|----------|--------------|
| Spec | 15-30min | Clear requirements |
| Map | 10-15min | Architecture aligned |
| Dev | 1-2hr | Code complete |
| Review | 30-45min | Both layers verified |
| QA | 30-60min | End-to-end tested |
| Archive | 5min | Documented |

**Result:** Idea → Compliant Code in 3-5 hours with full traceability

---

**See `openspec-integration-guide.md` for detailed examples and troubleshooting.**
