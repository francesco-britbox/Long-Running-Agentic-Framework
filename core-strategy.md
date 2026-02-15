# Large Codebase Multi-Agent Strategy

**Problem:** Building very large application (Roku/BrightScript) with multi-agent team while enforcing 100% compliance with architecture and engineering principles (DRY, SOLID, DI) without exhausting token budget.

**Based on:** Anthropic's "Effective Harnesses for Long-Running Agents"

---

## Core Strategy: Persistent Artifacts + Session Initialization

The Anthropic article solves the context/token problem through **structured persistent files** that agents read at session start, rather than embedding everything in prompts.

---

## 1. ARCHITECTURE AS PERSISTENT ARTIFACTS

### Instead of prompt injection, create structured files:

**architecture-principles.json** (READ by all agents at initialization)
```json
{
  "principles": [
    {
      "id": "DRY-001",
      "name": "Don't Repeat Yourself",
      "rule": "No code duplication. Extract to shared functions/components.",
      "brightscript_pattern": "Use roAssociativeArray for shared utilities",
      "verification_steps": [
        "Search codebase for duplicate logic patterns",
        "Check if similar functions exist in utils/",
        "Verify component reusability"
      ],
      "violation_examples": [
        "Same validation logic in multiple screens",
        "Duplicated API call patterns"
      ],
      "compliant_examples": [
        "ValidationUtils.bs for shared validators",
        "APIClient.bs with reusable request methods"
      ],
      "enforcement": "mandatory",
      "checked_by": ["code-reviewer", "qa-agent"]
    },
    {
      "id": "SOLID-SRP",
      "name": "Single Responsibility Principle",
      "rule": "Each component/function has one reason to change",
      "brightscript_pattern": "Separate UI, business logic, and data layers",
      "verification_steps": [
        "Component handles only one concern",
        "No mixed UI and business logic",
        "Clear separation of data access"
      ],
      "enforcement": "mandatory",
      "checked_by": ["code-reviewer", "architect-agent"]
    },
    {
      "id": "SOLID-DIP",
      "name": "Dependency Inversion",
      "rule": "Depend on abstractions, not concrete implementations",
      "brightscript_pattern": "Use interfaces/protocols for services",
      "verification_steps": [
        "Services injected via constructor/init",
        "No direct instantiation of dependencies",
        "Mock-friendly architecture for testing"
      ],
      "enforcement": "mandatory",
      "checked_by": ["code-reviewer", "unit-test-writer"]
    }
  ]
}
```

**architecture-patterns.json**
```json
{
  "patterns": [
    {
      "pattern_name": "Screen Component Structure",
      "required_structure": {
        "init": "Constructor with DI",
        "render": "UI rendering only",
        "handleEvents": "Event delegation",
        "cleanup": "Resource disposal"
      },
      "file_locations": {
        "screens": "components/screens/",
        "shared": "components/shared/",
        "utils": "source/utils/"
      },
      "naming_convention": "PascalCase for components, camelCase for functions",
      "verification": "All screen components follow this structure",
      "checked_by": ["code-reviewer", "architect-agent"]
    },
    {
      "pattern_name": "Service Layer",
      "description": "All API/data access through service layer",
      "structure": {
        "interface": "IDataService",
        "implementation": "DataServiceImpl",
        "injection": "Via constructor"
      },
      "checked_by": ["code-reviewer", "dev-agent"]
    }
  ]
}
```

**feature-requirements.json** (Anthropic pattern)
```json
{
  "features": [
    {
      "id": "FEAT-001",
      "category": "Authentication",
      "description": "User login with OAuth2",
      "requirements": [
        "OAuth2 flow implementation",
        "Token storage in secure registry",
        "Auto-refresh on expiry",
        "Logout cleanup"
      ],
      "architecture_compliance": ["SOLID-DIP", "DRY-001"],
      "verification_steps": [
        "Login flow works end-to-end",
        "Token persists across app restarts",
        "Expired tokens refresh automatically",
        "DI pattern used for auth service"
      ],
      "assigned_to": "dev-agent",
      "reviewed_by": "code-reviewer",
      "tested_by": "qa-agent",
      "passes": false
    }
  ]
}
```

**code-standards.json**
```json
{
  "brightscript_standards": {
    "file_structure": {
      "header": "Copyright + description",
      "imports": "Library imports section",
      "constants": "Top-level constants",
      "functions": "Alphabetically organized"
    },
    "naming": {
      "functions": "camelCase",
      "components": "PascalCase",
      "constants": "UPPER_SNAKE_CASE",
      "private": "m.privateVar for member vars"
    },
    "error_handling": {
      "rule": "All API calls wrapped in error handlers",
      "pattern": "Try/catch equivalent with invalid checks"
    },
    "checked_by": ["code-reviewer"]
  }
}
```

---

## 2. SESSION INITIALIZATION PATTERN (All Agents)

Based on Anthropic's checklist, **every agent starts every session with:**

```markdown
# AGENT INITIALIZATION CHECKLIST

## 1. Context Loading (First 3 actions)
[ ] Run `pwd` to confirm working directory
[ ] Read `claude-progress.txt` for session history
[ ] Read git log for recent changes

## 2. Architecture Loading
[ ] Read `architecture-principles.json` (full compliance rules)
[ ] Read `architecture-patterns.json` (structural patterns)
[ ] Read `code-standards.json` (BrightScript conventions)

## 3. Feature Context
[ ] Read `feature-requirements.json` (current feature specs)
[ ] Identify assigned feature (by agent role)
[ ] Verify blockers/dependencies

## 4. State Verification
[ ] Run test suite to verify clean state
[ ] Check for broken builds
[ ] Verify no uncommitted changes blocking work

## 5. Work Selection
[ ] Select ONE incomplete feature matching role
[ ] Verify architecture compliance requirements for feature
[ ] Begin incremental work
```

**Token savings:** Instead of 5000+ tokens in prompt, agents read ~1000 tokens from files, freeing up context for actual work.

---

## 3. MULTI-AGENT TEAM STRUCTURE

Anthropic article mentions multi-agent as "future direction" but provides foundation via:
- Persistent artifacts (shared state)
- Git commits (coordination)
- Progress file (handoffs)

### Agent Roles + Responsibilities

**1. Team Lead Agent**
- Initializes project structure
- Creates/updates feature-requirements.json
- Assigns features to dev-agent
- Reviews progress across all agents
- Updates claude-progress.txt with team status

**2. Dev Agent**
- Reads architecture-principles.json at start
- Implements ONE feature per session
- Ensures compliance with patterns during coding
- Commits with detailed messages
- Updates feature status to "ready-for-review"

**3. Code Reviewer Agent**
- Reads architecture-principles.json
- Reviews commits for compliance with principles
- Checks verification_steps from each principle
- Blocks merge if violations found
- Updates feature status to "approved" or "needs-revision"

**4. Unit Test Writer Agent**
- Reads code-standards.json for test patterns
- Writes tests verifying SOLID compliance
- Creates mocks per DIP requirements
- Updates feature status to "tested"

**5. QA Agent**
- Reads feature-requirements.json
- Runs end-to-end verification_steps
- Uses automation (like Puppeteer equivalent for Roku)
- Validates architecture compliance
- Updates feature "passes" field

**6. Documentation Writer Agent**
- Reads completed features
- Documents architecture decisions
- Updates API docs
- Creates architecture diagrams

**7. Commit/Git Agent**
- Reviews all changes before commit
- Ensures commit messages follow standards
- Creates meaningful git history
- Tags releases

---

## 4. COMPLIANCE ENFORCEMENT MECHANISMS

### Pattern 1: JSON Structure (Anthropic Recommendation)

**Why JSON?** Article states: "Using JSON rather than Markdown reduces inappropriate modifications"

- Architecture rules in JSON = harder for agents to modify
- Structured format = programmatic verification
- `"enforcement": "mandatory"` = explicit requirement
- `"checked_by": ["agent-name"]` = clear responsibility

### Pattern 2: Verification Steps (Per Principle)

Each principle includes verification_steps that checking agents must execute:

```json
{
  "id": "DRY-001",
  "verification_steps": [
    "Search codebase for duplicate logic patterns",
    "Check if similar functions exist in utils/",
    "Verify component reusability"
  ],
  "checked_by": ["code-reviewer", "qa-agent"]
}
```

**Code-reviewer agent prompt includes:**
```markdown
Before approving any code:
1. Read architecture-principles.json
2. For each principle with "checked_by": ["code-reviewer"]
3. Execute ALL verification_steps
4. If ANY step fails → block merge, provide feedback
5. Only approve when 100% verified
```

### Pattern 3: Feature-Principle Mapping

```json
{
  "id": "FEAT-001",
  "architecture_compliance": ["SOLID-DIP", "DRY-001"],
  "verification_steps": [
    "DI pattern used for auth service",
    "No duplicate auth logic"
  ]
}
```

QA agent verifies BOTH feature functionality AND architecture compliance.

### Pattern 4: Pre-commit Hooks (Automated)

```bash
# .git/hooks/pre-commit
#!/bin/bash

# Run architecture compliance checker
node scripts/verify-architecture.js

if [ $? -ne 0 ]; then
  echo "❌ Architecture compliance failed"
  exit 1
fi
```

Script checks:
- DRY violations (code duplication)
- SOLID violations (dependency analysis)
- Pattern violations (file structure)

---

## 5. INCREMENTAL PROGRESS STRATEGY

**Anthropic's key insight:** "Work on single features per session. This prevents context exhaustion mid-implementation."

### Applied to Your Problem

**❌ Don't:**
```
Dev agent: Build entire authentication system (OAuth + storage + refresh + logout)
→ Context exhausted at 70% → incomplete feature → next session confused
```

**✅ Do:**
```
Session 1 - Dev agent: OAuth login flow only
Session 2 - Unit test writer: OAuth tests
Session 3 - Code reviewer: OAuth compliance check
Session 4 - QA agent: OAuth end-to-end verification
Session 5 - Dev agent: Token storage (next sub-feature)
```

Each session:
- Completes ONE piece
- Verifies compliance for that piece
- Commits clean state
- Documents in progress file

---

## 6. CLEAN STATE DEFINITION (Critical)

**Anthropic:** "Code should be merge-ready: no major bugs, well-organized, properly documented"

### For Your Architecture Enforcement

```json
{
  "clean_state_requirements": {
    "code_quality": {
      "no_bugs": "All tests passing",
      "organized": "Files in correct architecture folders",
      "documented": "Inline comments + README updated"
    },
    "architecture_compliance": {
      "DRY": "No code duplication detected",
      "SOLID": "All principles verified",
      "DI": "Dependencies injected, not instantiated"
    },
    "verification": {
      "unit_tests": "100% of new code covered",
      "integration_tests": "Feature works end-to-end",
      "architecture_audit": "Compliance checker passes"
    }
  }
}
```

**Every session must end in clean state** = next agent can start immediately without cleanup.

---

## 7. GIT AS COORDINATION TOOL

**Anthropic:** "Git commits + history enable agents to understand prior work and revert if needed"

### Multi-Agent Git Workflow

```bash
# Dev agent completes feature
git commit -m "feat(auth): OAuth login flow [FEAT-001]

Implements:
- OAuth2 authorization flow
- Token exchange
- Error handling

Architecture compliance:
- ✅ SOLID-DIP: AuthService injected
- ✅ DRY-001: Reuses HTTPClient
- ✅ Pattern: Service layer separation

Reviewed-by: pending
Tested-by: pending"

# Code reviewer agent
# Reviews code using git log and git show
git notes add -m "Architecture review: APPROVED
- DIP verified: AuthService uses IAuthProvider interface
- DRY verified: No duplication found
- Pattern verified: Follows service layer structure"

# QA agent
# Reads git log and notes for context
git notes append -m "QA verification: PASSED
- OAuth flow works end-to-end
- Token stored correctly
- Error handling works"

# Commit agent
git tag v0.1.0-feat-001-complete
```

**Each agent reads git history to understand:**
- What was implemented
- What architecture rules were applied
- What's been verified
- What's pending

---

## 8. PUTTING IT ALL TOGETHER

### Project Structure

```
roku-app/
├── .git/
├── architecture/
│   ├── architecture-principles.json      ← All agents read
│   ├── architecture-patterns.json        ← All agents read
│   ├── code-standards.json               ← All agents read
│   └── feature-requirements.json         ← Updated by team-lead
├── source/
│   ├── components/
│   ├── services/
│   └── utils/
├── tests/
├── scripts/
│   ├── init.sh                           ← Anthropic pattern
│   └── verify-architecture.js            ← Compliance checker
├── claude-progress.txt                   ← Anthropic pattern
└── README.md
```

### Workflow Example: Implementing Authentication

#### Session 1: Team Lead Agent

```markdown
# Initialization
[Reads git log, progress file, pwd]

# Work
- Creates feature-requirements.json with FEAT-001
- Assigns to dev-agent
- Updates claude-progress.txt:
  "Session 1: Created FEAT-001 (OAuth), assigned to dev-agent"

# Commit
git commit -m "feat: define authentication feature requirements"
```

#### Session 2: Dev Agent

```markdown
# Initialization
[Reads pwd, git log, claude-progress.txt]
[Reads architecture-principles.json]  ← CRITICAL
[Reads architecture-patterns.json]    ← CRITICAL
[Reads code-standards.json]           ← CRITICAL
[Reads feature-requirements.json]

# Verifies
- Clean state: tests passing
- Assignment: FEAT-001 assigned to dev-agent
- Requirements: OAuth login flow
- Architecture compliance needed: SOLID-DIP, DRY-001

# Work
- Implements OAuth login flow
- APPLIES DIP: AuthService uses IAuthProvider interface
- APPLIES DRY: Reuses existing HTTPClient
- Follows pattern: Service layer structure
- Writes code in components/services/AuthService.bs

# Verification (self-check before commit)
[ ] DIP applied? YES - interface used
[ ] DRY applied? YES - HTTPClient reused
[ ] Pattern followed? YES - service layer structure

# Commit
git commit -m "feat(auth): OAuth login flow [FEAT-001]
- DIP: AuthService implements IAuthProvider
- DRY: Reuses HTTPClient
- Pattern: Service layer separation"

# Updates
- feature-requirements.json: status = "ready-for-review"
- claude-progress.txt: "Session 2: dev-agent implemented OAuth flow"
```

#### Session 3: Code Reviewer Agent

```markdown
# Initialization
[Reads pwd, git log, claude-progress.txt]
[Reads architecture-principles.json]  ← LOADS COMPLIANCE RULES
[Reads code-standards.json]

# Context
- git log shows FEAT-001 implementation
- feature-requirements.json shows "ready-for-review"
- Principles required: SOLID-DIP, DRY-001

# Review Process
For principle SOLID-DIP:
  verification_steps = ["Services injected via constructor", "No direct instantiation", "Mock-friendly"]

  Check 1: Services injected?
    → Reads AuthService.bs
    → Sees: sub init(authProvider as IAuthProvider)
    → ✅ PASS

  Check 2: No direct instantiation?
    → Searches for CreateObject references in AuthService
    → None found
    → ✅ PASS

  Check 3: Mock-friendly?
    → Interface used, can inject mock
    → ✅ PASS

For principle DRY-001:
  verification_steps = ["No duplicate logic", "Shared utilities used"]

  Check 1: Duplicate logic?
    → Searches for similar HTTP request code
    → None found, HTTPClient.request() used
    → ✅ PASS

# Decision
ALL checks passed → APPROVE

# Commit
git notes add -m "Code review: APPROVED
- SOLID-DIP: ✅ All checks passed
- DRY-001: ✅ All checks passed
- Code standards: ✅ Compliant"

# Updates
- feature-requirements.json: status = "approved"
- claude-progress.txt: "Session 3: code-reviewer approved FEAT-001"
```

#### Session 4: Unit Test Writer Agent

```markdown
# Initialization
[Reads context files]
[Reads architecture-principles.json]  ← For test requirements

# Work
- Creates AuthService.test.bs
- Uses MOCK per DIP requirement
- Tests OAuth flow
- Verifies error handling

# Verification
- Tests pass
- Coverage 100% of AuthService

# Updates
- feature-requirements.json: status = "tested"
- claude-progress.txt: "Session 4: unit-test-writer added tests"
```

#### Session 5: QA Agent

```markdown
# Initialization
[Reads all context]
[Reads feature-requirements.json]  ← Gets verification_steps

# Verification (from feature-requirements.json)
Step 1: "Login flow works end-to-end"
  → Runs Roku simulator
  → Tests OAuth flow
  → ✅ PASS

Step 2: "DI pattern used for auth service"
  → Reviews code with code-reviewer notes
  → ✅ CONFIRMED

# Architecture Compliance Check
For each required principle (SOLID-DIP, DRY-001):
  → Reviews code-reviewer notes
  → Confirms approval
  → ✅ ARCHITECTURE COMPLIANT

# Decision
Feature complete + Architecture compliant → Mark PASSES

# Updates
- feature-requirements.json: passes = true
- claude-progress.txt: "Session 5: qa-agent verified FEAT-001 complete"
```

---

## 9. TOKEN BUDGET MANAGEMENT

### Traditional Approach (What NOT to do)

```markdown
System prompt (8000 tokens):
- All DRY principles explained
- All SOLID principles explained
- All DI patterns explained
- All BrightScript conventions
- All architecture patterns
- Feature requirements

User prompt (2000 tokens):
- Specific feature request

Agent work (190,000 tokens available):
- Actual implementation

PROBLEM: 10,000 tokens consumed before work starts
```

### Anthropic Pattern (What TO do)

```markdown
System prompt (500 tokens):
- Agent role definition
- Initialization checklist
- Reference to architecture files

Agent initialization (3 tool calls):
1. Read architecture-principles.json (1000 tokens)
2. Read architecture-patterns.json (800 tokens)
3. Read feature-requirements.json (500 tokens)

Total context consumed: 2800 tokens
Available for work: 197,200 tokens

BENEFIT: 7,200 tokens saved + reusable across all agents
```

### At Scale (200+ principles/patterns)

**Files approach:**
- architecture-principles.json: 5000 tokens (read once per session)
- Agent loads only relevant principles for current feature
- Still fits in context with room for implementation

**Prompt approach:**
- Would exceed context window before work starts
- Impossible to maintain 100% enforcement

---

## 10. COMPLIANCE VERIFICATION SCRIPT

**Create automated checker** (Anthropic: use tooling)

```javascript
// scripts/verify-architecture.js

const fs = require('fs');
const { execFileSync } = require('child_process');

const principles = JSON.parse(
  fs.readFileSync('architecture/architecture-principles.json', 'utf8')
);

// Get recent commit safely
const commitHash = execFileSync('git', ['rev-parse', 'HEAD']).toString().trim();
const commitDiff = execFileSync('git', ['show', commitHash]).toString();

let violations = [];

// Check DRY
if (principles.find(p => p.id === 'DRY-001')) {
  const duplicates = findDuplicateCode('./source');
  if (duplicates.length > 0) {
    violations.push({
      principle: 'DRY-001',
      issue: 'Code duplication detected',
      locations: duplicates
    });
  }
}

// Check SOLID-DIP
if (principles.find(p => p.id === 'SOLID-DIP')) {
  const directInstantiations = findDirectInstantiations('./source');
  if (directInstantiations.length > 0) {
    violations.push({
      principle: 'SOLID-DIP',
      issue: 'Direct instantiation found (should use DI)',
      locations: directInstantiations
    });
  }
}

if (violations.length > 0) {
  console.error('❌ Architecture violations found:');
  console.error(JSON.stringify(violations, null, 2));
  process.exit(1);
}

console.log('✅ Architecture compliance verified');
process.exit(0);
```

**Pre-commit hook runs this automatically** → catches violations before commit

---

## 11. FINAL ANSWER TO YOUR PROBLEM

### Your Challenge
- Very large Roku codebase
- Architecture + principles docs = massive tokens
- Need 100% enforcement across multi-agent team

### Solution (Based on Anthropic Article)

**1. Store Architecture as Persistent Artifacts**
- architecture-principles.json (DRY, SOLID, DI with verification steps)
- architecture-patterns.json (BrightScript patterns)
- code-standards.json (conventions)
- feature-requirements.json (features with compliance mapping)

**2. Session Initialization Pattern**
- Every agent reads these files at session start
- Takes ~3000 tokens (vs 10,000+ in prompt)
- Loads only relevant context for current work

**3. Structured Compliance Enforcement**
- JSON format prevents modification
- verification_steps per principle
- checked_by field assigns responsibility
- Pre-commit hooks automate verification

**4. Multi-Agent Coordination**
- Shared persistent artifacts (everyone reads same rules)
- Git commits + notes for handoffs
- claude-progress.txt for team status
- Each agent has specific compliance responsibilities

**5. Incremental Progress**
- One feature per session (prevents context exhaustion)
- Clean state between sessions (merge-ready)
- Architecture verified at each step (not just at end)

### Token Budget

**Without this approach:**
- Prompt injection: 10,000+ tokens
- Limited work capacity
- Can't scale to 200+ principles

**With this approach:**
- File-based: 3,000 tokens per session
- Scales to unlimited principles (read as needed)
- 197,000 tokens available for actual work

### 100% Enforcement Mechanism

**Not relying on agent "trying hard":**

1. **Structural:** JSON files prevent modification
2. **Explicit:** verification_steps must be executed
3. **Assigned:** checked_by makes responsibility clear
4. **Automated:** Pre-commit hooks catch violations
5. **Multi-layer:** Dev applies → Reviewer verifies → QA validates
6. **Documented:** Git history shows compliance proof

**Result:** Architecture compliance is VERIFIED, not assumed.

---

## 12. IMPLEMENTATION ROADMAP

### Phase 1: Foundation (1-2 days)
1. Create architecture/ folder structure
2. Write architecture-principles.json (all DRY, SOLID, DI rules)
3. Write architecture-patterns.json (BrightScript patterns)
4. Write code-standards.json (conventions)
5. Create init.sh script
6. Create claude-progress.txt

### Phase 2: Automation (1 day)
1. Write verify-architecture.js script
2. Set up pre-commit hooks
3. Test compliance detection

### Phase 3: Agent System (2-3 days)
1. Define each agent's initialization prompt
2. Create feature-requirements.json for first feature
3. Test dev-agent → code-reviewer → qa-agent flow
4. Verify compliance enforcement works

### Phase 4: Scale (ongoing)
1. Add features incrementally
2. Refine verification_steps based on violations found
3. Expand architecture-principles.json as patterns emerge
4. Document successful patterns

---

## CONCLUSION

**Anthropic's core insight applies directly to your problem:**

"Long-running agents need persistent artifacts to bridge sessions, not just prompts."

**Your architecture docs = persistent artifacts**
- Store as JSON (prevents modification)
- Include verification steps (ensures enforcement)
- Assign to specific agents (clear responsibility)
- Automate checks (tooling catches violations)

**Multi-agent team = specialized verifiers**
- Dev agent applies principles during coding
- Code reviewer executes verification steps
- QA validates architecture compliance
- Each reads same artifacts, different responsibilities

**100% enforcement = structural, not hopeful**
- Not "please follow DRY" (ignored)
- But "execute these 3 verification steps for DRY-001" (enforced)
- Pre-commit automation catches what agents miss
- Git history provides compliance audit trail

**This scales to your large codebase** because:
- Token cost is per-session reads, not upfront injection
- Principles live in files, not prompts
- Unlimited principles possible (read as needed)
- Clean handoffs via git + progress file

**You achieve 100% compliance through verification, not trust.**
