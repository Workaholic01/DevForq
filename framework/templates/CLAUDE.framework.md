<!-- claude-sdlc:framework:start -->

# Claude SDLC Framework

This repository uses the Claude SDLC delivery framework.

## Commands

Run comprehensive repository discovery:

`/project-onboarding`

Refresh existing repository knowledge:

`/refresh-project-knowledge`

Deliver a requirement:

`/deliver-requirement <requirement>`

## Delivery workflow

For implementation work:

1. Analyse requirements.
2. Determine whether architecture review is needed.
3. Perform a design-time security review when architecture review occurs.
4. Implement using existing repository patterns.
5. Audit the implementation for security vulnerabilities.
6. Validate through independent QA.
7. Return security and QA failures to Development.
8. Report completion only after acceptable security audit and QA
   validation.

## Project context

Read relevant files under:

- `.claude/project-knowledge/`
- `.claude/rules/`
- `.claude/skills/stack-*/`

Do not load every knowledge file when only one is relevant.

## Safety

- Preserve unrelated uncommitted changes.
- Do not invent command results.
- Do not report a test as passed unless it was executed.
- Do not commit, push, merge or deploy unless explicitly requested.
- Do not run destructive migrations or environment resets without approval.

<!-- claude-sdlc:framework:end -->
