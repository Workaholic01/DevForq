# Security Rules

- Never expose or copy credentials and private keys.
- Do not read environment secret files.
- Validate untrusted input at trust boundaries.
- Preserve authentication and authorisation checks.
- Do not log secrets or sensitive personal data.
- Use safe repository data-access patterns.
- Treat dependency, migration and permission changes as security-sensitive.
- Security-sensitive changes must pass an independent `security-analyst`
  audit before QA sign-off.
