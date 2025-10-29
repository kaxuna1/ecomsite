# Agent Delegation Patterns

This document describes how to properly delegate work to specialized agents in the workflow orchestrator.

---

## General Delegation Pattern

When delegating to any sub-agent, follow this pattern:

```
1. STATE INTENTION
   "I'm delegating [task] to [agent]"

2. INVOKE AGENT with Task tool
   - Provide complete context
   - Include task details, requirements, acceptance criteria
   - Reference relevant files or documentation
   - Set clear expectations for deliverables

3. WAIT FOR COMPLETION
   Agent returns results in a single message

4. VALIDATE OUTPUT
   - Check against requirements
   - Verify deliverables are complete
   - Assess quality

5. UPDATE STATE
   - Update workflow state file
   - Mark task status appropriately
   - Record agent assignment

6. PROCEED
   - Move to next task or phase
   - Handle any issues or iterate if needed
```

---

## Product Owner Agent

**Agent Name:** `@product-owner-agent`

**When to Use:**
- User provides a new feature request
- Requirements need analysis and breakdown
- Change request document needed

**Input Format:**
```
Feature request: [user's description]
Additional context: [any relevant business context]
```

**Delegation Template:**
```
I'm delegating requirements analysis to the product-owner-agent.

Task tool invocation with subagent_type="product-owner" and prompt:
"""
Analyze the following feature request and create a comprehensive change request:

Feature Request: [description]

Please provide:
1. Business value analysis
2. Task breakdown with:
   - Task ID
   - Task type (frontend/backend/fullstack)
   - Description
   - Acceptance criteria
   - Dependencies
3. Recommended implementation approach
4. Risks and considerations
5. Success metrics

Format the output as structured data that can be used to:
- Generate a CR document
- Initialize workflow state
- Create task assignments
"""
```

**Expected Output:**
- Structured task breakdown
- Business analysis
- Change request content ready for document generation

**Post-Delegation Actions:**
1. Parse agent output
2. Generate CR document using `cr_generator.py`
3. Initialize workflow state using `state_manager.py`
4. Transition to development phase

---

## Frontend Developer Agent

**Agent Name:** `@frontend-developer-agent`

**When to Use:**
- Task type: `frontend`
- Task type: `fullstack` (frontend portion)
- UI/UX implementation needed
- Client-side logic required

**Input Format:**
```
Task ID: [TASK-XXX]
Task: [description]
Acceptance Criteria:
- [criterion 1]
- [criterion 2]
Context: [relevant technical context]
```

**Delegation Template:**
```
I'm delegating frontend task [TASK-ID] to the frontend-developer-agent.

Task tool invocation with subagent_type="frontend" and prompt:
"""
Implement the following frontend task:

**Task ID:** [TASK-ID]
**Title:** [title]
**Description:** [description]

**Acceptance Criteria:**
[list criteria]

**Technical Context:**
[any relevant architecture, styling guidelines, state management approach]

**Dependencies:**
[list any backend APIs or data structures this depends on]

Please:
1. Implement the feature according to specifications
2. Write component tests
3. Update any relevant documentation
4. Ensure responsive design
5. Follow project code style

Provide a summary of:
- Files created/modified
- Test coverage
- Any design decisions made
"""
```

**Expected Output:**
- Implemented components/features
- Tests
- Documentation updates
- Summary of changes

**Post-Delegation Actions:**
1. Update task status to `completed`
2. Record files changed
3. Queue for QA validation

---

## Backend Developer Agent

**Agent Name:** `@backend-developer-agent`

**When to Use:**
- Task type: `backend`
- Task type: `fullstack` (backend portion)
- API development needed
- Database changes required
- Business logic implementation

**Input Format:**
```
Task ID: [TASK-XXX]
Task: [description]
Acceptance Criteria:
- [criterion 1]
- [criterion 2]
API Specifications: [if applicable]
```

**Delegation Template:**
```
I'm delegating backend task [TASK-ID] to the backend-developer-agent.

Task tool invocation with subagent_type="backend" and prompt:
"""
Implement the following backend task:

**Task ID:** [TASK-ID]
**Title:** [title]
**Description:** [description]

**Acceptance Criteria:**
[list criteria]

**Technical Context:**
[architecture, database schema, existing APIs]

**API Specifications:**
[endpoint details, request/response formats if applicable]

Please:
1. Implement the feature according to specifications
2. Write unit and integration tests
3. Update API documentation
4. Handle errors appropriately
5. Consider security and performance

Provide a summary of:
- Endpoints created/modified
- Database migrations (if any)
- Test coverage
- Security considerations
"""
```

**Expected Output:**
- Implemented endpoints/services
- Tests (unit + integration)
- Database migrations (if needed)
- API documentation
- Summary of changes

**Post-Delegation Actions:**
1. Update task status to `completed`
2. Record implementation details
3. Queue for QA validation

---

## Fullstack Task Handling

**Task Type:** `fullstack`

**Approach:** Sequential delegation with coordination

**Pattern:**
```
1. Analyze task to determine frontend/backend split
2. Identify which should be implemented first (usually backend)
3. Delegate to backend-developer-agent first
4. Wait for completion
5. Delegate to frontend-developer-agent with backend context
6. Wait for completion
7. Update task status
```

**Delegation Sequence:**
```
STEP 1: Backend Implementation
Task tool with subagent_type="backend":
"""
Implement backend portion of fullstack task [TASK-ID]:
[backend requirements]

This will be used by a frontend component, so please provide:
- API endpoint details
- Response formats
- Error codes
- Any authentication requirements
"""

STEP 2: Frontend Implementation
Task tool with subagent_type="frontend":
"""
Implement frontend portion of fullstack task [TASK-ID]:
[frontend requirements]

Backend API available:
[details from backend agent output]

Please implement the UI that integrates with this API.
"""
```

---

## QA Validator Agent

**Agent Name:** `@qa-validator-agent`

**When to Use:**
- Task status is `completed`
- Implementation needs validation
- Phase transition to validation

**Input Format:**
```
Task ID: [TASK-XXX]
Implementation: [summary of what was implemented]
Acceptance Criteria: [list]
Files Changed: [list]
```

**Delegation Template:**
```
I'm delegating QA validation for task [TASK-ID] to the qa-validator-agent.

Task tool invocation with subagent_type="testing" and prompt:
"""
Validate the following completed task:

**Task ID:** [TASK-ID]
**Title:** [title]
**Original Requirements:** [description]

**Acceptance Criteria:**
[list all criteria]

**Implementation Summary:**
[what was implemented, files changed]

**Tests:**
[list tests that were written]

Please verify:
1. All acceptance criteria met
2. Tests are comprehensive and passing
3. Code quality is acceptable
4. Error handling is present
5. No obvious bugs or issues

Provide one of:
- APPROVED: Task meets all requirements
- CHANGES_REQUESTED: Issues found (provide detailed feedback)

If changes are requested, clearly explain:
- What is wrong or missing
- How to fix it
- Updated acceptance criteria if needed
"""
```

**Expected Output:**
- Validation result: `APPROVED` or `CHANGES_REQUESTED`
- Detailed feedback if changes requested
- Test assessment

**Post-Delegation Actions:**
```
IF result == "APPROVED":
    Update task.qa_status = "APPROVED"
    Keep task.status = "completed"
    Proceed to next task
ELSE:
    Update task.qa_status = "CHANGES_REQUESTED"
    Update task.qa_feedback = [feedback]
    Update task.status = "in_progress"
    Reassign to original developer agent
```

---

## Parallel Agent Invocation

When multiple tasks can be executed in parallel (no dependencies between them):

```
1. Identify independent tasks from orchestration plan
2. Group by agent type
3. Invoke multiple Task tools in SINGLE message

Example:
antml:function_calls:
  - Task tool (subagent_type="frontend", task=TASK-001)
  - Task tool (subagent_type="backend", task=TASK-002)
  - Task tool (subagent_type="frontend", task=TASK-003)

4. Wait for all to complete
5. Update all task statuses
6. Proceed to next wave or phase
```

**Benefits:**
- Faster workflow completion
- Better resource utilization
- Reduced total time

**Constraints:**
- Only for truly independent tasks
- Monitor for conflicts in file changes
- May need conflict resolution if tasks touch same files

---

## Error Handling in Delegation

### Agent Returns Error
```
1. Log error in workflow history
2. Update task status to "blocked" or "failed"
3. Notify user with error details
4. Provide options:
   - Retry with modifications
   - Skip task temporarily
   - Cancel workflow
```

### Agent Output Incomplete
```
1. Validate output against expected deliverables
2. If missing critical pieces:
   - Re-invoke agent with clarified requirements
   - Provide previous output as context
3. Update state when complete
```

### Timeout or No Response
```
1. Mark task as "pending"
2. Log timeout event
3. Notify user
4. Allow manual intervention or retry
```

---

## Context Passing Between Agents

When subsequent agents need context from previous agents:

```
GOOD: Include relevant output in next delegation
"""
Previous agent implemented API endpoint:
- POST /api/users
- Request: { name, email }
- Response: { id, name, email, created_at }

Now implement frontend form to use this API.
"""

BAD: Assume agent has access to previous context
"""
Implement frontend for the user creation feature.
(Agent doesn't know API details)
"""
```

**Best Practice:** Always provide necessary context explicitly in delegation prompt.
