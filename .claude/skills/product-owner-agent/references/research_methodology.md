# Research Methodology for Product Owners

## Research Phase Overview

Before creating a change request, conduct thorough research to ensure the proposed solution is well-informed, follows best practices, and aligns with existing codebase patterns.

## Research Checklist

### 1. Understand the Requirement
- [ ] What problem are we solving?
- [ ] Who are the users/stakeholders?
- [ ] What is the expected outcome?
- [ ] What are the constraints?
- [ ] What is the definition of success?

### 2. Analyze Existing Codebase
- [ ] Are there similar features already implemented?
- [ ] What patterns does the codebase follow?
- [ ] What libraries/frameworks are in use?
- [ ] What is the current architecture?
- [ ] Are there existing utilities we can leverage?

### 3. Research Best Practices
- [ ] What are industry best practices for this feature?
- [ ] What patterns are commonly used?
- [ ] What are the security implications?
- [ ] What are the performance considerations?
- [ ] What are the accessibility requirements?

### 4. Identify Technical Dependencies
- [ ] What systems/services will this integrate with?
- [ ] What data does this feature need?
- [ ] What permissions/access is required?
- [ ] What third-party services are needed?
- [ ] What infrastructure changes are required?

### 5. Assess Risks and Constraints
- [ ] What could go wrong?
- [ ] What are the technical limitations?
- [ ] What are the timeline constraints?
- [ ] What are the resource constraints?
- [ ] What are the budget constraints?

## Research Process by Feature Type

### New Feature Research

**Steps:**
1. **Review Requirements**
   - Understand user story
   - Identify business goals
   - Clarify acceptance criteria

2. **Search Documentation**
   ```bash
   # Search for similar features
   grep -r "authentication" ./docs
   grep -r "login" ./src

   # Search for relevant patterns
   grep -r "middleware" ./src
   grep -r "validation" ./src
   ```

3. **Analyze Existing Code**
   - Find similar implementations
   - Study existing patterns
   - Identify reusable components
   - Review error handling approaches

4. **Research External Resources**
   - Stack Overflow for common solutions
   - Official documentation for libraries
   - GitHub for reference implementations
   - Blog posts for best practices

5. **Evaluate Alternatives**
   - Compare different approaches
   - Consider trade-offs
   - Evaluate complexity vs. benefit
   - Assess maintainability

6. **Document Findings**
   ```yaml
   research_findings:
     - "JWT is industry standard for APIs"
     - "bcrypt recommended with 10 salt rounds"
     - "Existing auth pattern in user module can be leveraged"
     - "Rate limiting required for security"
   ```

### Bug Fix Research

**Steps:**
1. **Reproduce the Bug**
   - Follow reported steps
   - Verify the issue exists
   - Document reproduction steps

2. **Investigate Root Cause**
   - Add logging/debugging
   - Review error messages
   - Check related code
   - Review git history (`git log`, `git blame`)

3. **Find Related Issues**
   ```bash
   # Search for similar bugs
   git log --all --grep="authentication"
   git log --all --grep="login"

   # Search issue tracker
   # Check for related bug reports
   ```

4. **Analyze Impact**
   - How many users affected?
   - How critical is the issue?
   - Are there workarounds?
   - What's the business impact?

5. **Research Solutions**
   - Check if others had same issue
   - Review library changelogs
   - Test potential fixes
   - Consider side effects

6. **Document Analysis**
   ```yaml
   research_findings:
     - "Root cause: Race condition in token verification"
     - "Affects 5% of users on slow connections"
     - "Similar issue fixed in PR #123"
     - "Solution: Add proper async/await handling"
   ```

### Refactoring Research

**Steps:**
1. **Identify Pain Points**
   - What's difficult to maintain?
   - What's causing bugs?
   - What's slow to work with?
   - What has high complexity?

2. **Measure Current State**
   ```bash
   # Code complexity
   npm run lint -- --format json > complexity.json

   # Test coverage
   npm run test:coverage

   # Performance benchmarks
   npm run benchmark
   ```

3. **Research Patterns**
   - Study design patterns
   - Review refactoring catalogs
   - Find examples in codebase
   - Check community best practices

4. **Evaluate Impact**
   - How much code affected?
   - What's the risk?
   - What's the benefit?
   - What's the effort?

5. **Plan Incremental Changes**
   - Break into safe steps
   - Identify reversible changes
   - Plan testing strategy
   - Consider rollback plan

6. **Document Approach**
   ```yaml
   research_findings:
     - "Current complexity score: 45 (high)"
     - "Repository pattern will improve testability"
     - "Similar refactoring done in orders module"
     - "Can be done incrementally without breaking changes"
   ```

### Technical Debt Research

**Steps:**
1. **Identify the Debt**
   - What's the shortcut taken?
   - Why was it taken?
   - What's the impact now?

2. **Quantify Impact**
   ```bash
   # Measure technical debt
   npm run sonar

   # Analyze dependencies
   npm outdated
   npm audit

   # Check code quality
   npm run lint
   ```

3. **Calculate "Interest"**
   - Time wasted working around issue
   - Bugs caused by debt
   - Features delayed by debt
   - Developer frustration

4. **Research Solutions**
   - What's the proper implementation?
   - What tools can help?
   - How have others solved this?
   - What's the modern approach?

5. **Estimate ROI**
   - Time to address: X days
   - Time saved per sprint: Y hours
   - Payback period: X / Y sprints
   - Ongoing benefits: fewer bugs, faster development

6. **Document Analysis**
   ```yaml
   research_findings:
     - "Current test coverage: 45% (below 80% target)"
     - "Causes 2-3 hours extra work per sprint"
     - "Adding tests will save 10+ hours per sprint"
     - "ROI: Pays back in 2 sprints"
   ```

## Research Tools and Techniques

### Code Search
```bash
# Find patterns in codebase
grep -r "pattern" ./src

# Find files by name
find ./src -name "*auth*"

# Search with ripgrep (faster)
rg "authentication" --type ts

# Search git history
git log --all --grep="feature"
git log -S "function_name"  # Find when code was added/removed
```

### Dependency Analysis
```bash
# Check package versions
npm list <package-name>

# Check for updates
npm outdated

# Audit for vulnerabilities
npm audit

# View dependency tree
npm ls --depth=0
```

### Code Quality
```bash
# Linting
npm run lint

# Type checking
npm run type-check

# Test coverage
npm run test:coverage

# Complexity analysis
npm run complexity
```

### Performance Analysis
```bash
# Profile application
node --prof app.js

# Benchmark specific code
npm run benchmark

# Database query analysis
EXPLAIN ANALYZE SELECT ...
```

### Documentation Search
```bash
# Search markdown files
grep -r "keyword" ./docs

# Search README files
find . -name "README.md" -exec grep -H "keyword" {} \;

# Search comments in code
grep -r "TODO" ./src
grep -r "FIXME" ./src
```

## Documenting Research Findings

### Structure
```yaml
research_findings:
  - "{Fact or insight discovered}"
  - "{Best practice identified}"
  - "{Existing pattern found}"
  - "{Technical constraint discovered}"
  - "{Risk identified}"
```

### Good vs. Bad Findings

**Bad:**
- "Need to add authentication" (not a finding, just restatement)
- "Should use JWT" (no justification)
- "Found some code" (not specific)

**Good:**
- "JWT is industry standard for stateless auth in REST APIs"
- "Existing user service uses bcrypt with 10 rounds - should match for consistency"
- "Found similar auth pattern in admin module (src/admin/auth.service.ts) - can reuse approach"
- "Rate limiting required - OWASP recommends max 5 attempts per 15 min"

### Categories of Findings

1. **Best Practices**
   - "Industry standard is X"
   - "OWASP recommends Y"
   - "Framework docs suggest Z"

2. **Existing Patterns**
   - "Similar feature in module X uses pattern Y"
   - "Codebase consistently uses approach Z"
   - "Team has utility functions for X"

3. **Technical Constraints**
   - "Database doesn't support feature X"
   - "Third-party API has rate limit of Y"
   - "Framework version Z doesn't support feature"

4. **Security Considerations**
   - "Must validate input to prevent X"
   - "Should use encryption for Y"
   - "Need to implement rate limiting"

5. **Performance Implications**
   - "Operation X is expensive, needs caching"
   - "N+1 query problem with approach Y"
   - "Indexing required for query Z"

6. **Risks and Mitigation**
   - "Risk: X could happen. Mitigation: Do Y"
   - "Dependency X has known issue Y"
   - "Approach X could cause problem Y"

## Integration Point Identification

### Questions to Ask
1. **What systems does this touch?**
   - Database
   - External APIs
   - Message queues
   - File storage
   - Cache systems

2. **What data flows in/out?**
   - User input
   - API responses
   - Database queries
   - File operations
   - Event emissions

3. **What are the interfaces?**
   - REST endpoints
   - GraphQL resolvers
   - WebSocket events
   - Function signatures
   - Database schemas

4. **What are the dependencies?**
   - Other services
   - Shared libraries
   - Configuration
   - Environment variables
   - Infrastructure

### Documenting Integration Points
```yaml
integration_points:
  - "PostgreSQL database for user storage"
  - "SendGrid API for email notifications"
  - "Redis cache for session management"
  - "S3 bucket for file uploads"
  - "Stripe API for payment processing"
```

## Security and Compliance Research

### Security Checklist
- [ ] Authentication requirements
- [ ] Authorization requirements
- [ ] Data encryption needs
- [ ] Input validation requirements
- [ ] Output encoding needs
- [ ] Rate limiting requirements
- [ ] Audit logging needs
- [ ] OWASP Top 10 considerations

### Compliance Checklist
- [ ] GDPR requirements (if handling EU user data)
- [ ] HIPAA requirements (if handling health data)
- [ ] PCI DSS requirements (if handling payment data)
- [ ] SOC 2 requirements (if enterprise product)
- [ ] Accessibility requirements (WCAG 2.1)

### Document Security Findings
```yaml
non_functional_requirements:
  security:
    - "Must use HTTPS for all API calls"
    - "Passwords must be hashed with bcrypt (10+ rounds)"
    - "JWTs must expire within 24 hours"
    - "Rate limit: 5 attempts per 15 minutes"
    - "Input validation required on all user inputs"
```

## Best Practices

1. **Be Thorough:** Research takes time but saves more time later
2. **Document Everything:** Future you (and others) will thank you
3. **Stay Objective:** Document facts, not opinions
4. **Cite Sources:** Link to documentation, Stack Overflow, GitHub
5. **Identify Unknowns:** It's okay to say "needs more investigation"
6. **Consider Alternatives:** Don't stop at the first solution
7. **Think Long-term:** Consider maintainability, not just quick wins
8. **Validate Assumptions:** Test your hypotheses
9. **Ask Questions:** Clarify ambiguous requirements
10. **Involve Experts:** Consult specialists when needed
