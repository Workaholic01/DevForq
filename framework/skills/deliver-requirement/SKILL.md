---
name: deliver-requirement
description: Coordinate end-to-end delivery of a software requirement through requirements analysis, conditional architecture, conditional design-time security review, implementation, mandatory security audit, independent QA and correction loops.
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

## 5. Design-time security review

Invoke `security-analyst` with Review Type DESIGN_REVIEW when
`solution-architect` was invoked in step 4.

Provide:

- `00-request.md`
- `01-requirements.md`
- `02-solution-design.md`

Save its complete output as:

`.claude/delivery/<requirement-id>/02b-security-design-review.md`

If architecture was skipped, create that file with the status NOT_REQUIRED
and the reason.

Do not proceed if the security-analyst returns BLOCKED. Return the
requirement to `solution-architect` with the findings.

## 6. Implementation

Invoke `software-developer`.

Tell it to read:

- `00-request.md`
- `01-requirements.md`
- `02-solution-design.md`
- `02b-security-design-review.md`
- relevant project-knowledge files
- applicable stack skills

Save the complete implementation result as:

`.claude/delivery/<requirement-id>/03-implementation.md`

Do not advance when implementation reports BLOCKED or FAILED.

## 7. Security audit

Invoke `security-analyst` with Review Type IMPLEMENTATION_AUDIT.

Tell it to read the complete delivery folder and inspect the current diff.

Save the output as:

`.claude/delivery/<requirement-id>/04-security-audit-attempt-1.md`

## 8. Independent QA

Invoke `qa-engineer`.

Tell it to read the complete delivery folder, including the security audit,
and inspect the current diff.

Save the output as:

`.claude/delivery/<requirement-id>/05-qa-attempt-1.md`

## 9. Correction loop

When the security audit returns VULNERABLE or BLOCKED with an unresolved
Critical or High severity finding, or when QA returns FAIL:

1. Pass the complete security audit and/or QA report to `software-developer`.
2. Ask it to correct verified defects and findings only.
3. Save the result as `06-fix-attempt-<n>.md`.
4. Re-invoke `security-analyst` when security findings were addressed. Save
   as `04-security-audit-attempt-<n+1>.md`.
5. Invoke QA again. Save the result as `05-qa-attempt-<n+1>.md`.

Allow at most three correction cycles.

After three unsuccessful cycles, stop and report FAILED with unresolved
defects and findings.

## 10. Final coordinator review

Inspect:

- original requirement
- accepted requirements
- architecture decision
- design-time security review
- implementation reports
- final security audit
- final QA report
- current diff
- current Git status
- validation evidence
- unrelated modifications
- accidental secrets
- documentation changes

Confirm that every acceptance criterion has evidence.

## 11. Save final report

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

DELIVERED requires QA PASS and a security audit verdict of SECURE or
SECURE_WITH_RISKS with no unresolved Critical or High severity finding.

## Delivered Behaviour

## Acceptance Criteria Traceability

## Architecture Decision

## Security Review Summary

## Files Changed

## Validation Evidence

## QA Result

## Known Risks

## Delivery Records

## Suggested Commit Message

Do not commit, push, merge or deploy.
