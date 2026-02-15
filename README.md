# Long-Running Agentic Coding Framework

**Purpose:** This folder contains everything needed to BUILD a long-running, multi-agent coding framework that enforces 100% architecture compliance while managing token budgets efficiently.

**IMPORTANT:** This is FOUNDATION documentation - instructions for a new session to BUILD the framework, not the framework itself.

**Based on:** Anthropic's research on effective harnesses for long-running agents, context engineering, and prompt caching.

---

## What's In This Folder

### START HERE

1. **GETTING-STARTED.md** ⭐ ENTRY POINT FOR NEW SESSIONS
   - Quick orientation (15-30 minutes)
   - Decision tree for navigation
   - 3-step quick start
   - What to read first

### OpenSpec Integration (NEW - Highly Recommended)

2. **openspec-integration-analysis.md** (15 min read)
   - Why OpenSpec fits perfectly (Grade: A+, 95/100)
   - Complete synergy analysis
   - Integration architecture
   - **Recommendation: INTEGRATE IMMEDIATELY**
   - This fills the spec creation gap

3. **openspec-integration-guide.md** (Implementation: 2-3 days)
   - Complete OpenSpec integration setup
   - Phase 0: Installation & setup (2-3 hours)
   - Phase 1: Bridge script development (4-6 hours)
   - Phase 2: Agent prompt updates (3-4 hours)
   - Phase 3: Workflow documentation (2-3 hours)
   - Phase 4: Testing & validation (1 day)
   - Phase 5: Production deployment (1 day)

4. **WORKFLOW-WITH-OPENSPEC.md** (Reference guide)
   - Complete end-to-end workflow
   - Phase 1: Specification (OpenSpec, 15-30 min)
   - Phase 2: Architecture mapping (10-15 min)
   - Phase 3: Implementation (Dev agent, 1-2 hours)
   - Phase 4: Code review (Reviewer, 30-45 min)
   - Phase 5: QA testing (QA agent, 30-60 min)
   - Phase 6: Archive (5 min)
   - **Total: 3-5 hours per feature with full quality**

### Core Framework Documentation

5. **architecture-diagram.md** (10 min read)
   - Visual representation of entire framework
   - Persistent artifacts pattern
   - Agent ecosystem
   - Session initialization flow
   - Compliance enforcement flow
   - Token budget management
   - Git coordination workflow

6. **core-strategy.md** (30 min read)
   - Detailed multi-agent approach
   - Token management strategies
   - Compliance enforcement mechanisms
   - Complete workflow examples
   - Implementation patterns

7. **anthropic-research.md** (20 min read)
   - Latest findings from Anthropic (2025-2026)
   - Context window optimization
   - Prompt caching (90% cost reduction)
   - Context compaction (84% token reduction)
   - Extended thinking budget management
   - Multi-agent optimization

8. **implementation-guide.md** (Reference guide)
   - Phase 0: OpenSpec integration (optional but recommended)
   - Phase 1: Foundation setup (Days 1-2)
   - Phase 2: Automation scripts (Day 3)
   - Phase 3: Agent system config (Days 4-5)
   - Phase 4: Production deployment (Days 6-7)
   - Phase 5: Validation & iteration (ongoing)
   - **Total: 5-7 days base, +2-3 days with OpenSpec**

### Templates & Examples

9. **template-files/** (JSON templates)
   - `architecture-principles.json` - DRY, SOLID, DI, ERROR, TEST, DOC rules
   - `architecture-patterns.json` - Component, service, error handling patterns
   - `code-standards.json` - Language-specific conventions
   - `feature-requirements.json` - Feature tracking template

10. **agent-prompts/** (System prompts)
    - `dev-agent-prompt.md` - Developer agent (implements features)
    - `code-reviewer-prompt.md` - Code reviewer agent (verifies compliance)
    - `qa-agent-prompt.md` - QA agent (tests features + architecture)
    - `team-lead-prompt.md` - Team lead agent (orchestrates pipeline)

---

## Quick Start Paths

### Path 1: With OpenSpec Integration (Recommended)

**Best for:** Projects wanting structured spec creation + architecture enforcement

**Time:** 7-10 days total setup

1. **Understand the integration** (30 min)
   - Read `openspec-integration-analysis.md`
   - Decision: This is the right fit

2. **Understand the base framework** (45 min)
   - Read `GETTING-STARTED.md`
   - Read `architecture-diagram.md`
   - Skim `anthropic-research.md`

3. **Integrate OpenSpec** (2-3 days)
   - Follow `openspec-integration-guide.md` Phases 0-3
   - Install OpenSpec
   - Build bridge script
   - Update agent prompts
   - Test with sample feature

4. **Build base framework** (5-7 days)
   - Follow `implementation-guide.md` Phases 1-5
   - Create architecture files
   - Set up automation
   - Configure agents
   - Validate end-to-end

5. **Use the complete pipeline** (ongoing)
   - Reference `WORKFLOW-WITH-OPENSPEC.md`
   - Create specs with OpenSpec
   - Implement with agents
   - Full traceability + compliance

### Path 2: Base Framework Only (Faster Setup)

**Best for:** Projects that will write specs manually

**Time:** 5-7 days setup

1. **Understand** (45 min)
   - Read `GETTING-STARTED.md`
   - Read `architecture-diagram.md`
   - Skim `anthropic-research.md`

2. **Build** (5-7 days)
   - Follow `implementation-guide.md` Phases 1-5
   - Skip Phase 0 (OpenSpec)
   - Manual feature creation

3. **Use** (ongoing)
   - Create features manually in feature-requirements.json
   - Implement with agents
   - Architecture compliance enforced

**Note:** Can add OpenSpec later if needed

---

## Key Concepts

### Persistent Artifacts Pattern
Instead of injecting architecture rules into prompts (10,000+ tokens), store them as JSON files that agents read at session initialization (~3,000 tokens).

**Benefit:** Scales to unlimited rules without context bloat

### Session Initialization
Every agent session starts with:
1. Load context (git history, progress file)
2. Read architecture files (principles, patterns, standards)
3. Verify clean state (tests passing)
4. Select ONE feature
5. Work on it
6. Commit + handoff

### Multi-Layer Verification
100% compliance through structure:
- **Dev agent** applies principles during coding
- **Code reviewer** executes verification_steps
- **QA agent** validates feature + architecture
- **Pre-commit hooks** catch violations automatically

### Token Optimization
- **Prompt caching:** 90% cost reduction (cache architecture files)
- **Context compaction:** 84% token reduction (summarize history)
- **File-based architecture:** No prompt bloat
- **Combined:** 95% total savings vs. naive approach

### OpenSpec Integration (NEW)
- **Structured spec creation:** AI-assisted proposals, specs, design docs
- **Planning layer:** 15-30 min of thinking before coding
- **Traceability:** Business intent → Spec → Compliant code
- **Spec deltas:** See requirement evolution over time

---

## Framework Benefits

### Without OpenSpec
✅ 100% architecture compliance (DRY, SOLID, DI)
✅ 90-95% token savings
✅ Multi-agent coordination
✅ Full compliance audit trail
❌ Manual spec creation (weak point)

### With OpenSpec Integration
✅ Everything above PLUS:
✅ Structured, AI-assisted spec creation
✅ Clear requirements before coding
✅ Complete traceability (idea → spec → code)
✅ Two-layer quality (spec + architecture)
✅ Spec deltas for requirement evolution

**Recommendation:** Integrate OpenSpec for complete pipeline

---

## Success Criteria

Your framework is production-ready when:

### Base Framework
- [ ] Architecture files created (principles, patterns, standards)
- [ ] Agent prompts configured
- [ ] Session initialization working
- [ ] 3+ features completed with compliance
- [ ] Prompt caching enabled (90% savings)
- [ ] Pre-commit hooks catching violations
- [ ] Git audit trail working

### With OpenSpec Integration
- [ ] Everything above PLUS:
- [ ] OpenSpec installed and working
- [ ] Bridge script functional
- [ ] Agent prompts updated for OpenSpec
- [ ] End-to-end workflow tested
- [ ] First feature created via complete pipeline
- [ ] Workflow documented

---

## Implementation Time Estimates

| Component | Time | Complexity |
|-----------|------|------------|
| Understanding (reading) | 1-2 days | Easy |
| Base framework setup | 5-7 days | Moderate |
| OpenSpec integration | +2-3 days | Moderate |
| First production feature | 1 day | Easy |
| **Total (with OpenSpec)** | **9-13 days** | Moderate |
| **Total (without OpenSpec)** | **6-10 days** | Moderate |

**ROI:** After setup, each feature takes 3-5 hours with full quality vs. potentially weeks of rework without framework

---

## When to Use This Framework

### Perfect For
- Large codebases (50k+ lines)
- Long-running projects (months of development)
- Strict architecture requirements
- Multi-agent development teams
- Enterprise applications requiring compliance
- Teams wanting structured spec creation (with OpenSpec)

### Overkill For
- Small scripts or utilities
- Prototypes or throwaway code
- Solo projects with loose requirements
- Projects under 5k lines

---

## Support & References

### Anthropic Articles
- [Effective Harnesses for Long-Running Agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
- [Effective Context Engineering for AI Agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- [Prompt Caching Documentation](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)

### OpenSpec
- [OpenSpec Website](https://openspec.dev/)
- [OpenSpec GitHub](https://github.com/Fission-AI/OpenSpec/)

### This Framework
All strategies validated against Anthropic's published research (2025-2026)

---

## File Navigation Guide

### "I want to understand WHY this works"
→ Read: `anthropic-research.md`

### "I want to understand HOW this works"
→ Read: `architecture-diagram.md`

### "I want to BUILD this framework"
→ Read: `implementation-guide.md` (and optionally `openspec-integration-guide.md`)

### "I want to USE this framework"
→ Read: `WORKFLOW-WITH-OPENSPEC.md` (or agent prompts directly)

### "I want to understand OpenSpec integration"
→ Read: `openspec-integration-analysis.md` then `openspec-integration-guide.md`

### "I need templates"
→ Use: `template-files/` directory

### "I need agent prompts"
→ Use: `agent-prompts/` directory

---

## Next Steps

1. **Right now:** Read `GETTING-STARTED.md` (15-30 min)
2. **Next:** Read `openspec-integration-analysis.md` if considering OpenSpec (15 min)
3. **Then:** Read `architecture-diagram.md` for visual understanding (10 min)
4. **Finally:** Start `implementation-guide.md` or `openspec-integration-guide.md`

---

## Updates & Maintenance

This is FOUNDATION documentation for building the framework. Once built:
- Update architecture files as patterns emerge
- Refine agent prompts based on learnings
- Expand principles as needed
- Document lessons learned

**Remember:** This framework is a tool to build with, not restrictions. Adapt to your needs.

---

**You now have everything needed to build a complete, long-running agentic coding framework with optional OpenSpec integration for end-to-end quality from idea to compliant code.**
