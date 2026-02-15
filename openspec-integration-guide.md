# OpenSpec Integration Guide

**Purpose:** Comprehensive guide for integrating OpenSpec with the Long-Running Agentic Framework

**This is a FOUNDATION document** - Instructions for a new session to BUILD the framework with OpenSpec integration, not the framework itself.

---

## Overview

This guide extends the base implementation by adding OpenSpec as the specification layer. The complete pipeline becomes:

```
OpenSpec (Spec Creation) → Architecture Mapping → Agent Implementation → Compliance Verification
```

**Read this AFTER understanding:**
- `architecture-diagram.md` (system architecture)
- `implementation-guide.md` (base framework setup)
- `openspec-integration-analysis.md` (why OpenSpec fits)

---

## Prerequisites

Before starting OpenSpec integration, you must have:

- [ ] Completed `implementation-guide.md` Phase 1 (Foundation setup)
- [ ] `architecture/` folder with principles, patterns, standards
- [ ] `feature-requirements.json` template ready
- [ ] Understanding of OpenSpec from `openspec-integration-analysis.md`

---

## Phase 0: OpenSpec Installation & Setup

**Time estimate:** 2-3 hours

### Task 0.1: Install OpenSpec

**Requirements:**
- Node.js 20.19.0 or higher

**Installation:**
```bash
# Install globally
npm install -g @fission-ai/openspec@latest

# Verify installation
openspec --version
```

**Validation:**
- [ ] OpenSpec installed successfully
- [ ] Version 1.0+ (or latest)
- [ ] `openspec` command available in terminal

---

### Task 0.2: Initialize OpenSpec in Project

**Navigate to your project root:**
```bash
cd /path/to/your-project
```

**Initialize OpenSpec:**
```bash
openspec init
```

**What this creates:**
```
your-project/
├── openspec/
│   ├── specs/          ← Spec files will go here
│   └── .openspec/      ← OpenSpec configuration
└── .openspecignore     ← Files to ignore
```

**Validation:**
- [ ] `openspec/` folder exists
- [ ] `openspec/specs/` folder exists
- [ ] `.openspecignore` file exists

---

### Task 0.3: Configure OpenSpec Settings

**Edit `.openspec/config.json` if needed:**
```json
{
  "specsDir": "openspec/specs",
  "templatesDir": "openspec/templates",
  "defaultModel": "claude-sonnet-4-5"
}
```

**Recommended settings:**
- Use high-reasoning models (Claude Opus 4.5+, GPT-5.2+)
- Keep specs organized by feature domain
- Enable version control (git)

**Validation:**
- [ ] Configuration reviewed
- [ ] Model selection appropriate
- [ ] Paths correct for your project

---

### Task 0.4: Create First Test Spec

**Purpose:** Validate OpenSpec works before full integration

**Using your AI assistant (Claude, Cursor, etc.):**
```
/opsx:new test-feature
```

**OpenSpec should create:**
```
openspec/specs/test-feature/
├── proposal.md
├── spec.md
├── design.md
└── tasks.md
```

**Review generated files:**
1. **proposal.md** - Intent and why
2. **spec.md** - Requirements and acceptance criteria
3. **design.md** - Design decisions
4. **tasks.md** - Implementation checklist

**If using `/opsx:ff` (fast-forward):**
```
/opsx:ff
```
This auto-generates all artifacts.

**Validation:**
- [ ] Test spec created successfully
- [ ] All 4 files generated
- [ ] Content is relevant and structured
- [ ] Ready to proceed with integration

---

## Phase 1: Bridge Script Development

**Time estimate:** 4-6 hours

### Task 1.1: Create Bridge Script Structure

**Purpose:** Automate conversion from OpenSpec to feature-requirements.json

**Create file:**
```bash
touch scripts/openspec-to-feature.js
chmod +x scripts/openspec-to-feature.js
```

**Basic structure:**
```javascript
#!/usr/bin/env node

/**
 * OpenSpec to Feature Bridge
 *
 * Converts OpenSpec specs to feature-requirements.json entries
 * with architecture compliance mapping.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const OPENSPEC_DIR = path.join(__dirname, '../openspec/specs');
const ARCHITECTURE_DIR = path.join(__dirname, '../architecture');
const FEATURE_FILE = path.join(ARCHITECTURE_DIR, 'feature-requirements.json');
const PRINCIPLES_FILE = path.join(ARCHITECTURE_DIR, 'architecture-principles.json');

// Main function
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: node openspec-to-feature.js <spec-name>');
    console.log('Example: node openspec-to-feature.js user-authentication');
    process.exit(1);
  }

  const specName = args[0];
  await convertSpec(specName);
}

async function convertSpec(specName) {
  console.log(`Converting OpenSpec: ${specName}`);

  // 1. Read OpenSpec files
  const spec = readOpenSpec(specName);

  // 2. Parse requirements
  const requirements = parseRequirements(spec);

  // 3. Suggest architecture mapping
  const architectureMapping = suggestArchitectureMapping(requirements);

  // 4. Generate verification steps
  const verificationSteps = generateVerificationSteps(spec, architectureMapping);

  // 5. Create feature entry
  const feature = createFeatureEntry(specName, spec, requirements, architectureMapping, verificationSteps);

  // 6. Add to feature-requirements.json
  addFeatureToFile(feature);

  console.log(`✅ Feature ${feature.id} created successfully`);
  console.log(`📝 Review and adjust in: ${FEATURE_FILE}`);
}

// Implementation functions below...

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
```

**Validation:**
- [ ] File created at `scripts/openspec-to-feature.js`
- [ ] Executable permissions set
- [ ] Basic structure in place

---

### Task 1.2: Implement OpenSpec Reader

**Add to bridge script:**

```javascript
function readOpenSpec(specName) {
  const specDir = path.join(OPENSPEC_DIR, specName);

  if (!fs.existsSync(specDir)) {
    throw new Error(`OpenSpec not found: ${specName}`);
  }

  const spec = {
    name: specName,
    proposal: readMarkdownFile(path.join(specDir, 'proposal.md')),
    spec: readMarkdownFile(path.join(specDir, 'spec.md')),
    design: readMarkdownFile(path.join(specDir, 'design.md')),
    tasks: readMarkdownFile(path.join(specDir, 'tasks.md'))
  };

  return spec;
}

function readMarkdownFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return { content: '', sections: {} };
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const sections = parseMarkdownSections(content);

  return { content, sections };
}

function parseMarkdownSections(markdown) {
  const sections = {};
  const lines = markdown.split('\n');
  let currentSection = 'header';
  let currentContent = [];

  for (const line of lines) {
    if (line.startsWith('##')) {
      // Save previous section
      if (currentContent.length > 0) {
        sections[currentSection] = currentContent.join('\n').trim();
      }
      // Start new section
      currentSection = line.replace(/^##\s+/, '').trim().toLowerCase();
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }

  // Save last section
  if (currentContent.length > 0) {
    sections[currentSection] = currentContent.join('\n').trim();
  }

  return sections;
}
```

**Validation:**
- [ ] Can read OpenSpec directories
- [ ] Parses all 4 markdown files
- [ ] Extracts sections correctly

---

### Task 1.3: Implement Requirements Parser

**Add to bridge script:**

```javascript
function parseRequirements(spec) {
  const requirements = [];

  // Parse from spec.md sections
  const specContent = spec.spec.content;

  // Look for requirements section
  if (spec.spec.sections.requirements) {
    const reqLines = spec.spec.sections.requirements.split('\n');
    for (const line of reqLines) {
      if (line.trim().startsWith('-') || line.trim().startsWith('*')) {
        const req = line.replace(/^[\-\*]\s+/, '').trim();
        if (req) requirements.push(req);
      }
    }
  }

  // Parse from tasks.md (alternative source)
  if (requirements.length === 0 && spec.tasks.content) {
    const taskLines = spec.tasks.content.split('\n');
    for (const line of taskLines) {
      if (line.trim().startsWith('- [ ]')) {
        const task = line.replace(/^-\s+\[\s*\]\s+/, '').trim();
        if (task) requirements.push(task);
      }
    }
  }

  // Parse from scenarios (Given/When/Then format)
  const scenarioMatches = specContent.match(/\*\*Given\*\*.*?\*\*Then\*\*.+/gs);
  if (scenarioMatches) {
    for (const scenario of scenarioMatches) {
      const thenMatch = scenario.match(/\*\*Then\*\*\s+(.+)/);
      if (thenMatch) {
        requirements.push(thenMatch[1].trim());
      }
    }
  }

  return requirements.length > 0 ? requirements : ['Implement feature as specified'];
}
```

**Validation:**
- [ ] Extracts requirements from spec.md
- [ ] Falls back to tasks.md if needed
- [ ] Handles scenario format (Given/When/Then)

---

### Task 1.4: Implement Architecture Mapper

**Add to bridge script:**

```javascript
function suggestArchitectureMapping(requirements) {
  // Load architecture principles
  const principles = JSON.parse(fs.readFileSync(PRINCIPLES_FILE, 'utf8')).principles;

  const suggestions = [];
  const requirementText = requirements.join(' ').toLowerCase();

  // Keyword-based mapping
  const mappings = {
    'SOLID-DIP': ['service', 'dependency', 'inject', 'interface', 'mock'],
    'DRY-001': ['reuse', 'duplicate', 'shared', 'utility', 'common'],
    'ERROR-001': ['error', 'exception', 'fail', 'handle', 'network'],
    'SOLID-SRP': ['component', 'responsibility', 'separate', 'concern'],
    'TEST-001': ['test', 'verify', 'validate', 'coverage']
  };

  for (const [principleId, keywords] of Object.entries(mappings)) {
    const matches = keywords.filter(kw => requirementText.includes(kw));
    if (matches.length > 0) {
      suggestions.push({
        principleId,
        confidence: matches.length / keywords.length,
        matchedKeywords: matches
      });
    }
  }

  // Sort by confidence
  suggestions.sort((a, b) => b.confidence - a.confidence);

  // Return top suggestions
  return suggestions.slice(0, 5).map(s => s.principleId);
}
```

**Important:** This is SUGGESTION only. Human review required.

**Validation:**
- [ ] Loads architecture-principles.json
- [ ] Keyword matching works
- [ ] Returns reasonable suggestions

---

### Task 1.5: Implement Verification Steps Generator

**Add to bridge script:**

```javascript
function generateVerificationSteps(spec, architectureMapping) {
  const steps = [];

  // 1. Functional steps from OpenSpec spec.md
  const acceptanceCriteria = extractAcceptanceCriteria(spec.spec.content);
  steps.push(...acceptanceCriteria);

  // 2. Architecture compliance steps
  const principles = JSON.parse(fs.readFileSync(PRINCIPLES_FILE, 'utf8')).principles;

  for (const principleId of architectureMapping) {
    const principle = principles.find(p => p.id === principleId);
    if (principle) {
      // Add principle name as context
      steps.push(`${principle.name}: ${principle.verification_steps[0]}`);
    }
  }

  return steps;
}

function extractAcceptanceCriteria(specContent) {
  const criteria = [];

  // Look for "Then" statements in scenarios
  const thenMatches = specContent.match(/\*\*Then\*\*\s+(.+)/g);
  if (thenMatches) {
    for (const match of thenMatches) {
      const criterion = match.replace(/\*\*Then\*\*\s+/, '').trim();
      criteria.push(criterion);
    }
  }

  // Look for acceptance criteria section
  const acceptanceSection = specContent.match(/## Acceptance Criteria\s+([\s\S]*?)(?=\n##|\n$)/i);
  if (acceptanceSection) {
    const lines = acceptanceSection[1].split('\n');
    for (const line of lines) {
      if (line.trim().startsWith('-')) {
        const criterion = line.replace(/^-\s+/, '').trim();
        if (criterion) criteria.push(criterion);
      }
    }
  }

  return criteria;
}
```

**Validation:**
- [ ] Extracts acceptance criteria from spec
- [ ] Adds architecture verification steps
- [ ] Combined steps make sense

---

### Task 1.6: Implement Feature Entry Creator

**Add to bridge script:**

```javascript
function createFeatureEntry(specName, spec, requirements, architectureMapping, verificationSteps) {
  // Generate feature ID
  const features = loadFeatures();
  const nextId = generateNextFeatureId(features);

  // Extract category from spec name or proposal
  const category = extractCategory(specName, spec.proposal.content);

  // Extract description
  const description = extractDescription(spec.spec.content, spec.proposal.content);

  return {
    id: nextId,
    category: category,
    description: description,
    status: "pending",
    depends_on: [],
    openspec_reference: `openspec/specs/${specName}/`,
    requirements: requirements,
    architecture_compliance: architectureMapping,
    verification_steps: verificationSteps,
    assigned_to: "dev-agent",
    reviewed_by: "code-reviewer",
    tested_by: "qa-agent",
    passes: false,
    notes: `Generated from OpenSpec: ${specName}\nReview architecture_compliance mapping and adjust if needed.\nSet depends_on if this feature requires other features to be complete first.`
  };
}

function generateNextFeatureId(features) {
  if (!features || features.length === 0) {
    return 'FEAT-001';
  }

  // Extract numeric part from last feature ID
  const lastId = features[features.length - 1].id;
  const match = lastId.match(/FEAT-(\d+)/);
  if (match) {
    const num = parseInt(match[1], 10) + 1;
    return `FEAT-${String(num).padStart(3, '0')}`;
  }

  return 'FEAT-001';
}

function extractCategory(specName, proposalContent) {
  // Try to extract from spec name (e.g., "auth-login" → "Authentication")
  const parts = specName.split('-');
  if (parts.length > 0) {
    return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  }

  // Try to extract from proposal
  const categoryMatch = proposalContent.match(/## Category\s+(.+)/i);
  if (categoryMatch) {
    return categoryMatch[1].trim();
  }

  return 'General';
}

function extractDescription(specContent, proposalContent) {
  // Try spec summary
  const summaryMatch = specContent.match(/## Summary\s+([\s\S]*?)(?=\n##|\n$)/i);
  if (summaryMatch) {
    return summaryMatch[1].trim().split('\n')[0];
  }

  // Try proposal intent
  const intentMatch = proposalContent.match(/## Intent\s+([\s\S]*?)(?=\n##|\n$)/i);
  if (intentMatch) {
    return intentMatch[1].trim().split('\n')[0];
  }

  return 'Feature implementation';
}
```

**Validation:**
- [ ] Generates sequential feature IDs
- [ ] Extracts category and description
- [ ] Creates complete feature entry structure

---

### Task 1.7: Implement Feature File Updater

**Add to bridge script:**

```javascript
function addFeatureToFile(feature) {
  let featuresData = loadFeatures();

  // Add new feature
  featuresData.push(feature);

  // Write back to file
  const featuresJson = {
    features: featuresData
  };

  fs.writeFileSync(
    FEATURE_FILE,
    JSON.stringify(featuresJson, null, 2),
    'utf8'
  );

  console.log(`\n✅ Feature added: ${feature.id}`);
  console.log(`📁 OpenSpec: ${feature.openspec_reference}`);
  console.log(`🏗️  Architecture: ${feature.architecture_compliance.join(', ')}`);
  console.log(`\n⚠️  REVIEW REQUIRED:`);
  console.log(`   1. Check architecture_compliance mapping`);
  console.log(`   2. Verify verification_steps are complete`);
  console.log(`   3. Adjust requirements if needed`);
  console.log(`\n📝 Edit: ${FEATURE_FILE}`);
}

function loadFeatures() {
  if (!fs.existsSync(FEATURE_FILE)) {
    return [];
  }

  const data = JSON.parse(fs.readFileSync(FEATURE_FILE, 'utf8'));
  return data.features || [];
}
```

**Validation:**
- [ ] Reads existing features
- [ ] Adds new feature
- [ ] Preserves file structure
- [ ] Provides clear output with review instructions

---

### Task 1.8: Test Bridge Script

**Create test:**
```bash
# Ensure you have a test OpenSpec
cd your-project

# Run bridge script
node scripts/openspec-to-feature.js test-feature
```

**Expected output:**
```
Converting OpenSpec: test-feature
✅ Feature added: FEAT-001
📁 OpenSpec: openspec/specs/test-feature/
🏗️  Architecture: SOLID-DIP, DRY-001

⚠️  REVIEW REQUIRED:
   1. Check architecture_compliance mapping
   2. Verify verification_steps are complete
   3. Adjust requirements if needed

📝 Edit: architecture/feature-requirements.json
```

**Verify:**
1. Open `architecture/feature-requirements.json`
2. Check new feature entry
3. Review architecture_compliance suggestions
4. Adjust if needed

**Validation:**
- [ ] Bridge script runs without errors
- [ ] Feature added to feature-requirements.json
- [ ] Structure is correct
- [ ] Ready for real use

---

### Task 1.9: Commit Bridge Script

```bash
git add scripts/openspec-to-feature.js
git commit -m "feat: add OpenSpec to feature-requirements bridge

Automation:
- Reads OpenSpec proposal, spec, design, tasks
- Parses requirements and acceptance criteria
- Suggests architecture_compliance mapping (keyword-based)
- Generates combined verification_steps (functional + architectural)
- Creates feature-requirements.json entry

Usage: node scripts/openspec-to-feature.js <spec-name>

Note: Architecture mapping is suggestion only - human review required"
```

**Update claude-progress.txt:**
```
Session X (Bridge Development):
- Created openspec-to-feature.js bridge script
- Implements OpenSpec → feature-requirements conversion
- Tested with test-feature spec
- Ready for production use
- Next: Update agent prompts to use OpenSpec references
```

---

## Phase 2: Agent Prompt Updates

**Time estimate:** 3-4 hours

### Task 2.1: Update Dev Agent Prompt

**File:** `agent-prompts/dev-agent-prompt.md`

**Add to initialization checklist (step 3):**

```markdown
### 3. Feature Context
[ ] Read `architecture/feature-requirements.json`
[ ] Identify features assigned to "dev-agent"
[ ] For assigned feature, check `openspec_reference` field
[ ] If OpenSpec reference exists:
    [ ] Read `openspec/specs/<spec-name>/spec.md` for functional requirements
    [ ] Read `openspec/specs/<spec-name>/design.md` for design decisions
    [ ] Read `openspec/specs/<spec-name>/tasks.md` for implementation guidance
[ ] Note `architecture_compliance` requirements
[ ] Select ONE feature to implement
```

**Add new section after "Implementation Process":**

```markdown
### Using OpenSpec References

When your feature has `openspec_reference` field:

**Step 1: Read OpenSpec Spec**
```bash
cat openspec/specs/<spec-name>/spec.md
```

This contains:
- Functional requirements (what to build)
- Scenarios (Given/When/Then)
- Acceptance criteria (how to verify)

**Step 2: Read Design Decisions**
```bash
cat openspec/specs/<spec-name>/design.md
```

This contains:
- Design choices made during planning
- Architecture decisions
- Technology selections

**Step 3: Combine with Architecture Requirements**

You must satisfy BOTH:
1. **OpenSpec requirements** (functional correctness)
2. **Architecture principles** (structural compliance)

Example:
- OpenSpec says: "Implement OAuth2 login"
- Architecture says: "Use SOLID-DIP (dependency injection)"
- You do: Implement OAuth2 using IAuthService interface (satisfies both)

**Step 4: Reference in Commit**

```bash
git commit -m "feat(auth): OAuth login [FEAT-003]

OpenSpec: openspec/specs/user-authentication/
- Satisfies spec.md requirements (OAuth2 flow)
- Follows design.md decisions (token storage approach)
- Implements all tasks.md items

Architecture compliance:
- ✅ SOLID-DIP: IAuthService interface used
- ✅ DRY-001: HTTPClient reused
- ✅ ERROR-001: Error handling on all API calls

Reviewed-by: pending
Tested-by: pending"
```
```

**Validation:**
- [ ] Dev agent prompt updated
- [ ] OpenSpec reading steps added
- [ ] Commit message example updated

---

### Task 2.2: Update Code Reviewer Prompt

**File:** `agent-prompts/code-reviewer-prompt.md`

**Add to review context (step 3):**

```markdown
### 3. Review Context
[ ] Read `architecture/feature-requirements.json`
[ ] Identify features with status "ready-for-review"
[ ] For selected feature:
    [ ] Check `openspec_reference` field
    [ ] If exists, read `openspec/specs/<spec-name>/spec.md`
    [ ] Understand functional requirements from OpenSpec
[ ] Note `architecture_compliance` requirements
[ ] Note `verification_steps` to execute
```

**Add new section "Two-Layer Verification":**

```markdown
## Two-Layer Verification

When feature has OpenSpec reference, verify BOTH layers:

### Layer 1: OpenSpec Compliance (Functional)

**Check against spec.md:**
- Does implementation satisfy all requirements?
- Are all scenarios (Given/When/Then) handled?
- Do acceptance criteria pass?

**Example:**
```markdown
OpenSpec spec.md says:
"Given user with valid credentials
 When they submit login
 Then they should be authenticated"

Check:
- ✅ Login function exists?
- ✅ Handles valid credentials?
- ✅ Returns authentication token?
```

### Layer 2: Architecture Compliance (Structural)

**Execute verification_steps for each principle:**

Same as before - systematic verification of SOLID-DIP, DRY-001, etc.

### Decision Matrix

| OpenSpec | Architecture | Decision |
|----------|--------------|----------|
| ✅ Pass  | ✅ Pass      | APPROVE  |
| ✅ Pass  | ❌ Fail      | REJECT (architecture violations) |
| ❌ Fail  | ✅ Pass      | REJECT (doesn't meet requirements) |
| ❌ Fail  | ❌ Fail      | REJECT (both layers failed) |

**Only approve if BOTH layers pass.**
```

**Update git notes template:**

```bash
git notes add -m "Code review: APPROVED

OpenSpec Compliance (openspec/specs/user-authentication/):
- ✅ spec.md requirements satisfied
- ✅ All scenarios handled
- ✅ Acceptance criteria met

Architecture Compliance:
- ✅ SOLID-DIP: All verification steps passed
- ✅ DRY-001: All verification steps passed

Status: APPROVED"
```

**Validation:**
- [ ] Code reviewer prompt updated
- [ ] Two-layer verification added
- [ ] Git notes template updated

---

### Task 2.3: Update QA Agent Prompt

**File:** `agent-prompts/qa-agent-prompt.md`

**Add to testing context (step 3):**

```markdown
### 3. Testing Context
[ ] Read `architecture/feature-requirements.json`
[ ] Identify features with status "approved"
[ ] For selected feature:
    [ ] Check `openspec_reference` field
    [ ] Read `openspec/specs/<spec-name>/spec.md` for test scenarios
    [ ] Extract acceptance criteria
[ ] Read feature's `verification_steps`
```

**Update testing strategies section:**

```markdown
## Testing with OpenSpec

When feature has OpenSpec reference:

### Scenario-Based Testing

OpenSpec uses Given/When/Then format:

```markdown
## Scenario: User Login

**Given** a user with email "test@example.com" and password "password123"
**When** they submit the login form
**Then** they should:
- Be authenticated
- Receive a JWT token
- Be redirected to dashboard
```

**Test each scenario:**
1. Set up "Given" conditions
2. Execute "When" action
3. Verify all "Then" outcomes

### Acceptance Criteria Validation

OpenSpec spec.md lists acceptance criteria:

```markdown
## Acceptance Criteria
- User can log in with valid credentials
- Invalid credentials show error message
- Token persists across sessions
```

**Verify each criterion:**
- [ ] Test with valid credentials → success
- [ ] Test with invalid credentials → error shown
- [ ] Close and reopen app → still logged in

### Combined Report

Report BOTH layers in git notes:

```bash
git notes append -m "QA validation: PASSED

OpenSpec Testing (openspec/specs/user-authentication/):
Scenario: User Login
- ✅ Given user with valid credentials → test user created
- ✅ When submit login form → form submitted
- ✅ Then authenticated → JWT token received
- ✅ Then redirected to dashboard → navigation confirmed

Acceptance Criteria:
- ✅ Login with valid credentials works
- ✅ Invalid credentials show error: 'Invalid email or password'
- ✅ Token persists across sessions

Architecture Validation:
- ✅ SOLID-DIP confirmed (DI pattern verified)
- ✅ DRY-001 confirmed (no duplication found)

Status: PASSED"
```
```

**Validation:**
- [ ] QA agent prompt updated
- [ ] Scenario-based testing added
- [ ] Git notes template updated

---

### Task 2.4: Update Team Lead Prompt

**File:** `agent-prompts/team-lead-prompt.md`

**Add new session type:**

```markdown
### Type 4: OpenSpec Integration Session

**Goal:** Create OpenSpec specs and map to architecture

**Process:**
1. Identify next feature to spec
2. Use OpenSpec to create spec:
   ```
   /opsx:new <feature-name>
   /opsx:ff
   ```
3. Review generated artifacts
4. Run bridge script:
   ```bash
   node scripts/openspec-to-feature.js <feature-name>
   ```
5. Review and adjust architecture_compliance mapping
6. Assign to dev-agent
7. Update claude-progress.txt

**Example:**
```bash
# 1. Create spec
/opsx:new user-profile
/opsx:ff

# 2. Review openspec/specs/user-profile/

# 3. Bridge to feature
node scripts/openspec-to-feature.js user-profile

# 4. Review architecture/feature-requirements.json
# Adjust architecture_compliance if needed

# 5. Update progress
echo "Session X: Created FEAT-004 from OpenSpec user-profile" >> claude-progress.txt
```
```

**Add to feature creation process:**

```markdown
### Feature Creation with OpenSpec

**Step 1: Create OpenSpec Spec**
```
/opsx:new <feature-name>
/opsx:ff
```

Generates:
- proposal.md
- spec.md
- design.md
- tasks.md

**Step 2: Bridge to Feature Requirements**
```bash
node scripts/openspec-to-feature.js <feature-name>
```

**Step 3: Review & Adjust**

Open `architecture/feature-requirements.json`, find new feature:
- Check `architecture_compliance` suggestions
- Adjust if needed (bridge uses keyword matching, may miss some)
- Verify `verification_steps` are complete
- Add any additional requirements

**Step 4: Commit**
```bash
git add openspec/specs/<feature-name>/
git add architecture/feature-requirements.json
git commit -m "feat: define <feature-name> spec

OpenSpec:
- Created proposal, spec, design, tasks
- Reference: openspec/specs/<feature-name>/

Feature:
- Mapped to FEAT-XXX
- Architecture compliance: [list]
- Assigned to dev-agent"
```
```

**Validation:**
- [ ] Team lead prompt updated
- [ ] OpenSpec integration session type added
- [ ] Feature creation process updated

---

## Phase 3: Workflow Documentation

**Time estimate:** 2-3 hours

### Task 3.1: Create Complete Workflow Guide

**Create:** `WORKFLOW-WITH-OPENSPEC.md`

```markdown
# Complete Workflow with OpenSpec Integration

**End-to-end process from idea to compliant code**

---

## Overview

```
Idea → OpenSpec Spec → Architecture Mapping → Dev → Review → QA → Complete
```

---

## Phase 1: Specification (OpenSpec)

**Who:** Product Owner, Team Lead, or Developer
**Time:** 15-30 minutes per feature

### Step 1: Create Spec

```bash
# In your project root
/opsx:new <feature-name>
```

Example:
```bash
/opsx:new user-authentication
```

### Step 2: Fast-Forward (Optional)

```bash
/opsx:ff
```

Generates all artifacts automatically.

Or manually create:
- `proposal.md` - Why we're building this
- `spec.md` - What we're building (requirements, scenarios)
- `design.md` - How we'll build it (design decisions)
- `tasks.md` - Implementation checklist

### Step 3: Review & Refine

Review generated files with team:
- Is the intent clear in proposal.md?
- Are requirements complete in spec.md?
- Are design decisions sound in design.md?
- Are tasks actionable in tasks.md?

Refine as needed. This is planning time - invest it wisely.

---

## Phase 2: Architecture Mapping (Human/Team Lead)

**Who:** Tech Lead, Architect, or Team Lead Agent
**Time:** 10-15 minutes per feature

### Step 1: Run Bridge Script

```bash
node scripts/openspec-to-feature.js user-authentication
```

Output:
```
✅ Feature added: FEAT-003
📁 OpenSpec: openspec/specs/user-authentication/
🏗️  Architecture: SOLID-DIP, DRY-001, ERROR-001

⚠️  REVIEW REQUIRED
```

### Step 2: Review Mapping

Open `architecture/feature-requirements.json`, find FEAT-003:

```json
{
  "id": "FEAT-003",
  "openspec_reference": "openspec/specs/user-authentication/",
  "architecture_compliance": ["SOLID-DIP", "DRY-001", "ERROR-001"],
  ...
}
```

**Questions to ask:**
- Is architecture_compliance complete? (bridge uses keyword matching)
- Should we add SOLID-SRP? SOLID-OCP?
- Are verification_steps sufficient?
- Any missing requirements?

### Step 3: Adjust & Commit

Edit as needed, then:

```bash
git add openspec/specs/user-authentication/
git add architecture/feature-requirements.json
git commit -m "feat: define user authentication feature

OpenSpec: openspec/specs/user-authentication/
Feature: FEAT-003
Architecture: SOLID-DIP, DRY-001, ERROR-001
Assigned: dev-agent"

echo "Session X: Created FEAT-003 from OpenSpec" >> claude-progress.txt
```

---

## Phase 3: Implementation (Dev Agent)

**Who:** Dev Agent
**Time:** 1-2 hours per feature (varies by complexity)

### Step 1: Session Initialization

```bash
pwd
git log --oneline -10
cat claude-progress.txt
cat architecture/architecture-principles.json
cat architecture/architecture-patterns.json
cat architecture/feature-requirements.json
```

### Step 2: Read Feature & OpenSpec

Feature FEAT-003 has:
```json
{
  "openspec_reference": "openspec/specs/user-authentication/"
}
```

Read:
```bash
cat openspec/specs/user-authentication/spec.md      # WHAT to build
cat openspec/specs/user-authentication/design.md    # HOW (design)
cat architecture/architecture-principles.json       # HOW (architecture)
```

### Step 3: Implement

Satisfy BOTH:
1. OpenSpec requirements (functional)
2. Architecture principles (structural)

### Step 4: Commit & Update

```bash
git commit -m "feat(auth): user authentication [FEAT-003]

OpenSpec: openspec/specs/user-authentication/
- OAuth2 flow implemented
- Token storage working
- Auto-refresh implemented

Architecture:
- ✅ SOLID-DIP: IAuthService interface used
- ✅ DRY-001: HTTPClient reused
- ✅ ERROR-001: All API calls have error handling

Reviewed-by: pending
Tested-by: pending"

# Update feature status
# In feature-requirements.json: "status": "ready-for-review"

echo "Session Y: Implemented FEAT-003" >> claude-progress.txt
```

---

## Phase 4: Code Review (Code Reviewer Agent)

**Who:** Code Reviewer Agent
**Time:** 30-45 minutes per feature

### Step 1: Session Initialization

(Same as dev agent)

### Step 2: Read Context

```bash
git show HEAD
cat openspec/specs/user-authentication/spec.md
cat architecture/architecture-principles.json
```

### Step 3: Two-Layer Review

**Layer 1: OpenSpec Compliance**
- Does code satisfy spec.md requirements?
- All scenarios handled?
- Acceptance criteria met?

**Layer 2: Architecture Compliance**
- Execute verification_steps for SOLID-DIP
- Execute verification_steps for DRY-001
- Execute verification_steps for ERROR-001

### Step 4: Decision & Git Notes

If BOTH layers pass:

```bash
git notes add -m "Code review: APPROVED

OpenSpec (openspec/specs/user-authentication/):
- ✅ All requirements satisfied
- ✅ All scenarios handled
- ✅ Acceptance criteria met

Architecture:
- ✅ SOLID-DIP: verified
- ✅ DRY-001: verified
- ✅ ERROR-001: verified

Status: APPROVED"

# Update: "status": "approved"
echo "Session Z: Reviewed FEAT-003 - APPROVED" >> claude-progress.txt
```

---

## Phase 5: QA Testing (QA Agent)

**Who:** QA Agent
**Time:** 30-60 minutes per feature

### Step 1: Session Initialization

(Same as previous agents)

### Step 2: Read Test Scenarios

```bash
cat openspec/specs/user-authentication/spec.md
```

Extract scenarios:
```markdown
**Given** user with valid credentials
**When** they submit login
**Then** they should be authenticated
```

### Step 3: Execute Tests

**Functional testing:**
- Test all Given/When/Then scenarios
- Verify acceptance criteria
- Test happy path + edge cases

**Architecture spot-check:**
- Quick verification of code reviewer's approval
- Confirm no obvious violations

### Step 4: Report & Update

```bash
git notes append -m "QA: PASSED

OpenSpec scenarios:
- ✅ User login scenario: PASSED
- ✅ Invalid credentials scenario: PASSED
- ✅ Token persistence scenario: PASSED

Acceptance criteria:
- ✅ All criteria validated

Architecture:
- ✅ Spot-check confirmed

Status: PASSED"

# Update: "passes": true
echo "Session W: QA FEAT-003 - PASSED" >> claude-progress.txt
```

---

## Phase 6: Archive (Optional)

**Who:** Human or Team Lead
**Time:** 5 minutes

### Archive OpenSpec

```bash
/opsx:archive user-authentication
```

This updates specs and archives proposal/tasks.

### Git History

Complete audit trail preserved:
- Commits show implementation
- Git notes show reviews
- OpenSpec reference maintained

---

## Summary: Complete Pipeline

| Phase | Who | Input | Output | Time |
|-------|-----|-------|--------|------|
| 1. Spec | Human/Team Lead | Idea | OpenSpec artifacts | 15-30min |
| 2. Map | Tech Lead | OpenSpec | feature-requirements.json | 10-15min |
| 3. Dev | Dev Agent | Spec + Architecture | Code | 1-2hr |
| 4. Review | Reviewer Agent | Code + Spec + Arch | Approval/Rejection | 30-45min |
| 5. QA | QA Agent | Code + Spec | Pass/Fail | 30-60min |
| 6. Archive | Human | Complete feature | Updated specs | 5min |

**Total: 3-5 hours per feature (varies by complexity)**

**Quality: Both well-specified AND compliant**
```

**Validation:**
- [ ] Workflow guide created
- [ ] All phases documented
- [ ] Examples included
- [ ] Time estimates provided

---

### Task 3.2: Update Main README

**Edit:** `README.md`

**Add after "Core Documentation" section:**

```markdown
### OpenSpec Integration

**NEW:** This framework now integrates with OpenSpec for specification creation.

7. **openspec-integration-analysis.md**
   - Why OpenSpec fits with this framework
   - Integration architecture
   - Synergies and benefits

8. **openspec-integration-guide.md**
   - Complete OpenSpec integration setup
   - Bridge script development
   - Agent prompt updates

9. **WORKFLOW-WITH-OPENSPEC.md**
   - End-to-end workflow with OpenSpec
   - Phase-by-phase guide
   - Complete pipeline from idea to code

**Quick Start with OpenSpec:**
1. Install OpenSpec: `npm install -g @fission-ai/openspec@latest`
2. Initialize: `openspec init`
3. Create spec: `/opsx:new <feature-name>`
4. Bridge to framework: `node scripts/openspec-to-feature.js <feature-name>`
5. Implement with agents following updated prompts
```

**Add to "Quick Start" section:**

```markdown
### Phase 0 (Optional but Recommended): OpenSpec Integration
1. Read `openspec-integration-analysis.md` (15 min)
2. Follow `openspec-integration-guide.md` Phase 0-3 (1-2 days)
3. Use `WORKFLOW-WITH-OPENSPEC.md` for complete pipeline
```

**Validation:**
- [ ] README updated with OpenSpec sections
- [ ] Quick start includes OpenSpec option
- [ ] File references correct

---

### Task 3.3: Update GETTING-STARTED

**Edit:** `GETTING-STARTED.md`

**Add to "Quick Start" section:**

```markdown
### Step 0 (NEW - Recommended): OpenSpec Integration

**If you want structured spec creation:**

1. **openspec-integration-analysis.md** (15 min) - Why integrate OpenSpec
2. **openspec-integration-guide.md** (read Phase 0) - Install and setup OpenSpec
3. **WORKFLOW-WITH-OPENSPEC.md** (skim) - See complete pipeline

**Skip if:** You'll write specs manually in feature-requirements.json
**Use if:** You want lightweight, AI-assisted spec creation
```

**Update implementation path:**

```markdown
### Phase 0 (Optional): OpenSpec Setup (1 day)
- Install OpenSpec
- Create bridge script
- Update agent prompts
- Test with sample feature

### Phase 1: Foundation (Days 1-2)
...
```

**Validation:**
- [ ] GETTING-STARTED updated
- [ ] OpenSpec presented as optional enhancement
- [ ] Implementation path updated

---

## Phase 4: Testing & Validation

**Time estimate:** 1 day

### Task 4.1: End-to-End Test

**Create real feature using complete pipeline:**

**Step 1: Create OpenSpec**
```bash
/opsx:new sample-feature
/opsx:ff
```

**Step 2: Review & Refine**
Edit generated files if needed.

**Step 3: Bridge**
```bash
node scripts/openspec-to-feature.js sample-feature
```

**Step 4: Review Mapping**
Check feature-requirements.json, adjust architecture_compliance.

**Step 5: Dev Agent**
Using `agent-prompts/dev-agent-prompt.md`, implement the feature.
Verify agent reads OpenSpec reference.

**Step 6: Code Reviewer**
Using `agent-prompts/code-reviewer-prompt.md`, review the code.
Verify two-layer verification works.

**Step 7: QA Agent**
Using `agent-prompts/qa-agent-prompt.md`, test the feature.
Verify scenario-based testing works.

**Validation Checklist:**
- [ ] OpenSpec created successfully
- [ ] Bridge script worked
- [ ] Dev agent read OpenSpec and implemented
- [ ] Code reviewer verified both layers
- [ ] QA tested against scenarios
- [ ] Complete audit trail in git
- [ ] feature-requirements.json updated correctly

---

### Task 4.2: Document Issues & Refinements

**During testing, document:**
- Any bridge script issues (parsing failures, etc.)
- Agent prompt clarifications needed
- Workflow friction points
- Missing documentation

**Create refinements list:**
```markdown
# Refinements Needed

## Bridge Script
- [ ] Issue 1: [description]
- [ ] Issue 2: [description]

## Agent Prompts
- [ ] Dev agent: [clarification needed]
- [ ] Code reviewer: [clarification needed]

## Workflow
- [ ] Friction point: [description]

## Documentation
- [ ] Missing: [what's missing]
```

**Fix issues before marking complete.**

---

### Task 4.3: Create Integration Checklist

**Create:** `OPENSPEC-INTEGRATION-CHECKLIST.md`

```markdown
# OpenSpec Integration Checklist

Use this to verify your integration is complete and working.

## Installation & Setup
- [ ] OpenSpec installed (`npm install -g @fission-ai/openspec@latest`)
- [ ] Project initialized (`openspec init`)
- [ ] `openspec/` folder exists
- [ ] Test spec created successfully

## Bridge Script
- [ ] `scripts/openspec-to-feature.js` exists
- [ ] Script is executable
- [ ] Reads OpenSpec files correctly
- [ ] Parses requirements accurately
- [ ] Suggests architecture mapping
- [ ] Generates verification steps
- [ ] Creates feature entries
- [ ] Updates feature-requirements.json
- [ ] Provides clear output with review instructions

## Agent Prompts Updated
- [ ] `agent-prompts/dev-agent-prompt.md` includes OpenSpec reading
- [ ] `agent-prompts/code-reviewer-prompt.md` includes two-layer verification
- [ ] `agent-prompts/qa-agent-prompt.md` includes scenario-based testing
- [ ] `agent-prompts/team-lead-prompt.md` includes OpenSpec integration session

## Workflow Documentation
- [ ] `WORKFLOW-WITH-OPENSPEC.md` created
- [ ] `README.md` updated with OpenSpec sections
- [ ] `GETTING-STARTED.md` updated with OpenSpec option
- [ ] `openspec-integration-analysis.md` available for reference

## End-to-End Test
- [ ] Created test feature with OpenSpec
- [ ] Bridged to feature-requirements.json
- [ ] Dev agent implemented using OpenSpec reference
- [ ] Code reviewer verified both layers
- [ ] QA tested against scenarios
- [ ] Complete audit trail in git

## Production Ready
- [ ] All documentation complete
- [ ] All scripts working
- [ ] All agents updated
- [ ] Test feature completed successfully
- [ ] Team understands workflow
- [ ] Ready for real features

## Next Steps
- [ ] Create first production feature with OpenSpec
- [ ] Monitor for issues
- [ ] Refine based on feedback
- [ ] Document lessons learned
```

**Validation:**
- [ ] Checklist created
- [ ] All items clear and testable
- [ ] Ready for use

---

## Phase 5: Production Deployment

**Time estimate:** 1 day

### Task 5.1: Update Project Documentation

**Create or update:** `DEVELOPMENT.md` in your project

```markdown
# Development Workflow

## Creating New Features

### With OpenSpec (Recommended)

1. **Create Specification**
   ```
   /opsx:new <feature-name>
   /opsx:ff
   ```

2. **Review & Refine**
   - Edit `openspec/specs/<feature-name>/spec.md`
   - Ensure requirements are clear and testable

3. **Map to Architecture**
   ```bash
   node scripts/openspec-to-feature.js <feature-name>
   ```

4. **Review Mapping**
   - Open `architecture/feature-requirements.json`
   - Find new feature (FEAT-XXX)
   - Verify `architecture_compliance` is complete
   - Adjust if needed

5. **Commit Spec**
   ```bash
   git add openspec/ architecture/
   git commit -m "feat: define <feature-name> spec"
   ```

6. **Implement with Agents**
   - Dev agent implements (reads OpenSpec + architecture)
   - Code reviewer verifies (two-layer: spec + architecture)
   - QA tests (scenarios + compliance)

### Without OpenSpec

1. Manually create entry in `architecture/feature-requirements.json`
2. Follow standard agent workflow

## For Developers

See `WORKFLOW-WITH-OPENSPEC.md` for complete pipeline.

## For Reviewers

Check both:
1. OpenSpec spec.md requirements (functional)
2. Architecture principles (structural)

See `agent-prompts/code-reviewer-prompt.md`

## For QA

Test both:
1. OpenSpec scenarios (functional)
2. Architecture compliance (spot-check)

See `agent-prompts/qa-agent-prompt.md`
```

**Validation:**
- [ ] DEVELOPMENT.md created/updated
- [ ] Workflow documented
- [ ] References correct files

---

### Task 5.2: Team Training (If Applicable)

**If working with a team:**

1. **Share documentation:**
   - WORKFLOW-WITH-OPENSPEC.md
   - openspec-integration-analysis.md
   - Agent prompts

2. **Walkthrough:**
   - Show complete pipeline with example
   - Demonstrate bridge script
   - Review agent workflows

3. **Q&A:**
   - Answer questions
   - Clarify any confusion
   - Document additional FAQ

**Validation:**
- [ ] Team understands workflow
- [ ] Everyone knows their role
- [ ] Questions answered

---

### Task 5.3: Create First Production Feature

**Choose a real feature:**
- Not too complex (3-5 requirements)
- Representative of typical work
- Good test of complete pipeline

**Execute complete workflow:**
1. OpenSpec spec creation
2. Architecture mapping
3. Dev implementation
4. Code review
5. QA testing
6. Archive

**Monitor:**
- Time taken at each phase
- Issues encountered
- Quality of output
- Team feedback

**Document results:**
```markdown
# First Production Feature Results

Feature: [name]
OpenSpec: openspec/specs/[name]/

## Metrics
- Spec creation time: X min
- Architecture mapping: Y min
- Implementation: Z hours
- Code review: W min
- QA testing: V min
- Total: N hours

## Issues
- [List any issues]

## What Worked Well
- [List successes]

## Improvements Needed
- [List refinements]

## Next Steps
- [Action items]
```

**Validation:**
- [ ] Production feature completed
- [ ] Results documented
- [ ] Lessons learned captured
- [ ] Ready to scale

---

## Success Criteria

Your OpenSpec integration is production-ready when:

- [ ] OpenSpec installed and working
- [ ] Bridge script functional and tested
- [ ] All agent prompts updated
- [ ] Workflow documentation complete
- [ ] End-to-end test successful
- [ ] First production feature completed
- [ ] Team trained (if applicable)
- [ ] Integration checklist 100% complete
- [ ] No blocking issues
- [ ] Ready for regular use

**Time Investment:** 2-3 weeks
**Value Add:** Complete spec → compliant code pipeline
**ROI:** Better requirements + guaranteed compliance = higher quality

---

## Maintenance & Evolution

### Weekly
- Review OpenSpec specs for clarity
- Check bridge script suggestions accuracy
- Gather agent feedback on OpenSpec references

### Monthly
- Audit feature-requirements.json accuracy
- Review architecture mapping patterns
- Update bridge script keyword mappings if needed

### Quarterly
- Assess OpenSpec adoption rate
- Measure quality improvements
- Refine workflow based on learnings
- Update documentation

---

## Troubleshooting

### Issue: Bridge script suggests wrong architecture principles

**Cause:** Keyword matching is imperfect

**Solution:**
1. Review and adjust manually (always required)
2. Update keyword mappings in bridge script
3. Consider adding ML-based mapping (future enhancement)

### Issue: Agents not reading OpenSpec references

**Cause:** Prompts not updated or unclear

**Solution:**
1. Verify agent prompts include OpenSpec reading steps
2. Check `openspec_reference` field exists in feature
3. Ensure OpenSpec files exist at referenced path

### Issue: Two-layer verification too time-consuming

**Cause:** Process overhead

**Solution:**
1. OpenSpec layer is quick (acceptance criteria)
2. Architecture layer already required (no new cost)
3. Combined they prevent rework (net time savings)

### Issue: OpenSpec and architecture requirements conflict

**Cause:** Planning vs. architecture mismatch

**Solution:**
1. Raise during architecture mapping phase
2. Adjust OpenSpec spec or architecture requirements
3. Resolve before dev agent starts
4. Document decision in design.md

---

## Summary

**OpenSpec Integration provides:**
- ✅ Structured spec creation (15-30 min per feature)
- ✅ Clear requirements before coding
- ✅ Bridge to architecture enforcement
- ✅ Two-layer quality gates
- ✅ Complete traceability

**Implementation cost:** 2-3 weeks
**Ongoing cost:** ~5-10 min per feature (mapping)
**Value:** Significantly higher quality, fewer revisions

**You now have a complete pipeline from idea to compliant code with full traceability.**
