# Getting Started with Long-Running Agentic Framework

**For a new Claude session reading this for the first time**

---

## What is this folder?

This folder contains a complete framework for building large-scale applications using multiple AI agents that:
- Work together across many sessions
- Enforce 100% architecture compliance (DRY, SOLID, DI, etc.)
- Manage token budgets efficiently (90%+ savings)
- Coordinate via persistent artifacts and git

Think of it as a "software engineering team in a box" where each agent has a specialized role (developer, code reviewer, QA, etc.) and they all follow strict architecture rules.

---

## Quick Start: 3 Steps

### Step 1: Understand the System (15 minutes)

**Read these files in this order:**

1. **README.md** (5 min) - Overview of what's included
2. **architecture-diagram.md** (10 min) - Visual representation of how everything works

After reading these, you'll understand:
- How persistent artifacts save tokens
- How agents coordinate via git
- How compliance is enforced (verification steps)
- How the session initialization pattern works

### Step 2: Deep Dive (30 minutes)

**Read these for implementation details:**

3. **anthropic-research.md** (15 min) - Scientific basis from Anthropic
   - Why this approach works
   - Token optimization techniques
   - Prompt caching (90% savings)
   - Context compaction (84% savings)

4. **implementation-guide.md** (15 min) - Step-by-step build instructions
   - 5 phases from foundation to production
   - Validation checkpoints
   - Troubleshooting guide

### Step 3: Start Building (Follow Implementation Guide)

**Use templates and prompts:**

5. **template-files/** - JSON templates for architecture files
   - architecture-principles.json
   - architecture-patterns.json
   - code-standards.json
   - feature-requirements.json

6. **agent-prompts/** - System prompts for each agent
   - dev-agent-prompt.md
   - code-reviewer-prompt.md
   - qa-agent-prompt.md
   - team-lead-prompt.md

---

## What Will You Build?

By following the implementation guide, you'll create:

```
your-project/
├── architecture/
│   ├── architecture-principles.json    ← DRY, SOLID, DI rules
│   ├── architecture-patterns.json      ← Code structure patterns
│   ├── code-standards.json             ← Language conventions
│   └── feature-requirements.json       ← Feature tracking
├── scripts/
│   ├── init.sh                         ← Session initialization
│   └── verify-architecture.js          ← Automated compliance checking
├── claude-progress.txt                 ← Session history
└── .git/                               ← Coordination via commits + notes
```

---

## Core Concepts to Understand

### 1. Persistent Artifacts Pattern

**Problem:** Putting architecture rules in prompts consumes 10,000+ tokens

**Solution:** Store rules in JSON files, agents read them at session start (~3,000 tokens)

**Benefit:** Scales to unlimited rules without bloating context

### 2. Session Initialization

Every agent, every session:
1. Load context (git, progress file)
2. Read architecture files (principles, patterns, standards)
3. Verify clean state (tests passing)
4. Select ONE feature
5. Work on it
6. Commit + handoff

### 3. Multi-Layer Verification

100% compliance through structure, not hope:
- **Dev agent** applies principles during coding
- **Code reviewer** executes verification_steps
- **QA agent** validates feature + architecture
- **Pre-commit hooks** catch violations automatically

### 4. Token Optimization

- **Prompt caching:** 90% cost reduction (cache architecture files)
- **Context compaction:** 84% token reduction (summarize history)
- **File-based architecture:** No prompt bloat
- **Combined:** 95% total savings

---

## Your Implementation Path

### Phase 1: Foundation (Days 1-2)
- Create folder structure
- Write architecture JSON files (using templates)
- Create init.sh script
- Initial git commit

### Phase 2: Automation (Day 3)
- Create verify-architecture.js
- Set up pre-commit hooks
- Test violation detection

### Phase 3: Agent System (Days 4-5)
- Configure agent prompts (using templates)
- Test dev → reviewer → QA workflow
- Validate with simple feature

### Phase 4: Production (Days 6-7)
- Define real features
- Enable prompt caching
- Configure context compaction
- Full workflow validation

### Phase 5: Scale (Ongoing)
- Add more features
- Refine principles based on violations found
- Optimize costs
- Expand agent team if needed

---

## Key Files Reference

### For Understanding
- **README.md** - Overview and navigation
- **architecture-diagram.md** - Visual system architecture
- **anthropic-research.md** - Scientific foundation
- **core-strategy.md** - Detailed strategy explanation

### For Implementation
- **implementation-guide.md** - Step-by-step instructions
- **template-files/** - Starting point JSON files
- **agent-prompts/** - Agent system prompts

---

## Decision Tree: Where Should I Start?

**"I want to understand HOW this works"**
→ Read: architecture-diagram.md

**"I want to understand WHY this works"**
→ Read: anthropic-research.md

**"I want to BUILD this for my project"**
→ Read: implementation-guide.md, then use templates

**"I want to see a specific agent's behavior"**
→ Read: agent-prompts/[agent-name]-prompt.md

**"I want to understand token optimization"**
→ Read: anthropic-research.md sections 3-5

**"I need troubleshooting help"**
→ Read: implementation-guide.md "Troubleshooting" section

---

## Example: Minimal Working System

**Fastest path to working framework (1 day):**

1. **Setup (30 min)**
   - Create architecture/ folder
   - Copy template-files/*.json to architecture/
   - Customize for your project
   - Create claude-progress.txt

2. **First Feature (2 hours)**
   - Add FEAT-001 to feature-requirements.json
   - Use dev-agent-prompt.md to implement
   - Use code-reviewer-prompt.md to review
   - Use qa-agent-prompt.md to test

3. **Validation (1 hour)**
   - Did feature get implemented correctly?
   - Did code reviewer catch violations?
   - Did QA validate it works?
   - Is git history showing compliance?

If all YES → framework is working!

---

## Success Indicators

You'll know it's working when:

✅ Agents read architecture files at session start
✅ Code reviewer executes all verification_steps
✅ QA validates both feature AND architecture
✅ Git history shows compliance audit trail
✅ Prompt caching shows 90% cost savings
✅ No violations slip through to production
✅ Features complete faster (no rework)

---

## Common Questions

**Q: Is this overkill for my small project?**
A: Yes, if under 5k lines. Use for large codebases (50k+ lines) or strict compliance requirements.

**Q: Can I use fewer agents?**
A: Yes, minimum is dev + code-reviewer + QA. Add others as needed.

**Q: Do I need to use all the architecture principles?**
A: No, customize architecture-principles.json for your needs. Start with 5-10 core principles.

**Q: How much does this save in tokens/cost?**
A: 90% with prompt caching, 84% with context compaction, ~95% combined vs. naive approach.

**Q: What if code reviewer is too strict?**
A: Adjust verification_steps in architecture-principles.json. Make them as strict or loose as you want.

---

## Next Steps

1. **Right now:** Read architecture-diagram.md (10 min)
2. **Next:** Read implementation-guide.md Phase 1 (15 min)
3. **Then:** Copy template files and customize (30 min)
4. **Finally:** Run first dev agent session (1 hour)

---

## Need Help?

**For understanding concepts:**
- architecture-diagram.md has visual explanations
- core-strategy.md has detailed examples
- anthropic-research.md has scientific backing

**For implementation issues:**
- implementation-guide.md has troubleshooting section
- agent-prompts/ have example sessions
- template-files/ show working examples

**For optimization:**
- anthropic-research.md sections on caching/compaction
- implementation-guide.md Phase 4 on production deployment

---

**You're ready to build. Start with architecture-diagram.md and implementation-guide.md.**
