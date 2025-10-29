# upstream/ Directory

This directory contains reference copies of the official [Happy](https://github.com/ex3ndr/happy) repositories for AI-assisted development context. **NOT committed to git**.

**Tags:** #upstream #happy #integration #zero-modification #fork-base #reference

---

## 📊 Version Tracking

Current versions tracked in this directory:

| Repository | Commit SHA | Date | Message | Status |
|-----------|------------|------|---------|--------|
| **happy-client** | `503b1981b75a28dae7d0bfa20908974bfb3b84a6` | 2025-10-03 | Merge PR #151 (claude-sonnet-4-5) | **Fork base for VibeBox** |
| **happy-server** | `5ba780c8a2bdf16ed23a37d39359f6a2a5b8d2e5` | 2025-09-21 | fix: put -> post | Reference only |
| **happy-cli** | `4a9ba96d76dac9cd2c65b3988f35e92f045cc42c` | 2025-10-12 | Release version 0.11.2 | Reference only |

**VibeBox Integration:**
- **Client**: Forked from happy-client `503b1981...` with commercial customizations
- **Server**: Uses official Docker image `ghcr.io/slopus/happy-server`
- **CLI**: Uses official npm package `happy-coder`

---

## 🚀 Setup

Clone these repositories for AI analysis and context:

```bash
# From project root
cd upstream/

# Clone repositories
git clone https://github.com/slopus/happy.git happy-client
git clone https://github.com/slopus/happy-server.git happy-server
git clone https://github.com/slopus/happy-cli.git happy-cli

# Checkout tracked versions
cd happy-client && git checkout 503b1981b75a28dae7d0bfa20908974bfb3b84a6 && cd ..
cd happy-server && git checkout 5ba780c8a2bdf16ed23a37d39359f6a2a5b8d2e5 && cd ..
cd happy-cli && git checkout 4a9ba96d76dac9cd2c65b3988f35e92f045cc42c && cd ..
```

---

## 🎯 Purpose

**For AI Sessions:**
- Analyze upstream changes since last tracked version
- Evaluate whether to sync and test new updates
- Understand Happy's implementation for integration decisions

**Note:** AI will inspect these files for context when needed. Do not manually sync without evaluation.

---

## 📖 Related Documentation

**Integration Strategy:**
- [`docs/implementation/zero-modification-solution.md`](../docs/implementation/zero-modification-solution.md) - Zero-modification integration approach
- [`CLAUDE.md`](../CLAUDE.md) - Core development philosophy

**Architecture:**
- [`docs/design/architecture.md`](../docs/design/architecture.md) - System architecture
- [`docs/design/prd.md`](../docs/design/prd.md) - Product requirements

---

**Last Updated**: 2025-10-29
**Maintained By**: VibeBox Development Team
