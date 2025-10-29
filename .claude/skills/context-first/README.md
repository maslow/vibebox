# Context-First Skill

**Core Principle:** Load design context before taking action.

## What Is This Skill?

This skill ensures that Claude reads relevant design documents before working on any task related to project features. It prevents:
- ❌ Reinventing existing solutions
- ❌ Violating architectural constraints
- ❌ Misunderstanding requirements
- ❌ Rework due to missing context

And enables:
- ✅ Context-aware implementation
- ✅ Design-aligned decisions
- ✅ Faster development (no backtracking)
- ✅ Knowledge sharing across conversations

## When Does It Activate?

This skill automatically activates when you mention:

### Implementation Tasks
- "实现 OAuth 登录"
- "添加消息功能"
- "修复同步问题"
- "Implement X feature"

### Discussion Tasks
- "OAuth 流程是怎么设计的？"
- "为什么要用 Logto？"
- "How does sync work?"

### Documentation Tasks
- "更新 OAuth 文档"
- "写一个用户指南"
- "Update feature documentation"

### Decision Tasks
- "可以添加第三方登录吗？"
- "这个改动合适吗？"
- "Should we add feature Y?"

## How It Works

```
User: "实现 OAuth 登录的记住我功能"
  ↓
Skill activates
  ↓
Searches for relevant docs
  ↓
Finds and reads:
  - docs/design/core-user-experience-v2.md
  - docs/implementation/logto-web-oauth-setup.md
  ↓
Summarizes key design decisions
  ↓
Proceeds with implementation (with full context)
```

## Files in This Skill

```
context-first/
├── SKILL.md              # Main skill logic and workflow
├── feature-mapping.md    # Quick reference: feature → document mapping
├── README.md            # This file
└── scripts/
    └── find-docs.sh     # Helper script to search docs by keyword
```

## Using the Helper Script

You can manually search for relevant documents:

```bash
# From project root
./.claude/skills/context-first/scripts/find-docs.sh oauth

# Search with multiple keywords
./.claude/skills/context-first/scripts/find-docs.sh "sync|happy server"
```

## Feature → Document Quick Reference

| Feature | Primary Documents |
|---------|-------------------|
| OAuth, Authentication | core-user-experience-v2.md, logto-web-oauth-setup.md |
| Sync, Happy Server | architecture.md, authentication-system-analysis.md |
| Messaging, Chat | core-user-experience-v2.md, prd.md |
| Terminal | core-user-experience-v2.md |
| Zen Mode, Workspace | core-user-experience-v2.md |
| Architecture | architecture.md |
| Product Overview | prd.md, white-paper.md |

**Pro Tip:** `core-user-experience-v2.md` covers most features—start there when in doubt.

## Benefits

### For Single Conversations
- Skip the "let me read the design doc first" reminder
- Automatic context loading saves time
- Consistent approach across all tasks

### For Multi-Conversation Projects
- New AI conversations start with design context
- No need to re-explain architecture every time
- Design decisions preserved across sessions

### For Teams
- Ensures everyone (human & AI) follows documented design
- Reduces "creative" solutions that violate architecture
- Maintains design consistency

## Examples

### Example 1: Found Design Context ✅
```
User: 实现 OAuth 登录

🔍 Context Loaded

I found and read:
- docs/design/core-user-experience-v2.md (Authentication section)
- docs/implementation/logto-web-oauth-setup.md

📋 Key Design Decisions:
- Use Logto SDK (Zero Modification principle)
- Full-page redirect (not popup)
- Tokens managed by Logto

✅ Ready to implement following these constraints.
```

### Example 2: Missing Design Context ⚠️
```
User: 添加语音通话功能

⚠️ Design Context Missing

I couldn't find design documentation for voice calls.

This is a new feature that needs design docs first.

Recommendation: Use three-doc-method skill to create:
- Design document
- Implementation plan
- Verification document

Should I help you create these?
```

## Related Skills

- **three-doc-method** - Create design documents for new features
- **e2e-test-runner** - Run tests after implementation

## Maintenance

### Updating Feature Mappings

If you add new design documents or features, update:
1. `SKILL.md` - Add keywords to trigger description
2. `feature-mapping.md` - Add feature → document mapping

### Testing the Skill

Try these phrases to verify it activates:
- "实现 OAuth 功能"
- "修改同步机制"
- "OAuth 是怎么设计的？"
- "Can we add feature X?"

If it doesn't activate, check:
- Trigger keywords in SKILL.md description
- Claude Code skill loading (restart if needed)

## Philosophy

This skill embodies the project's core principle:

> **Context > Assumptions**
>
> Never implement without understanding the design intent.

It aligns with the AI collaboration methodology defined in CLAUDE.md:
- **Convention over Documentation** - Predictable doc structure
- **Code as Truth** - But design docs explain the "why"
- **Structure as Navigation** - Docs organized by purpose
