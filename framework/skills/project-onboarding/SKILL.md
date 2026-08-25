---
name: project-onboarding
description: Perform comprehensive initial repository discovery and generate persistent project knowledge and repository-specific technology skills.
disable-model-invocation: true
---

# Project Onboarding

Perform a comprehensive, evidence-based analysis of the repository.

Do not modify production source code.

## 1. Preflight

- Confirm the current working directory is inside the intended repository.
- Inspect Git status.
- Record the current branch and commit.
- Preserve existing uncommitted changes.
- Do not read secret files.

## 2. Repository discovery

Inspect:

- repository root
- manifests and lock files
- workspace or monorepo configuration
- build configuration
- lint, formatting and type-check configuration
- test configuration
- CI/CD configuration
- application entry points
- package and module boundaries
- database schemas and migrations
- container and infrastructure files
- API specifications
- existing architecture documentation
- representative source and test files

Ignore dependency, generated and build-output directories unless directly relevant.

## 3. Generate project knowledge

Create or update:

- `.claude/project-knowledge/PROJECT_PROFILE.md`
- `.claude/project-knowledge/TECHNOLOGY_STACK.md`
- `.claude/project-knowledge/ARCHITECTURE.md`
- `.claude/project-knowledge/REPOSITORY_MAP.md`
- `.claude/project-knowledge/COMMANDS.md`
- `.claude/project-knowledge/CONVENTIONS.md`
- `.claude/project-knowledge/TESTING_STRATEGY.md`
- `.claude/project-knowledge/INTEGRATIONS.md`
- `.claude/project-knowledge/ONBOARDING_REPORT.md`

Follow the contracts in
`references/knowledge-files.md`.

Every material fact must be supported by repository evidence.

## 4. Generate stack-specific skills

For each important technology, create a focused skill at:

`.claude/skills/stack-<technology>/SKILL.md`

Examples:

- `.claude/skills/stack-typescript/SKILL.md`
- `.claude/skills/stack-react/SKILL.md`
- `.claude/skills/stack-dotnet/SKILL.md`
- `.claude/skills/stack-postgresql/SKILL.md`
- `.claude/skills/stack-playwright/SKILL.md`

Each generated skill must contain:

- a precise description and trigger
- verified configuration paths
- repository-specific conventions
- representative examples to follow
- commands for relevant validation
- patterns to avoid
- path restrictions where useful

Do not copy generic framework documentation. Store only knowledge specific to
this repository.

Do not add `disable-model-invocation: true` to generated stack skills. They must
remain available to Claude and specialised agents.

## 5. Update project CLAUDE.md block

Replace only content between:

`<!-- claude-sdlc:project:start -->`

and:

`<!-- claude-sdlc:project:end -->`

Include a concise project purpose, repository type, major components, primary
technologies, verified commands and links to project-knowledge files.

Keep the project block concise.

## 6. Validate

Confirm:

- referenced files exist
- commands come from repository configuration
- generated skills match actual technologies
- no credentials were copied
- no production source files changed
- knowledge files do not contradict each other

## 7. Final output

Return:

- Onboarding status
- Project summary
- Detected stack
- Architecture summary
- Generated knowledge files
- Generated stack skills
- Verified commands
- Warnings and unresolved discoveries
