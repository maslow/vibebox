# Architecture Decision Records (ADR)

**Tags:** #decision:index #documentation:adr #phase:document

This directory contains Architecture Decision Records (ADRs) for the Happy VibeBox project.

## What is an ADR?

An Architecture Decision Record (ADR) is a document that captures an important architectural decision made along with its context and consequences.

## ADR Format

Each ADR follows this structure:

- **Status**: Proposed | Accepted | Deprecated | Superseded
- **Date**: When the decision was made
- **Deciders**: Who made the decision
- **Context**: The problem statement and background
- **Decision Drivers**: Factors influencing the decision
- **Considered Options**: Alternative approaches evaluated
- **Decision Outcome**: The chosen option and rationale
- **Consequences**: Positive and negative outcomes
- **Implementation Plan**: How to execute the decision

## ADR Index

### Active Decisions

1. [001 - Client Technology Stack Selection](./001-client-technology-stack.md) (2025-10-22)
   - **Decision**: Use Expo/React Native for client + Next.js for backend
   - **Rationale**: Mobile-first positioning, three-platform unity, deep customization capability
   - **Status**: Accepted

2. [002 - Authentication Solution Selection](./002-authentication-solution.md) (2025-10-22)
   - **Decision**: Use Logto for authentication and authorization
   - **Rationale**: Open-source, mobile-first native SDK, standard OIDC/OAuth protocols, cost-effective
   - **Status**: Accepted

### Proposed Decisions

None currently.

### Deprecated Decisions

None currently.

## Creating a New ADR

When making a significant architectural decision:

1. Create a new file: `NNN-short-title.md` (where NNN is the next number)
2. Use the template from existing ADRs
3. Fill in all sections with thorough analysis
4. Update this README index
5. Get review from stakeholders
6. Mark as "Accepted" when finalized

## Principles

- **Document significant decisions**: Only architectural decisions that impact the project structure, technology stack, or major design patterns
- **Be thorough**: Include context, alternatives, and reasoning
- **Keep it real**: Document both pros and cons honestly
- **Update when needed**: If a decision changes, create a new ADR superseding the old one

## Related Documentation

- [Design Documents](../design/) - Product requirements and vision
- [Research Documents](../research/) - Technical investigation and analysis
- [Implementation Plans](../implementation/) - How to build the system
- [Verification Documents](../verification/) - Validation of technical approaches
