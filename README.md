# Claude SDLC Framework

A reusable Claude Code software-delivery framework. It installs a set of
Claude Code agents, skills, and rules into any repository so that feature
delivery follows a consistent workflow: requirements analysis → conditional
architecture review → implementation → independent QA.

## Requirements

- [Node.js](https://nodejs.org/) `>= 20` (see [`package.json`](package.json:21-23))
- [Git](https://git-scm.com/)
- [Claude Code](https://docs.claude.com/en/docs/claude-code) installed and configured in the target repository

## 1. Get the framework source

Clone this repository to a local folder (it is not published to a package
registry, so it must be installed from source):

```bash
git clone <this-repo-url> claude-sdlc
cd claude-sdlc
npm install
```

`npm install` only installs development/test dependencies for this repo. The
CLI itself has no runtime dependencies.

## 2. Make the `claude-sdlc` command available

From inside the cloned `claude-sdlc` folder, link the package so the `claude-sdlc`
binary (declared in [`package.json`](package.json:6-8)) is available globally:

```bash
npm link
```

Alternatively, invoke the CLI directly without linking:

```bash
node /path/to/claude-sdlc/bin/claude-sdlc.js <command>
```

## 3. Install the framework into a project

Run the `init` command from inside the repository you want to deliver
software in (see [`bin/claude-sdlc.js`](bin/claude-sdlc.js:10-32)):

```bash
cd /path/to/your-project
claude-sdlc init
```

Or point at a target without changing directories:

```bash
claude-sdlc init --target /path/to/your-project
```

Available flags:

| Flag                  | Description                                          |
| --------------------- | ---------------------------------------------------- |
| `--target, -t <path>` | Target repository; defaults to the current directory |
| `--dry-run`           | Preview changes without writing any files            |
| `--force`             | Overwrite conflicting framework-owned files          |
| `--help, -h`          | Show CLI help                                        |

Running `init` performs (see [`install()`](scripts/install.js:17)):

- Copies managed framework files (agents, skills, rules) into `.claude/`
- Creates project-owned directories (`.claude/project-knowledge/`, `.claude/delivery/`)
- Merges `framework/templates/settings.json` into `.claude/settings.json`
- Injects the framework block into `CLAUDE.md`
- Updates `.gitignore`
- Writes an install manifest to `.claude/framework.json`

Running `init` again on an already-installed project fails on purpose —
use `claude-sdlc update` instead.

## 4. Verify the installation

```bash
claude-sdlc validate
claude-sdlc doctor
```

- `validate` checks that all required framework paths exist and that
  `.claude/framework.json` / `CLAUDE.md` are well-formed (see
  [`validate-project.js`](scripts/validate-project.js:14-31)).
- `doctor` runs `validate` plus additional health checks: version drift,
  project-knowledge completeness, stack skills, and Git state (see
  [`doctor.js`](scripts/doctor.js:26-76)).

## 5. Onboard the project

Inside Claude Code, run the onboarding command to generate persistent
project knowledge from the actual repository (see
[`project-onboarding/SKILL.md`](framework/skills/project-onboarding/SKILL.md:1-60)):

```
/project-onboarding
```

This creates, under `.claude/project-knowledge/`:

- `PROJECT_PROFILE.md`
- `TECHNOLOGY_STACK.md`
- `ARCHITECTURE.md`
- `REPOSITORY_MAP.md`
- `COMMANDS.md`
- `CONVENTIONS.md`
- `TESTING_STRATEGY.md`
- `INTEGRATIONS.md`
- `ONBOARDING_REPORT.md`

If the repository structure, dependencies, commands, or architecture change
later, refresh this knowledge instead of re-onboarding from scratch:

```
/refresh-project-knowledge
```

## 6. Deliver a requirement

Once onboarding is complete, deliver features or fixes through the guided
workflow (see [`deliver-requirement/SKILL.md`](framework/skills/deliver-requirement/SKILL.md:1-60)):

```
/deliver-requirement <describe your requirement>
```

This command orchestrates four specialist subagents in the main
conversation:

| Agent                                                                  | Role                                                                                                                                                                      |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`requirements-analyst`](framework/agents/requirements-analyst.md:1-8) | Converts the request into repository-aware, testable requirements. Does not implement code.                                                                               |
| [`solution-architect`](framework/agents/solution-architect.md:1-8)     | Produces a repository-consistent technical design for changes spanning multiple components, contracts, persistence, security, or infrastructure. Does not implement code. |
| [`software-developer`](framework/agents/software-developer.md:1-8)     | Implements the accepted requirements/design, modifies production code and tests, and runs focused validation.                                                             |
| [`qa-engineer`](framework/agents/qa-engineer.md:1-8)                   | Independently validates acceptance criteria, regression risk, security, and test coverage against the final diff.                                                         |

Delivery artifacts (request, analysis, design, implementation, QA report)
are recorded under `.claude/delivery/<requirement-id>/`.

## Upgrading

To upgrade an already-installed project to the current framework version:

```bash
cd /path/to/your-project
claude-sdlc update
```

`update` (see [`update()`](scripts/update.js:21-100)) backs up the existing
installation, re-copies managed framework files, removes stale
framework-managed files, re-merges settings, and updates only the framework
block of `CLAUDE.md` — the project block created by onboarding and your
`project-knowledge`/`delivery`/`stack-*` files are preserved.

## Command reference

```
claude-sdlc init [options]      One-time framework installation
claude-sdlc update [options]    Upgrade framework-managed files safely
claude-sdlc validate [options]  Verify the installed framework structure
claude-sdlc doctor [options]    Diagnose framework and project-knowledge health
```

Run any command with `--help` for details.

## Running the framework's own tests

Inside the cloned `claude-sdlc` repo:

```bash
npm test
```

This runs the Node.js built-in test runner (`node --test`, see
[`package.json`](package.json:16-20)) against [`tests/`](tests).
