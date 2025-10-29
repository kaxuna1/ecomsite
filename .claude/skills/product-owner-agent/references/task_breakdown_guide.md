# Task Breakdown Guide for Product Owners

## Principles of Effective Task Breakdown

### 1. Granularity
Tasks should be small enough to be completed in 1-3 days but large enough to deliver meaningful value.

**Too Large:**
- "Implement authentication system" (spans multiple areas, takes weeks)

**Too Small:**
- "Add import statement for bcrypt library" (trivial, doesn't warrant separate task)

**Just Right:**
- "Implement backend authentication service with registration and login" (focused, 2-3 days)
- "Create React login and registration forms" (focused, 1-2 days)

### 2. Independence
Tasks should minimize dependencies to allow parallel work where possible.

**Bad:**
- Every task depends on the previous one (serial execution only)

**Good:**
- Frontend and backend tasks can run in parallel
- Database migration can be completed before other work starts
- Documentation can be written alongside implementation

### 3. Testability
Each task should have clear, testable acceptance criteria.

**Vague:**
- "Make the login work"

**Clear:**
- "User can log in with valid email/password and receive JWT token"
- "Invalid credentials return 401 status with error message"
- "Login form displays error message for validation failures"

## Task Types and Agent Assignment

### Frontend Tasks
**Assigned to:** frontend agent

**Typical tasks:**
- UI component development
- Form implementation and validation
- State management
- API integration on client side
- Styling and responsive design
- Accessibility implementation

**Examples:**
- "Create user registration form with validation"
- "Implement product listing page with pagination"
- "Add dark mode toggle to settings"

### Backend Tasks
**Assigned to:** backend agent

**Typical tasks:**
- API endpoint implementation
- Business logic in services
- Database queries in repositories
- Authentication/authorization middleware
- Data validation
- Error handling
- Integration with external services

**Examples:**
- "Implement user authentication service"
- "Create REST endpoints for product CRUD"
- "Add email notification service"

### Database Tasks
**Assigned to:** backend agent (or dedicated database agent)

**Typical tasks:**
- Schema design
- Migration creation
- Index optimization
- Query optimization
- Data seeding
- Backup/recovery procedures

**Examples:**
- "Create users table migration with indexes"
- "Add full-text search index to products"
- "Optimize slow queries on orders table"

### DevOps/Infrastructure Tasks
**Assigned to:** backend agent (or dedicated devops agent)

**Typical tasks:**
- CI/CD pipeline setup
- Deployment configuration
- Environment setup
- Monitoring and logging
- Performance optimization
- Security hardening

**Examples:**
- "Configure GitHub Actions for CI/CD"
- "Set up rate limiting on API endpoints"
- "Add error tracking with Sentry"

### Fullstack Tasks
**Assigned to:** backend or frontend agent (based on primary focus)

**Typical tasks:**
- Features spanning frontend and backend
- Integration work
- End-to-end features
- Testing coordination

**Examples:**
- "Integrate authentication across frontend and backend"
- "Implement file upload feature end-to-end"
- "Add real-time notifications with WebSockets"

## Complexity Estimation

### Small (S) - 0.5 to 1 day
**Characteristics:**
- Well-defined scope
- No unknowns
- Minimal dependencies
- Straightforward implementation

**Examples:**
- "Add validation rule to existing form"
- "Create database migration for new column"
- "Update API documentation"
- "Add logging to existing service"

### Medium (M) - 1 to 3 days
**Characteristics:**
- Moderate scope
- Some unknowns but manageable
- Few dependencies
- Standard patterns apply

**Examples:**
- "Implement JWT authentication middleware"
- "Create product listing page with filters"
- "Add password reset functionality"
- "Implement rate limiting on endpoints"

### Large (L) - 3 to 5 days
**Characteristics:**
- Broad scope
- Multiple unknowns
- Multiple dependencies
- May require research or new patterns

**Examples:**
- "Implement complete authentication system"
- "Build analytics dashboard with charts"
- "Add payment processing integration"
- "Implement real-time chat feature"

**If larger than 5 days:** Break it down further!

## Dependency Management

### Types of Dependencies

1. **Technical Dependencies**
   - Database must exist before queries can run
   - API endpoints must exist before frontend can call them
   - Authentication must work before protected routes function

2. **Logical Dependencies**
   - Research findings inform implementation approach
   - Design mockups guide frontend development
   - Schema design determines repository implementation

3. **Resource Dependencies**
   - Limited number of developers
   - Shared components/libraries
   - Environment availability

### Identifying Dependencies

**Ask:**
- What needs to exist before this task can start?
- What will other tasks need from this task?
- Can this be done in parallel with other work?
- Are there shared resources or bottlenecks?

**Document in YAML:**
```yaml
dependencies: [TASK-001, TASK-003]  # Must complete these first
```

### Minimizing Dependencies

**Strategies:**
1. **Interface-First Development**
   - Define API contracts early
   - Frontend and backend can work in parallel
   - Mock APIs for development

2. **Feature Flags**
   - Deploy incomplete features behind flags
   - Reduces merge conflicts
   - Enables incremental delivery

3. **Modular Architecture**
   - Loosely coupled components
   - Clear interfaces
   - Parallel development

## Task Sequencing Patterns

### Pattern 1: Foundation First
```
1. Database schema (S)
2. Backend service (L) - depends on #1
3. API endpoints (M) - depends on #2
4. Frontend integration (M) - depends on #3
```

**When to use:** New features requiring full stack

### Pattern 2: Parallel Tracks
```
1. Database schema (S)
2a. Backend service (L) - depends on #1
2b. Frontend mockups (M) - independent
3a. API endpoints (M) - depends on #2a
3b. Frontend components (M) - depends on #2b
4. Integration (M) - depends on #3a and #3b
```

**When to use:** Large features with frontend/backend teams

### Pattern 3: Incremental Enhancement
```
1. Basic feature (M)
2. Add validation (S) - depends on #1
3. Add error handling (S) - depends on #1
4. Add tests (M) - depends on #1
5. Add documentation (S) - depends on #1
```

**When to use:** Iterative development, MVP approach

### Pattern 4: Infrastructure First
```
1. Setup CI/CD (M)
2. Create deployment pipeline (M) - depends on #1
3. Add monitoring (S) - depends on #2
4. Implement features (L) - depends on #2
```

**When to use:** New projects, greenfield development

## Writing Acceptance Criteria

### INVEST Criteria
Good acceptance criteria should be:
- **Independent:** Can be tested independently
- **Negotiable:** Can be refined through discussion
- **Valuable:** Delivers user value
- **Estimable:** Can be estimated with confidence
- **Small:** Can be completed in a sprint
- **Testable:** Can be objectively tested

### Format: Given-When-Then

```yaml
acceptance_criteria:
  - "Given a user is on the login page
     When they enter valid email and password
     Then they are redirected to dashboard with auth token"

  - "Given a user is on the login page
     When they enter invalid credentials
     Then they see an error message and remain on login page"
```

### Format: Checklist

```yaml
acceptance_criteria:
  - "User can submit login form with email/password"
  - "Valid credentials generate JWT token"
  - "Invalid credentials return 401 error"
  - "Loading state displays during authentication"
  - "Success redirects to dashboard"
  - "Errors display in user-friendly format"
```

### What Makes Good Acceptance Criteria

**Bad:**
- "Login should work" (vague, not testable)
- "Make it fast" (not measurable)
- "Handle errors" (not specific)

**Good:**
- "Login completes in < 500ms for valid credentials"
- "Invalid credentials return 401 status with error message"
- "Network errors display 'Connection failed, please try again'"

## Edge Cases and Error Scenarios

Always consider and document:

### User Input
- Invalid formats
- Missing required fields
- Out-of-range values
- SQL injection attempts
- XSS attempts

### System State
- Resource not found
- Resource already exists
- Concurrent modifications
- Insufficient permissions

### External Dependencies
- Network failures
- Third-party API errors
- Database connection lost
- Timeout scenarios

### Example:
```yaml
edge_cases:
  - "User submits form with invalid email format"
  - "Email already exists in database"
  - "Password doesn't meet complexity requirements"
  - "Network error during API call"
  - "Token expired during password reset"
  - "Multiple password reset requests"
```

## Validation Checklist

Every task should include validation items:

```yaml
validation_checklist:
  - "[ ] Feature working as specified"
  - "[ ] All acceptance criteria met"
  - "[ ] Edge cases handled"
  - "[ ] Error handling implemented"
  - "[ ] Tests written and passing"
  - "[ ] Code review completed"
  - "[ ] Documentation updated"
  - "[ ] Performance acceptable"
  - "[ ] Security review passed"
  - "[ ] Accessibility verified"
```

## Common Anti-Patterns

### Anti-Pattern 1: "God Tasks"
**Problem:** One massive task doing everything
**Solution:** Break into focused, single-responsibility tasks

### Anti-Pattern 2: "Arbitrary Slicing"
**Problem:** Splitting by file instead of functionality
**Solution:** Split by vertical slice (feature or user journey)

### Anti-Pattern 3: "No Clear Owner"
**Problem:** Task could be done by anyone, no clear agent
**Solution:** Assign based on primary skill needed

### Anti-Pattern 4: "Dependency Hell"
**Problem:** Every task depends on every other task
**Solution:** Identify truly necessary dependencies, enable parallelization

### Anti-Pattern 5: "Vague Criteria"
**Problem:** Acceptance criteria too vague to verify
**Solution:** Make criteria specific, measurable, testable

## Examples by Feature Type

### Example: User Authentication Feature
```yaml
tasks:
  - Database schema (S, backend, no deps)
  - Backend auth service (L, backend, deps: database)
  - Auth middleware (M, backend, deps: auth service)
  - Login form (M, frontend, deps: auth service)
  - Token management (M, frontend, deps: login form)
  - Protected routes (M, backend, deps: middleware)
  - Tests (L, backend, deps: all above)
```

### Example: Bug Fix
```yaml
tasks:
  - Investigate root cause (S, backend, no deps)
  - Implement fix (M, backend, deps: investigation)
  - Add regression tests (S, backend, deps: fix)
  - Deploy hotfix (S, devops, deps: tests)
```

### Example: Performance Optimization
```yaml
tasks:
  - Benchmark current performance (S, backend, no deps)
  - Identify bottlenecks (M, backend, deps: benchmark)
  - Optimize queries (M, backend, deps: identify)
  - Add caching (M, backend, deps: identify)
  - Add performance monitoring (S, devops, deps: optimize)
  - Re-benchmark and validate (S, backend, deps: all above)
```

## Tips for Product Owners

1. **Start with user value:** What does the user gain?
2. **Think vertical slices:** Complete features, not layers
3. **Enable parallelization:** Minimize dependencies
4. **Be specific:** Clear criteria beat vague descriptions
5. **Consider risks:** Document and plan mitigation
6. **Plan for testing:** Testing is not optional
7. **Document assumptions:** What do you assume is true?
8. **Include rollback plan:** How do we undo if needed?
9. **Estimate conservatively:** Add buffer for unknowns
10. **Validate continuously:** Check work against criteria
