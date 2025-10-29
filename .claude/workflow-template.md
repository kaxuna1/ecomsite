# Feature Development Workflow

## Phase 1: Planning (PO)
@product-owner-agent - Research and create change request

## Phase 2: Development
@frontend-developer-agent or @backend-developer-agent - Implement tasks

## Phase 3: Validation
@qa-validator-agent - Verify completion

## Phase 4: Documentation
Update docs and prepare for merge
```

**Step 5: Usage Example**

In Claude Code terminal:
```
> new feature: Add user authentication with JWT

[PO Agent activates]
- Researching JWT best practices for Express + React...
- Creating change request CR-001...
- Breaking down into tasks...

Change Request Created: CR-001
Tasks:
  TASK-001 (Backend, M): Implement JWT auth middleware
  TASK-002 (Backend, S): Create login endpoint
  TASK-003 (Backend, S): Create token refresh endpoint
  TASK-004 (Frontend, M): Create login form component
  TASK-005 (Frontend, S): Implement auth context
  TASK-006 (Frontend, S): Add protected route wrapper

Proceed with TASK-001? (y/n)

> y

[Backend Developer Agent activates]
- Implementing JWT auth middleware...
- Creating src/middleware/auth.ts...
- Adding tests...

TASK-001 Completed. Run validation? (y/n)

> y

[QA Validator Agent activates]
- Checking acceptance criteria...
- Running tests...
- Validating implementation...

TASK-001 APPROVED ✓

Next: TASK-002? (y/n)
