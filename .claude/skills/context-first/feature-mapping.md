# Feature → Document Mapping Reference

This document helps quickly identify which design documents contain information about specific features.

**Project Docs Location:** `/Users/fugen/codes/happy/docs/`

## Core Design Documents

### 1. core-user-experience-v2.md
**Coverage:** Most user-facing features and workflows

Key sections likely include:
- Authentication & Login (OAuth, Logto)
- Messaging & Conversations
- Terminal Integration
- Workspace Management (Zen Mode, Boxes)
- Session Management
- User Interface Patterns
- Navigation & Routing

**When to read:** Almost always start here for any feature-related task.

---

### 2. architecture.md
**Coverage:** System architecture and technical design

Key sections likely include:
- Component Structure (Client, Server, Shared)
- Happy Server Integration
- Synchronization Architecture
- Data Flow
- API Design
- Technology Stack Decisions

**When to read:** For architectural questions, system-level changes, or understanding component interactions.

---

### 3. prd.md
**Coverage:** Product requirements and feature list

Key sections likely include:
- Feature List
- Product Goals
- Use Cases & Scenarios
- User Stories
- Success Criteria

**When to read:** For understanding "what" features exist and "why" they're needed.

---

### 4. white-paper.md
**Coverage:** Project vision and philosophy

Key sections likely include:
- Project Vision
- Core Values & Principles
- Long-term Goals
- Design Philosophy

**When to read:** For understanding high-level direction and decision-making principles.

---

## Feature Domain Mapping

### Authentication & Identity

**Keywords:** OAuth, authentication, login, sign in, Logto, auth, SSO, identity, token, 登录, 认证

**Primary Documents:**
1. `design/core-user-experience-v2.md` - Authentication UX flow
2. `implementation/logto-web-oauth-setup.md` - OAuth implementation details
3. `research/authentication-system-analysis.md` - Why Logto was chosen

**Quick Search:**
```bash
grep -rn "oauth\|authentication\|logto" docs/design/
```

---

### Synchronization

**Keywords:** sync, synchronization, Happy Server, upstream, conflict resolution, offline, 同步

**Primary Documents:**
1. `design/architecture.md` - Sync architecture
2. `design/core-user-experience-v2.md` - Sync UX behavior
3. `research/authentication-system-analysis.md` - Happy Server integration

**Quick Search:**
```bash
grep -rn "sync\|happy.*server\|upstream" docs/design/
```

---

### Messaging & Communication

**Keywords:** message, messaging, chat, conversation, inbox, thread, reply, 消息, 聊天

**Primary Documents:**
1. `design/core-user-experience-v2.md` - Messaging UX
2. `design/prd.md` - Messaging requirements

**Quick Search:**
```bash
grep -rn "messag\|chat\|conversation" docs/design/
```

---

### Terminal Integration

**Keywords:** terminal, command, shell, CLI, execute, REPL, 终端, 命令

**Primary Documents:**
1. `design/core-user-experience-v2.md` - Terminal UX integration
2. `design/prd.md` - Terminal features

**Quick Search:**
```bash
grep -rn "terminal\|command\|shell" docs/design/
```

---

### Workspace & Sessions

**Keywords:** zen mode, boxes, workspace, session, project, context, 工作区, 会话

**Primary Documents:**
1. `design/core-user-experience-v2.md` - Workspace design
2. `design/prd.md` - Workspace requirements

**Quick Search:**
```bash
grep -rn "zen\|box\|workspace\|session" docs/design/
```

---

### Architecture & System Design

**Keywords:** architecture, system, components, modules, structure, technology stack, 架构

**Primary Documents:**
1. `design/architecture.md` - Complete system architecture
2. `design/core-user-experience-v2.md` - User-facing architecture implications

**Quick Search:**
```bash
grep -rn "architect\|component\|module\|system" docs/design/
```

---

### Product & Requirements

**Keywords:** product, features, requirements, roadmap, goals, vision, 产品, 需求

**Primary Documents:**
1. `design/prd.md` - Product requirements
2. `design/white-paper.md` - Product vision
3. `design/core-user-experience-v2.md` - Feature descriptions

**Quick Search:**
```bash
grep -rn "feature\|requirement\|goal" docs/design/
```

---

## Implementation Documents

Located in: `docs/implementation/`

These documents contain technical implementation details and setup guides:

- `logto-web-oauth-setup.md` - OAuth implementation
- `zero-modification-solution.md` - Zero-modification principle in practice
- `provider-integration-guide.md` - Integration patterns
- And others...

**When to read:** After understanding the design, when you need technical implementation details.

---

## Research Documents

Located in: `docs/research/`

Background research that informed design decisions:

- `authentication-system-analysis.md` - Auth system research
- `web-integration-analysis.md` - Web integration considerations
- `chinamobile-integration-guide.md` - Specific integration research
- And others...

**When to read:** When you need to understand "why" a technology or approach was chosen.

---

## Verification Documents

Located in: `docs/verification/`

Test scenarios and acceptance criteria:

- `guide.md` - Verification guidelines
- `results.md` - Test results
- And others...

**When to read:** When implementing tests or verifying feature completeness.

---

## Search Strategies

### Strategy 1: Keyword Search (Fastest)
```bash
# Search all design docs
grep -rn "keyword" docs/design/

# Search with multiple keywords
grep -rn "oauth\|authentication" docs/design/

# Case-insensitive search
grep -rin "keyword" docs/design/
```

### Strategy 2: File Listing
```bash
# List all design docs
ls -la docs/design/

# List all docs
find docs/ -name "*.md"
```

### Strategy 3: Progressive Loading
1. Start with `core-user-experience-v2.md` (covers most features)
2. Check `architecture.md` if system-level
3. Check `prd.md` for requirements context
4. Check implementation docs for technical details
5. Check research docs for rationale

---

## Tips

1. **Start broad, then narrow:** Read `core-user-experience-v2.md` first, then dive into specific docs.

2. **Use grep liberally:** Don't guess which doc has the info—search for it.

3. **Read related sections:** Design decisions are often interconnected.

4. **Check timestamps:** Use `ls -lt docs/design/` to see recently updated docs.

5. **When in doubt, read more:** Over-loading context is better than missing critical details.

6. **Update this mapping:** If you discover new patterns, update this document.

---

## Common Patterns

**Pattern 1: Feature Implementation**
```
User wants to implement Feature X
→ Read design/core-user-experience-v2.md (what/why)
→ Read implementation/[related].md (how)
→ Proceed with implementation
```

**Pattern 2: Bug Fix**
```
User reports bug with Feature Y
→ Read design/core-user-experience-v2.md (expected behavior)
→ Read implementation/[related].md (current implementation)
→ Identify gap and fix
```

**Pattern 3: Architectural Question**
```
User asks "how does X work?"
→ Read design/architecture.md (system view)
→ Read design/core-user-experience-v2.md (user view)
→ Explain with both perspectives
```

**Pattern 4: New Feature Proposal**
```
User proposes "can we add Z?"
→ Read design/prd.md (does it fit product goals?)
→ Read design/architecture.md (is it compatible?)
→ Read design/white-paper.md (aligns with vision?)
→ Provide informed answer
```
