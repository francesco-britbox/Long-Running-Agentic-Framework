# Implementation Guide: Step-by-Step

**Time estimate:** 5-7 days for base framework, +2-3 days with OpenSpec integration
**Complexity:** Moderate - systematic approach required

**IMPORTANT:** This is a FOUNDATION document - instructions for a new session to BUILD the framework, not the framework itself.

---

## Prerequisites

Before starting, ensure you have:
- [ ] Project repository initialized with git
- [ ] Base codebase or starting point
- [ ] Understanding of your architecture requirements (DRY, SOLID, DI, etc.)
- [ ] List of agents you'll need (dev, reviewer, QA, etc.)
- [ ] Access to Claude API or Claude Code CLI
- [ ] (Optional) Node.js 20.19.0+ if using OpenSpec integration

---

## Phase 0: OpenSpec Integration (Optional - Recommended)

**Time estimate:** 2-3 days
**Skip if:** You'll write specs manually in feature-requirements.json
**Use if:** You want AI-assisted, structured specification creation

### What OpenSpec Adds

**Without OpenSpec:**
- Write feature requirements manually
- No structured spec format
- Planning ad-hoc

**With OpenSpec:**
- AI-generated proposals, specs, design docs, tasks
- Structured Given/When/Then scenarios
- Spec deltas showing requirement evolution
- 15-30 minutes of structured planning per feature

### Integration Guide

**Complete instructions:** See `openspec-integration-guide.md`

**Quick overview:**
1. Install OpenSpec (`npm install -g @fission-ai/openspec@latest`)
2. Initialize in project (`openspec init`)
3. Build bridge script (`scripts/openspec-to-feature.js`)
4. Update agent prompts to read OpenSpec references
5. Test with sample feature

**Decision point:** Integrate now or skip for manual spec creation?

**Recommendation:** Integrate OpenSpec. It fills the spec creation gap and provides 10x better requirements.

**If integrating:** Follow `openspec-integration-guide.md` Phases 0-3 before continuing here.

**If skipping:** Continue to Phase 1 below.

---

## Phase 1: Foundation Setup (Days 1-2)

### Task 1.1: Create Project Structure

```bash
# In your project root
mkdir -p architecture
mkdir -p scripts
touch claude-progress.txt
touch scripts/init.sh
chmod +x scripts/init.sh
```

**Validation:**
- [ ] `architecture/` folder exists
- [ ] `scripts/` folder exists
- [ ] `claude-progress.txt` exists
- [ ] `scripts/init.sh` is executable

---

### Task 1.2: Create architecture-principles.json

Use template from `template-files/architecture-principles.json`

**Customize for your project:**
1. Replace example principles with your actual requirements
2. For each principle, define:
   - `id`: Unique identifier (e.g., "DRY-001")
   - `name`: Human-readable name
   - `rule`: Clear statement of the principle
   - `[language]_pattern`: Language-specific application
   - `verification_steps`: List of checkable steps
   - `violation_examples`: What NOT to do
   - `compliant_examples`: What TO do
   - `enforcement`: "mandatory" or "recommended"
   - `checked_by`: Which agents verify this

**Example principles to include:**
- DRY (Don't Repeat Yourself)
- SOLID principles (SRP, OCP, LSP, ISP, DIP)
- Dependency Injection
- Error handling standards
- Testing requirements
- Documentation standards

**File location:** `architecture/architecture-principles.json`

**Validation:**
- [ ] File is valid JSON (use `cat architecture/architecture-principles.json | python -m json.tool`)
- [ ] All principles have `id`, `verification_steps`, `checked_by`
- [ ] At least 5-10 core principles defined

---

### Task 1.3: Create architecture-patterns.json

Use template from `template-files/architecture-patterns.json`

**Define patterns for:**
1. File organization (where do components go?)
2. Component structure (required methods/properties)
3. Naming conventions (PascalCase, camelCase, etc.)
4. Service layer patterns
5. Data access patterns
6. UI component patterns

**Example for Roku/BrightScript:**
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
      "naming_convention": "PascalCase for components, camelCase for functions"
    }
  ]
}
```

**File location:** `architecture/architecture-patterns.json`

**Validation:**
- [ ] File is valid JSON
- [ ] Patterns cover your main component types
- [ ] File locations specified
- [ ] Naming conventions clear

---

### Task 1.4: Create code-standards.json

Use template from `template-files/code-standards.json`

**Define standards for:**
1. File structure (header, imports, constants, functions)
2. Naming conventions (functions, variables, constants)
3. Error handling (try/catch patterns, error messages)
4. Comments (when/where/how)
5. Testing (coverage requirements, naming)

**File location:** `architecture/code-standards.json`

**Validation:**
- [ ] File is valid JSON
- [ ] Language-specific conventions defined
- [ ] Error handling patterns specified
- [ ] Testing standards clear

---

### Task 1.5: Create feature-requirements.json

Use template from `template-files/feature-requirements.json`

**Start with first feature:**
```json
{
  "features": [
    {
      "id": "FEAT-001",
      "category": "Setup",
      "description": "Project initialization and base structure",
      "requirements": [
        "Folder structure created",
        "Architecture files in place",
        "init.sh script working"
      ],
      "architecture_compliance": [],
      "verification_steps": [
        "All folders exist",
        "All JSON files valid",
        "init.sh executes without errors"
      ],
      "assigned_to": "dev-agent",
      "reviewed_by": "code-reviewer",
      "tested_by": "qa-agent",
      "passes": false
    }
  ]
}
```

**File location:** `architecture/feature-requirements.json`

**Validation:**
- [ ] File is valid JSON
- [ ] First feature (FEAT-001) defined
- [ ] Template ready for adding more features

---

### Task 1.6: Create init.sh Script

**Purpose:** Script that every agent runs at session start

```bash
#!/bin/bash

echo "=== Session Initialization ==="

# 1. Verify working directory
echo "Working directory: $(pwd)"

# 2. Run tests (if they exist)
if [ -d "tests" ]; then
  echo "Running tests..."
  # Add your test command here
  # npm test || pytest || make test
fi

# 3. Check git status
echo "Git status:"
git status --short

# 4. Show recent commits
echo "Recent commits:"
git log --oneline -5

# 5. Verify architecture files
echo "Verifying architecture files..."
for file in architecture/*.json; do
  if [ -f "$file" ]; then
    echo "  ✓ $file"
    # Validate JSON
    python -m json.tool "$file" > /dev/null 2>&1
    if [ $? -eq 0 ]; then
      echo "    Valid JSON"
    else
      echo "    ⚠️  Invalid JSON"
    fi
  fi
done

# 6. Show feature status
echo "Feature status:"
if [ -f "architecture/feature-requirements.json" ]; then
  # Show incomplete features (simplified - you can enhance this)
  grep -o '"id": "FEAT-[0-9]*"' architecture/feature-requirements.json
fi

echo "=== Initialization Complete ==="
```

**File location:** `scripts/init.sh`

**Validation:**
- [ ] Script is executable (`chmod +x scripts/init.sh`)
- [ ] Running `./scripts/init.sh` completes without errors
- [ ] Shows git status, tests, and architecture files

---

### Task 1.7: Initial Git Commit

```bash
git add architecture/
git add scripts/
git add claude-progress.txt
git commit -m "feat: initialize long-running agent framework

Setup:
- Created architecture/ with principles, patterns, standards
- Created feature-requirements.json for tracking
- Created init.sh for session initialization
- Created claude-progress.txt for progress tracking

Architecture files:
- architecture-principles.json: DRY, SOLID, DI rules
- architecture-patterns.json: Code structure patterns
- code-standards.json: Language conventions

Framework ready for agent sessions."
```

**Update claude-progress.txt:**
```
Session 1 (Human - Setup):
- Initialized framework structure
- Created architecture files (principles, patterns, standards)
- Created init.sh script
- Committed baseline
- Next: Begin feature development with dev-agent
```

**Validation:**
- [ ] All files committed
- [ ] claude-progress.txt updated
- [ ] Clean git status

---

## Phase 2: Automation Scripts (Day 3)

### Task 2.1: Create verify-architecture.js

**Purpose:** Pre-commit hook to catch violations automatically

```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

// Load architecture principles
const principlesPath = path.join(__dirname, '../architecture/architecture-principles.json');
const principles = JSON.parse(fs.readFileSync(principlesPath, 'utf8'));

console.log('=== Architecture Compliance Verification ===\n');

let violations = [];

// Get files changed in this commit
let changedFiles = [];
try {
  const output = execFileSync('git', ['diff', '--cached', '--name-only', '--diff-filter=ACM']).toString();
  changedFiles = output.trim().split('\n').filter(f => f);
} catch (e) {
  console.log('⚠️  No staged changes to verify');
  process.exit(0);
}

console.log(`Checking ${changedFiles.length} changed files...\n`);

// Check DRY violations (simple duplication detection)
function checkDRY(files) {
  const dryPrinciple = principles.principles.find(p => p.id === 'DRY-001');
  if (!dryPrinciple) return;

  console.log('Checking DRY-001: No code duplication...');

  // Simple check: look for duplicate function signatures
  // (In production, use more sophisticated tools like jscpd)

  console.log('  ✓ DRY check passed (basic validation)');
}

// Check SOLID-DIP violations (dependency injection)
function checkDIP(files) {
  const dipPrinciple = principles.principles.find(p => p.id === 'SOLID-DIP');
  if (!dipPrinciple) return;

  console.log('Checking SOLID-DIP: Dependency injection...');

  // Check for direct instantiation patterns
  files.forEach(file => {
    if (!fs.existsSync(file)) return;
    const content = fs.readFileSync(file, 'utf8');

    // Example: check for "new ClassName()" which might violate DI
    // Adapt this regex to your language
    const directInstantiations = content.match(/new\s+[A-Z]\w+\(/g);

    if (directInstantiations && directInstantiations.length > 3) {
      violations.push({
        file,
        principle: 'SOLID-DIP',
        issue: `Found ${directInstantiations.length} direct instantiations (consider DI)`,
        line: 'multiple'
      });
    }
  });

  if (violations.length === 0) {
    console.log('  ✓ DIP check passed');
  }
}

// Run checks
checkDRY(changedFiles);
checkDIP(changedFiles);

// Report results
console.log('\n=== Verification Results ===\n');

if (violations.length === 0) {
  console.log('✅ All architecture compliance checks passed!\n');
  process.exit(0);
} else {
  console.log('❌ Architecture violations found:\n');
  violations.forEach(v => {
    console.log(`  ${v.file}:${v.line}`);
    console.log(`  ${v.principle}: ${v.issue}\n`);
  });
  console.log('Fix violations before committing.\n');
  process.exit(1);
}
```

**File location:** `scripts/verify-architecture.js`

**Make executable:**
```bash
chmod +x scripts/verify-architecture.js
```

**Validation:**
- [ ] Script runs without errors: `node scripts/verify-architecture.js`
- [ ] Returns appropriate exit codes (0 for pass, 1 for fail)

---

### Task 2.2: Create Pre-Commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

echo "Running architecture compliance checks..."

node scripts/verify-architecture.js

if [ $? -ne 0 ]; then
  echo ""
  echo "❌ Commit blocked due to architecture violations"
  echo "Fix the issues above or use --no-verify to skip (not recommended)"
  exit 1
fi

echo "✅ Architecture compliance verified"
exit 0
```

**File location:** `.git/hooks/pre-commit`

**Make executable:**
```bash
chmod +x .git/hooks/pre-commit
```

**Validation:**
- [ ] Try committing with violations - should block
- [ ] Try committing clean code - should pass

---

### Task 2.3: Commit Automation Scripts

```bash
git add scripts/verify-architecture.js
git add .git/hooks/pre-commit
git commit -m "feat: add automated architecture compliance checking

Automation:
- verify-architecture.js: Checks DRY, SOLID violations
- pre-commit hook: Runs verification before each commit
- Blocks commits with architecture violations

Implements automatic enforcement layer."
```

**Update claude-progress.txt:**
```
Session 2 (Human - Automation):
- Created verify-architecture.js for automated checking
- Set up pre-commit hooks
- Tested violation detection
- Next: Configure agent system
```

---

## Phase 3: Agent System Configuration (Days 4-5)

### Task 3.1: Define Agent Prompts

For each agent type, create a system prompt using templates from `agent-prompts/`

**Required agents (minimum):**
1. Dev Agent
2. Code Reviewer Agent
3. QA Agent

**Optional agents:**
4. Unit Test Writer Agent
5. Documentation Writer Agent
6. Architect Agent
7. Commit Agent

**For each agent, customize:**
- Role definition
- Initialization checklist
- Specific responsibilities
- Verification procedures
- Handoff protocol

---

### Task 3.2: Test Dev Agent → Code Reviewer Flow

**Step 1: Create test feature**

Add to `architecture/feature-requirements.json`:
```json
{
  "id": "FEAT-002",
  "category": "Test",
  "description": "Simple utility function for testing framework",
  "requirements": [
    "Create utils/ folder",
    "Implement add(a, b) function",
    "Follow code standards"
  ],
  "architecture_compliance": ["DRY-001", "code-standards"],
  "verification_steps": [
    "Function exists in utils/",
    "Function works correctly",
    "Code follows standards"
  ],
  "assigned_to": "dev-agent",
  "reviewed_by": "code-reviewer",
  "tested_by": "qa-agent",
  "passes": false
}
```

**Step 2: Dev Agent Session**

Using Claude API or Claude Code, invoke dev-agent with:
- System prompt from `agent-prompts/dev-agent-prompt.md`
- Task: "Implement FEAT-002"

**Expected output:**
- Creates `utils/math.js` (or equivalent)
- Implements `add(a, b)` function
- Commits with compliance notes
- Updates `feature-requirements.json` status to "ready-for-review"
- Updates `claude-progress.txt`

**Step 3: Code Reviewer Agent Session**

Invoke code-reviewer with:
- System prompt from `agent-prompts/code-reviewer-prompt.md`
- Context: Read git log, architecture-principles.json

**Expected output:**
- Reviews commit
- Executes verification_steps for DRY-001 and code-standards
- Adds git notes with review results
- Updates `feature-requirements.json` status to "approved" or "needs-revision"
- Updates `claude-progress.txt`

**Step 4: QA Agent Session**

Invoke qa-agent with:
- System prompt from `agent-prompts/qa-agent-prompt.md`
- Context: Read feature-requirements.json

**Expected output:**
- Tests add(a, b) function
- Verifies it follows code standards
- Updates `feature-requirements.json` passes to `true`
- Updates `claude-progress.txt`

**Validation:**
- [ ] Dev agent creates compliant code
- [ ] Code reviewer executes verification steps
- [ ] QA agent validates feature
- [ ] feature-requirements.json updated correctly
- [ ] claude-progress.txt shows all sessions
- [ ] Git history shows compliance proof

---

### Task 3.3: Commit Agent Configuration

```bash
git add architecture/feature-requirements.json
git add claude-progress.txt
git commit -m "feat: validate agent workflow with FEAT-002

Testing:
- Dev agent implemented test feature
- Code reviewer verified compliance
- QA agent validated functionality
- All agents updated feature-requirements.json
- All agents documented in claude-progress.txt

Agent workflow validated and ready for production use."
```

---

## Phase 4: Production Deployment (Days 6-7)

### Task 4.1: Define Real Features

Populate `feature-requirements.json` with actual project features:

**Example for Roku app:**
```json
{
  "features": [
    {
      "id": "FEAT-003",
      "category": "Authentication",
      "description": "User login with OAuth2",
      "requirements": [
        "OAuth2 flow implementation",
        "Token storage",
        "Auto-refresh",
        "Logout"
      ],
      "architecture_compliance": ["SOLID-DIP", "DRY-001", "error-handling"],
      "verification_steps": [
        "Login flow works end-to-end",
        "Tokens persist across restarts",
        "Auto-refresh on expiry",
        "DI pattern used for auth service"
      ],
      "assigned_to": "dev-agent",
      "reviewed_by": "code-reviewer",
      "tested_by": "qa-agent",
      "passes": false
    },
    // Add more features...
  ]
}
```

**Recommendation:** Define 10-20 features to start

**Validation:**
- [ ] All features have unique IDs
- [ ] architecture_compliance mapped for each feature
- [ ] verification_steps defined
- [ ] Agents assigned

---

### Task 4.2: Set Up Prompt Caching

**Configure Claude API for caching:**

In your agent invocation code:
```json
{
  "model": "claude-sonnet-4-5-20250929",
  "max_tokens": 4096,
  "system": [
    {
      "type": "text",
      "text": "You are a dev agent...",
      "cache_control": {"type": "ephemeral"}
    }
  ],
  "messages": [...]
}
```

**Cache these files:**
- architecture-principles.json
- architecture-patterns.json
- code-standards.json

**Benefits:**
- First call: Full cost
- Subsequent calls (within 5min): 90% savings

**Validation:**
- [ ] Check API response headers for cache hits
- [ ] Monitor `anthropic-cache-hits` header
- [ ] Verify cost reduction in billing

---

### Task 4.3: Configure Context Compaction

**Enable in Claude API:**
```json
{
  "model": "claude-sonnet-4-5-20250929",
  "context_management": {
    "compaction": {
      "enabled": true,
      "threshold": 0.8  // Compact when 80% full
    }
  }
}
```

**Validation:**
- [ ] Long sessions don't hit context limits
- [ ] Check for compaction in API responses

---

### Task 4.4: Production Workflow Documentation

Create `DEVELOPMENT.md` in your project:

```markdown
# Development Workflow

## For Developers (Human)

1. Create feature in feature-requirements.json
2. Assign to dev-agent
3. Update claude-progress.txt with intent

## For Dev Agent

1. Run: ./scripts/init.sh
2. Read: architecture files
3. Implement: Assigned feature
4. Verify: Self-check against principles
5. Commit: With compliance notes
6. Update: feature-requirements.json, claude-progress.txt

## For Code Reviewer Agent

1. Run: ./scripts/init.sh
2. Read: architecture-principles.json
3. Review: Latest commit
4. Execute: verification_steps for each principle
5. Approve/Reject: Based on verification
6. Git notes: Add review results
7. Update: feature-requirements.json, claude-progress.txt

## For QA Agent

1. Run: ./scripts/init.sh
2. Read: feature-requirements.json
3. Test: Feature end-to-end
4. Validate: Architecture compliance
5. Update: passes field, claude-progress.txt

## Quality Gates

- All features must pass code review
- All features must pass QA validation
- All features must be architecture-compliant
- All sessions must update progress file
```

**Validation:**
- [ ] Workflow documented
- [ ] All team members (human and agents) understand process

---

## Phase 5: Validation & Iteration (Ongoing)

### Task 5.1: First Production Feature

**Execute full workflow:**
1. Dev agent implements FEAT-003
2. Code reviewer verifies
3. Unit test writer adds tests
4. QA validates
5. Feature marked complete

**Validation checklist:**
- [ ] Feature works end-to-end
- [ ] All verification_steps passed
- [ ] Git history shows compliance
- [ ] claude-progress.txt updated
- [ ] No architecture violations

---

### Task 5.2: Refine Verification Steps

Based on first feature:
- Did verification_steps catch issues?
- Were any violations missed?
- Are steps too strict/too loose?

**Update architecture-principles.json:**
- Add missed verification_steps
- Refine existing steps
- Add examples from real code

---

### Task 5.3: Monitor Token Usage

**Track costs:**
- Check API usage for each session
- Verify prompt caching savings
- Monitor context compaction effectiveness

**Expected costs:**
- First session: ~$0.XX (baseline)
- Subsequent sessions with cache: ~$0.0X (90% savings)

---

### Task 5.4: Scale Up

**After validating with 3-5 features:**
- Increase feature parallelization
- Add more agent types if needed
- Expand architecture-principles.json
- Document patterns that emerge

---

## Success Criteria

Your framework is production-ready when:

- [ ] 3+ features completed using full agent workflow
- [ ] All agents follow initialization checklist
- [ ] Prompt caching enabled and working (90% savings)
- [ ] Pre-commit hooks catching violations
- [ ] Git history shows compliance audit trail
- [ ] claude-progress.txt documenting all sessions
- [ ] feature-requirements.json tracking all features
- [ ] No major violations slipping through
- [ ] Token costs optimized (95%+ savings vs naive approach)

---

## Troubleshooting

### Issue: Agents not following architecture

**Solution:**
1. Check architecture-principles.json is valid JSON
2. Verify agent prompt includes initialization checklist
3. Add more specific verification_steps
4. Increase verification granularity

### Issue: High token costs

**Solution:**
1. Verify prompt caching enabled
2. Check cache hit rate in API headers
3. Ensure static content at prompt beginning
4. Enable context compaction

### Issue: Features marked complete but buggy

**Solution:**
1. Make QA verification_steps more thorough
2. Require end-to-end tests, not just unit tests
3. Add manual validation gate
4. Tighten clean state requirements

### Issue: Agents skipping verification steps

**Solution:**
1. Make verification_steps more explicit
2. Add "Execute ALL steps" to agent prompt
3. Require step-by-step confirmation in output
4. Add automated checking in verify-architecture.js

---

## Next Steps After Implementation

1. **Expand feature list** - Add all planned features
2. **Refine principles** - Based on real violations found
3. **Optimize costs** - Fine-tune caching and compaction
4. **Add agents** - Documentation writer, architect, etc.
5. **Automate more** - Add more checks to verify-architecture.js
6. **Document patterns** - Update architecture-patterns.json as you go

---

## Maintenance

**Weekly:**
- Review claude-progress.txt for blockers
- Check feature-requirements.json completion rate
- Monitor token costs

**Monthly:**
- Audit architecture-principles.json (add/remove/refine)
- Review git history for compliance trends
- Update agent prompts based on learnings

**Quarterly:**
- Full framework review
- Agent effectiveness assessment
- Cost optimization analysis

---

**You now have a complete long-running agentic coding framework with 100% architecture compliance and optimized token management.**
