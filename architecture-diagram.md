# Framework Architecture Diagram

**Visual reference for understanding how all components work together**

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     LONG-RUNNING AGENTIC FRAMEWORK                       │
│                                                                           │
│  Goal: 100% Architecture Compliance + Efficient Token Management         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                         PERSISTENT ARTIFACTS                              │
│                    (Shared by all agents, all sessions)                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  architecture/                                                            │
│  ├── architecture-principles.json    ← DRY, SOLID, DI rules              │
│  │   • verification_steps per rule                                       │
│  │   • checked_by (agent assignments)                                    │
│  │   • enforcement: "mandatory"                                          │
│  │                                                                        │
│  ├── architecture-patterns.json      ← Code structure patterns           │
│  │   • File organization                                                 │
│  │   • Naming conventions                                                │
│  │   • Component templates                                               │
│  │                                                                        │
│  ├── code-standards.json             ← Language-specific rules           │
│  │   • Style guide                                                       │
│  │   • Error handling patterns                                           │
│  │   • Testing requirements                                              │
│  │                                                                        │
│  └── feature-requirements.json       ← Feature tracking                  │
│      • Feature specs                                                     │
│      • architecture_compliance mapping                                   │
│      • assigned_to, reviewed_by, tested_by                               │
│      • passes: true/false                                                │
│                                                                           │
│  claude-progress.txt                 ← Session history                   │
│  • What happened each session                                            │
│  • Current project status                                                │
│  • Blockers and next steps                                               │
│                                                                           │
│  .git/                               ← Coordination mechanism             │
│  • Commits with compliance proof                                         │
│  • Git notes for reviews                                                 │
│  • Tags for milestones                                                   │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Agent Ecosystem

```
┌───────────────────────────────────────────────────────────────────────┐
│                          MULTI-AGENT TEAM                              │
├───────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────┐                                                   │
│  │  TEAM LEAD      │  Role: Project orchestration                      │
│  │  AGENT          │  • Creates feature-requirements.json              │
│  └────────┬────────┘  • Assigns work to agents                         │
│           │           • Reviews overall progress                        │
│           │           • Updates claude-progress.txt                     │
│           │                                                             │
│           ├─────────────────┬─────────────────┬────────────────┐       │
│           ▼                 ▼                 ▼                ▼       │
│  ┌────────────────┐ ┌──────────────┐ ┌──────────────┐ ┌─────────────┐│
│  │  DEV AGENT     │ │ CODE REVIEWER│ │  QA AGENT    │ │ UNIT TEST   ││
│  │                │ │  AGENT       │ │              │ │ WRITER      ││
│  ├────────────────┤ ├──────────────┤ ├──────────────┤ ├─────────────┤│
│  │ • Reads arch   │ │ • Reads arch │ │ • Reads feat │ │ • Reads arch││
│  │   principles   │ │   principles │ │   requirements│ │   principles││
│  │ • Implements   │ │ • Executes   │ │ • Runs e2e   │ │ • Creates   ││
│  │   ONE feature  │ │   verify     │ │   tests      │ │   mocks per ││
│  │ • Applies DRY, │ │   steps      │ │ • Validates  │ │   DIP       ││
│  │   SOLID, DI    │ │ • Approves/  │ │   arch       │ │ • Ensures   ││
│  │ • Commits with │ │   Rejects    │ │   compliance │ │   coverage  ││
│  │   compliance   │ │ • Adds git   │ │ • Marks      │ │             ││
│  │   notes        │ │   notes      │ │   passes:true│ │             ││
│  └────────────────┘ └──────────────┘ └──────────────┘ └─────────────┘│
│                                                                         │
│  ┌────────────────┐ ┌──────────────┐ ┌──────────────┐                 │
│  │  DOC WRITER    │ │ COMMIT AGENT │ │ ARCHITECT    │                 │
│  │  AGENT         │ │              │ │ AGENT        │                 │
│  ├────────────────┤ ├──────────────┤ ├──────────────┤                 │
│  │ • Documents    │ │ • Reviews    │ │ • Validates  │                 │
│  │   completed    │ │   all changes│ │   patterns   │                 │
│  │   features     │ │ • Ensures    │ │ • Updates    │                 │
│  │ • Updates API  │ │   commit msg │ │   architecture│                │
│  │   docs         │ │   standards  │ │   docs       │                 │
│  │ • Creates arch │ │ • Creates    │ │              │                 │
│  │   diagrams     │ │   git tags   │ │              │                 │
│  └────────────────┘ └──────────────┘ └──────────────┘                 │
│                                                                         │
└───────────────────────────────────────────────────────────────────────┘
```

---

## Session Initialization Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│              EVERY AGENT, EVERY SESSION STARTS THE SAME WAY              │
└─────────────────────────────────────────────────────────────────────────┘

    Agent Session Begins
           │
           ▼
    ┌──────────────────┐
    │  1. CONTEXT      │
    │     LOADING      │  Run: pwd, git log, read claude-progress.txt
    └────────┬─────────┘
             │           Token cost: ~500 tokens
             ▼
    ┌──────────────────┐
    │  2. ARCHITECTURE │
    │     LOADING      │  Read: architecture-principles.json
    └────────┬─────────┘        architecture-patterns.json
             │                  code-standards.json
             ▼
                         Token cost: ~2000 tokens
    ┌──────────────────┐
    │  3. FEATURE      │
    │     CONTEXT      │  Read: feature-requirements.json
    └────────┬─────────┘  Identify: assigned feature
             │
             ▼           Token cost: ~500 tokens
    ┌──────────────────┐
    │  4. STATE        │
    │     VERIFICATION │  Run: tests, check builds
    └────────┬─────────┘  Verify: no blockers
             │
             ▼
    ┌──────────────────┐
    │  5. WORK         │
    │     SELECTION    │  Select: ONE incomplete feature
    └────────┬─────────┘  Begin: incremental work
             │
             ▼
    ┌──────────────────┐
    │  6. EXECUTION    │  Apply architecture principles
    └────────┬─────────┘  Make progress
             │           Commit clean state
             ▼
    ┌──────────────────┐
    │  7. HANDOFF      │  Update: feature-requirements.json
    └────────┬─────────┘          claude-progress.txt
             │           Commit: with compliance notes
             ▼
    Session Complete
    (Next agent picks up here)

TOTAL INITIALIZATION: ~3000 tokens
AVAILABLE FOR WORK: ~197,000 tokens (200k context window)
```

---

## Compliance Enforcement Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    100% COMPLIANCE ENFORCEMENT                           │
│                     (Multi-Layer Verification)                           │
└─────────────────────────────────────────────────────────────────────────┘

Feature Development Lifecycle:

    FEAT-001 assigned
           │
           ▼
    ┌─────────────────┐
    │  DEV AGENT      │  Reads: architecture-principles.json
    │  IMPLEMENTS     │  Feature requires: SOLID-DIP, DRY-001
    └────────┬────────┘
             │           Applies principles during coding:
             │           ✓ Uses DI (injects dependencies)
             │           ✓ Reuses existing utilities (DRY)
             │
             ▼
    git commit -m "feat: [FEAT-001]
                   - DIP: Service injected
                   - DRY: HTTPClient reused"
             │
             ▼
    feature-requirements.json
    status: "ready-for-review"
             │
             ▼
    ┌─────────────────┐
    │  CODE REVIEWER  │  Reads: architecture-principles.json
    │  VERIFIES       │  For SOLID-DIP:
    └────────┬────────┘    verification_steps = [
             │               "Services injected via constructor",
             │               "No direct instantiation",
             │               "Mock-friendly architecture"
             │             ]
             │
             ├─ Execute step 1: Check injection ──────┐
             │                                          │
             ├─ Execute step 2: Check instantiation ───┤
             │                                          │
             └─ Execute step 3: Check mockability ─────┤
                                                        │
                        ALL PASS?                       │
                           │                            │
                  ┌────────┴────────┐                   │
                  │                 │                   │
                 YES               NO                   │
                  │                 │                   │
                  ▼                 ▼                   │
         git notes add     REJECT + Feedback           │
         "APPROVED"        status: "needs-revision"    │
                  │                 │                   │
                  │                 └─► Dev agent       │
                  │                     fixes           │
                  ▼                                     │
         status: "approved"                             │
                  │                                     │
                  ▼                                     │
         ┌─────────────────┐                           │
         │  UNIT TEST      │                           │
         │  WRITER         │  Creates mocks per DIP    │
         └────────┬────────┘  Ensures coverage         │
                  │                                     │
                  ▼                                     │
         status: "tested"                               │
                  │                                     │
                  ▼                                     │
         ┌─────────────────┐                           │
         │  QA AGENT       │  Runs e2e tests           │
         │  VALIDATES      │  Verifies feature works   │
         └────────┬────────┘  Checks arch compliance   │
                  │                                     │
                  ├─ Feature verification ──────────────┤
                  │                                     │
                  └─ Architecture verification ─────────┘
                                │
                       ALL VERIFIED?
                                │
                               YES
                                │
                                ▼
                    passes: true in feature-requirements.json
                                │
                                ▼
                         FEATURE COMPLETE
                    (100% architecture compliant)

┌─────────────────────────────────────────────────────────────────────────┐
│  ENFORCEMENT LAYERS:                                                     │
│  1. Dev agent applies principles (structural)                            │
│  2. Code reviewer executes verification_steps (systematic)               │
│  3. QA validates architecture compliance (validation)                    │
│  4. Pre-commit hooks automate checks (automated)                         │
│  5. Git history provides audit trail (documented)                        │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Token Budget Management

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    TOKEN BUDGET OPTIMIZATION                             │
└─────────────────────────────────────────────────────────────────────────┘

Traditional Approach (FAILS at scale):
┌──────────────────────────────────────────┐
│ System Prompt: 10,000 tokens             │  All architecture rules
│ - All DRY principles                     │  injected into prompt
│ - All SOLID principles                   │
│ - All DI patterns                        │  PROBLEM:
│ - All code standards                     │  • Consumes 10k+ tokens
│ - All architecture patterns              │  • Doesn't scale past 200 rules
│ - Feature requirements                   │  • Leaves only 190k for work
└──────────────────────────────────────────┘

Anthropic Pattern (WORKS at scale):
┌──────────────────────────────────────────┐
│ System Prompt: 500 tokens                │  Minimal prompt with
│ - Agent role definition                  │  initialization checklist
│ - Initialization checklist               │
│ - File references                        │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│ Session Initialization: 3 tool calls     │  Agents READ files
│ 1. Read architecture-principles.json     │  at session start
│    (~1000 tokens)                        │
│ 2. Read architecture-patterns.json       │  BENEFITS:
│    (~800 tokens)                         │  • Only 3k tokens consumed
│ 3. Read feature-requirements.json        │  • Scales to unlimited rules
│    (~500 tokens)                         │  • 197k tokens for work
└──────────────────────────────────────────┘  • Reusable across agents

With Prompt Caching (90% cost reduction):
┌──────────────────────────────────────────┐
│ First call:                              │
│ • architecture-principles.json: 1000 tok │  Written to cache
│ • architecture-patterns.json: 800 tok    │  Cost: 1x
│ • code-standards.json: 500 tok           │
│                                          │
│ Subsequent calls (within 5min TTL):      │
│ • Cache hit on all files                 │  Retrieved from cache
│ • Cost: 0.1x (90% savings)               │  Cost: 0.1x
│ • Latency: Significantly reduced         │
└──────────────────────────────────────────┘

With Context Compaction (extends session duration):
┌──────────────────────────────────────────┐
│ Long conversation (100+ turns):          │
│                                          │
│ Without compaction:                      │
│ • Turn 50: Context window 80% full       │
│ • Turn 80: Context exhausted             │
│ • Session must end                       │
│                                          │
│ With compaction:                         │
│ • Turn 50: Summarize turns 1-40          │
│ • Compression: 16% of original tokens    │
│ • Turn 120: Still working                │
│ • Session continues indefinitely         │
└──────────────────────────────────────────┘

Token Savings Summary:
• Persistent artifacts: 7,000 tokens saved per session
• Prompt caching: 90% cost reduction on cached content
• Context compaction: 84% token reduction on history
• Combined: ~95% overall savings vs traditional approach
```

---

## Git-Based Coordination

```
┌─────────────────────────────────────────────────────────────────────────┐
│                   GIT AS COORDINATION MECHANISM                          │
└─────────────────────────────────────────────────────────────────────────┘

    Session 1: Dev Agent
           │
           ▼
    git commit -m "feat(auth): OAuth flow [FEAT-001]
                   - SOLID-DIP: AuthService injected
                   - DRY-001: Reuses HTTPClient
                   Reviewed-by: pending
                   Tested-by: pending"
           │
           │   Commit contains:
           │   • Code changes
           │   • Compliance claims
           │   • Review status
           │
           ▼
    Session 2: Code Reviewer Agent
           │
           ├─ git log -1    ◄─── Reads latest commit
           │
           ├─ git show HEAD ◄─── Reviews changes
           │
           ├─ [Executes verification_steps]
           │
           └─ git notes add -m "Code review: APPROVED
                                - SOLID-DIP: ✅
                                - DRY-001: ✅"
           │
           │   Git notes contain:
           │   • Review results
           │   • Verification proof
           │   • Approval/rejection
           │
           ▼
    Session 3: QA Agent
           │
           ├─ git log -1          ◄─── Reads commit
           │
           ├─ git notes show HEAD ◄─── Reads review
           │
           ├─ [Runs end-to-end tests]
           │
           └─ git notes append -m "QA: PASSED
                                    - Feature works
                                    - Arch compliant"
           │
           ▼
    Session 4: Commit Agent
           │
           └─ git tag v0.1.0-feat-001-complete
           │
           ▼
    Feature Complete
    (Audit trail in git history)

Benefits:
• Every session reads git history for context
• Commits document compliance proof
• Notes provide review results
• Tags mark milestones
• Full audit trail for compliance verification
```

---

## Data Flow Summary

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         COMPLETE DATA FLOW                               │
└─────────────────────────────────────────────────────────────────────────┘

Project Setup (One-time):
    │
    ├─► Create architecture-principles.json
    ├─► Create architecture-patterns.json
    ├─► Create code-standards.json
    ├─► Create feature-requirements.json
    ├─► Create init.sh
    ├─► Create claude-progress.txt
    └─► Set up pre-commit hooks

Session N (Dev Agent):
    │
    ├─► Read: git log, claude-progress.txt
    ├─► Read: architecture-principles.json
    ├─► Read: architecture-patterns.json
    ├─► Read: feature-requirements.json
    ├─► Implement: FEAT-00N
    ├─► Apply: Architecture principles
    ├─► Commit: With compliance notes
    ├─► Update: feature-requirements.json (status: ready-for-review)
    └─► Update: claude-progress.txt

Session N+1 (Code Reviewer):
    │
    ├─► Read: git log, claude-progress.txt
    ├─► Read: architecture-principles.json
    ├─► Review: Latest commit
    ├─► Execute: verification_steps
    ├─► Approve/Reject: Based on verification
    ├─► Git notes: Add review results
    ├─► Update: feature-requirements.json (status: approved/needs-revision)
    └─► Update: claude-progress.txt

Session N+2 (QA Agent):
    │
    ├─► Read: git log, git notes, claude-progress.txt
    ├─► Read: feature-requirements.json
    ├─► Test: End-to-end feature
    ├─► Validate: Architecture compliance
    ├─► Git notes: Add QA results
    ├─► Update: feature-requirements.json (passes: true/false)
    └─► Update: claude-progress.txt

Continuous (Pre-commit Hook):
    │
    └─► On every commit attempt:
        ├─► Run: verify-architecture.js
        ├─► Check: DRY violations
        ├─► Check: SOLID violations
        ├─► Check: Pattern violations
        └─► Block commit if violations found

Result:
    │
    └─► 100% architecture-compliant codebase
        • Every feature verified
        • Every principle enforced
        • Every session documented
        • Full audit trail in git
```

---

## Key Insights

1. **Persistent Artifacts > Prompt Injection**
   - Store rules in files, not prompts
   - Scales to unlimited architecture rules
   - 7,000+ token savings per session

2. **Session Initialization is Critical**
   - Every agent reads same context files
   - Ensures shared understanding
   - Enables multi-agent coordination

3. **Verification > Trust**
   - Don't ask agents to "try hard"
   - Make them execute verification_steps
   - Automate with pre-commit hooks

4. **Git = Coordination Mechanism**
   - Commits document compliance
   - Notes provide review results
   - History enables context recovery

5. **Incremental Progress > Big Bang**
   - One feature per session
   - Prevents context exhaustion
   - Enables clean handoffs

6. **Multi-Layer Enforcement**
   - Dev applies during coding
   - Reviewer verifies systematically
   - QA validates end-to-end
   - Automation catches what humans miss

---

**Use this diagram as your reference while implementing the framework.**
