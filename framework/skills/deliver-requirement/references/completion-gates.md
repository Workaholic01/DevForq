# Completion Gates

A delivery is complete only when:

- Requirements are ready.
- Acceptance criteria are testable.
- Required architecture review is complete.
- Required design-time security review is complete when architecture review
  occurred.
- Implementation matches accepted scope.
- Behaviour changes have automated coverage.
- Formatting and linting passed where applicable.
- Compilation or type checking passed where applicable.
- Relevant tests passed.
- Security audit independently reviewed the diff.
- Security audit returned SECURE or accepted SECURE_WITH_RISKS, with no
  unresolved Critical or High severity finding.
- QA independently reviewed the diff.
- QA returned PASS or accepted PASS_WITH_RISKS.
- No unrelated changes were introduced.
- Remaining risks are documented.
