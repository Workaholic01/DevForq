---
name: deliver-requirement
description: Coordinate end-to-end delivery of a software requirement through requirements analysis, conditional architecture, implementation, independent QA and correction loops.
argument-hint: "<requirement>"
disable-model-invocation: true
---

# Deliver Requirement

The requirement is:

$ARGUMENTS

Run this workflow in the main Claude Code conversation.

Use the custom subagents. Do not replace specialist delegation with your own
unstructured implementation.

## 1. Preflight

Confirm that these files exist:

- `.claude/project-knowledge/PROJECT_PROFILE.md`
- `.claude/project-knowledge/TECHNOLOGY_STACK.md`
- `.claude/project-knowledge/ARCHITECTURE.md`
- `.claude/project-knowledge/COMMANDS.md`

If not, stop and instruct the user to run `/project-onboarding`.

Inspect current branch, commit, Git status and uncommitted changes.

Generate a requirement ID:

`REQ-YYYYMMDD-HHMMSS`

Create:

`.claude/delivery/<requirement-id>/`

## 2. Record the request

Create:

`.claude/delivery/<requirement-id>/00-request.md`

Include:

- requirement ID
- original request
- creation time
- starting branch
- starting commit
- starting Git status

## 3. Requirements analysis

Invoke the `requirements-analyst` subagent.

Provide:

- original requirement
- requirement ID
- request record path
- relevant project-knowledge paths

Save its complete output to:

`.claude/delivery/<requirement-id>/01-requirements.md`

Do not proceed if readiness is BLOCKED.

## 4. Architecture decision

Invoke `solution-architect` when:

- the analyst returns ARCHITECTURE_REQUIRED
- multiple major modules or services are affected
- public contracts change
- database or migration changes are required
- authentication or authorisation changes
- infrastructure or deployment changes
- events or asynchronous processing changes
- compatibility, security or scalability risk is material

Save architecture output as:

`.claude/delivery/<requirement-id>/02-solution-design.md`

If architecture is skipped, create that file with the status NOT_REQUIRED and
the reason.

Do not proceed if architecture returns BLOCKED.

## 5. Implementation

Invoke `software-developer`.

Tell it to read:

- `00-request.md`
- `01-requirements.md`
- `02-solution-design.md`
- relevant project-knowledge files
- applicable stack skills

Save the complete implementation result as:

`.claude/delivery/<requirement-id>/03-implementation.md`

Do not advance when implementation reports BLOCKED or FAILED.

## 6. Independent QA

Invoke `qa-engineer`.

Tell it to read the complete delivery folder and inspect the current diff.

Save the output as:

`.claude/delivery/<requirement-id>/04-qa-attempt-1.md`

## 7. Correction loop

When QA returns FAIL:

1. Pass the complete QA report to `software-developer`.
2. Ask it to correct verified defects only.
3. Save the result as `05-fix-attempt-<n>.md`.
4. Invoke QA again.
5. Save the result as `04-qa-attempt-<n+1>.md`.

Allow at most three correction cycles.

After three unsuccessful cycles, stop and report FAILED with unresolved defects.

## 8. Final coordinator review

Inspect:

- original requirement
- accepted requirements
- architecture decision
- implementation reports
- final QA report
- current diff
- current Git status
- validation evidence
- unrelated modifications
- accidental secrets
- documentation changes

Confirm that every acceptance criterion has evidence.

## 9. Save final report

Create:

`.claude/delivery/<requirement-id>/99-final-report.md`

Return:

# Delivery Complete

## Requirement ID

## Final Status

Use exactly one:

- DELIVERED
- DELIVERED_WITH_RISKS
- BLOCKED
- FAILED

DELIVERED requires QA PASS.

## Delivered Behaviour

## Acceptance Criteria Traceability

## Architecture Decision

## Files Changed

## Validation Evidence

## QA Result

## Known Risks

## Delivery Records

## Suggested Commit Message

Do not commit, push, merge or deploy.
