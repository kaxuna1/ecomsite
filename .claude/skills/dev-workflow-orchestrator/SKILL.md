---
name: dev-workflow-orchestrator
description: Orchestrates multi-agent development workflow from feature request to completion, managing Product Owner → Developer → QA process with task tracking. This skill should be used when the user requests a new feature, enhancement, or complex implementation that requires multiple steps and coordination across frontend/backend development.
---

# Development Workflow Orchestrator

## Overview

Orchestrate complete development workflows from initial feature request through implementation, validation, and integration. Coordinate between Product Owner, Frontend Developer, Backend Developer, and QA agents with automated task tracking and parallel execution where possible.

## When to Use This Skill

Invoke this skill when:
- User requests a new feature: "Add user authentication"
- User requests an enhancement: "Improve the dashboard performance"
- User requests complex implementation: "Build a payment processing system"
- User says: "new feature: [description]"
- User wants multi-step development with proper planning and QA

Do NOT use for:
- Simple bug fixes (handle directly)
- Documentation-only changes
- Configuration tweaks
- Single-file modifications

## Workflow Phases

The orchestrator manages four sequential phases:

### Phase 1: Planning (Product Owner)
**Entry:** User provides feature request
**Agent:** `@product-owner-agent`
**Actions:**
1. Automatically invoke PO agent with feature request
2. Receive task breakdown with acceptance criteria
3. Generate Change Request document using `scripts/cr_generator.py`
4. Initialize workflow state using `scripts/state_manager.py`
5. Transition to Development phase

### Phase 2: Development (Developer Agents)
**Entry:** Tasks defined and ready
**Agents:** `@frontend-developer-agent`, `@backend-developer-agent`
**Actions:**
1. Generate execution plan using `scripts/task_orchestrator.py`
2. Execute tasks in waves (parallel where possible)
3. For each wave:
   - Identify independent tasks
   - Invoke multiple agents in parallel (single message with multiple Task tools)
   - Wait for all completions
   - Update all task statuses
4. Proceed to next wave
5. Transition to Validation phase when all complete

### Phase 3: Validation (QA Agent)
**Entry:** All development tasks completed
**Agent:** `@qa-validator-agent` (use testing agent type)
**Actions:**
1. For each completed task:
   - Invoke QA agent with task details and acceptance criteria
   - Receive validation result: APPROVED or CHANGES_REQUESTED
2. If CHANGES_REQUESTED:
   - Automatically reassign to developer agent
   - Update task status to in_progress
   - Loop back to development
3. If APPROVED:
   - Update qa_status
   - Proceed to next task
4. When all approved, transition to Integration

### Phase 4: Integration & Documentation
**Entry:** All tasks validated
**Actions:**
1. Verify workflow completion (all approved)
2. Update documentation
3. Generate PR description
4. Update CR status to Completed
5. Mark workflow as completed

## Command Interface

Handle these user commands:

**Start New Feature:**
```
User: "new feature: Add user authentication"
User: "Add shopping cart functionality"

Action: Automatically invoke PO agent, no confirmation needed
```

**Check Status:**
```
User: "status"
User: "what's the progress?"

Action: Run scripts/state_manager.py status command and display summary
```

**Continue Task:**
```
User: "continue task TASK-001"

Action: Resume specific task from current status
```

**Review Task:**
```
User: "review task TASK-001"

Action: Trigger QA validation for specific task
```

## Script Usage

### Initialize Workflow
```bash
python3 scripts/state_manager.py init \
  --cr-id CR-001 \
  --description "Add user authentication"
```

### Generate Execution Plan
```bash
python3 scripts/task_orchestrator.py plan \
  --state-file .claude/state/workflow-state.json
```

### Add Task
```bash
python3 scripts/state_manager.py add-task \
  --task-id TASK-001 \
  --task-type backend \
  --title "Implement auth API" \
  --task-description "Create login/logout endpoints"
```

### Update Task Status
```bash
python3 scripts/state_manager.py update \
  --task-id TASK-001 \
  --status in_progress \
  --assigned-to backend-developer-agent
```

### Generate Change Request
```bash
python3 scripts/cr_generator.py create \
  --title "Add User Authentication" \
  --description "..." \
  --business-value "..." \
  --tasks-json tasks.json
```

### Get Workflow Status
```bash
python3 scripts/state_manager.py status
```

## Agent Delegation

### Product Owner Agent
**When:** User requests new feature
**Invocation:**
```
Task tool with subagent_type="product-owner" and prompt:
"""
Analyze the following feature request and create a comprehensive change request:

Feature Request: [user's description]

Provide:
1. Business value analysis
2. Task breakdown with:
   - Task ID (TASK-001, TASK-002, etc.)
   - Task type (frontend/backend/fullstack)
   - Title and description
   - Acceptance criteria (specific, testable)
   - Dependencies between tasks
3. Risks and considerations
4. Success metrics

Format as structured data for CR generation and state initialization.
"""
```

### Frontend Developer Agent
**When:** Task type is "frontend" or "fullstack"
**Invocation:**
```
Task tool with subagent_type="frontend" and prompt:
"""
Implement frontend task [TASK-ID]: [title]

Description: [task description]

Acceptance Criteria:
[list criteria]

Technical Context:
[architecture, libraries, styling]

Backend APIs (if applicable):
[API details]

Provide:
- Implementation (components, pages, hooks)
- Tests (component tests, integration)
- Summary of changes
"""
```

### Backend Developer Agent
**When:** Task type is "backend" or "fullstack"
**Invocation:**
```
Task tool with subagent_type="backend" and prompt:
"""
Implement backend task [TASK-ID]: [title]

Description: [task description]

Acceptance Criteria:
[list criteria]

Technical Context:
[architecture, database, APIs]

API Specifications (if applicable):
- Endpoint: [METHOD] /api/[path]
- Request: {...}
- Response: {...}

Provide:
- Implementation (endpoints, services, models)
- Tests (unit, integration)
- Database migrations (if needed)
- Summary of changes
"""
```

### QA Validator Agent
**When:** Task status is "completed"
**Invocation:**
```
Task tool with subagent_type="testing" and prompt:
"""
Validate completed task [TASK-ID]: [title]

Original Requirements:
[task description]

Acceptance Criteria:
[list all criteria]

Implementation Summary:
[what was implemented]

Tests Written:
[list tests]

Verify:
1. All acceptance criteria met
2. Tests comprehensive and passing
3. Code quality acceptable
4. Error handling present
5. No obvious bugs

Provide result:
- APPROVED: Meets all requirements
- CHANGES_REQUESTED: Issues found (detailed feedback)
"""
```

## Parallel Execution

When orchestrator identifies independent tasks:

```
# Example: Three independent tasks in Wave 1
antml:function_calls:
  - Task(subagent_type="frontend", task=TASK-001)
  - Task(subagent_type="backend", task=TASK-002)
  - Task(subagent_type="frontend", task=TASK-003)

# All three execute concurrently
# Wait for all completions
# Update all statuses
# Proceed to Wave 2
```

**Rules:**
- Only parallelize tasks with no dependencies between them
- Group by waves using task_orchestrator.py plan
- Invoke all tasks in a wave with single message (multiple tool calls)
- Monitor for file conflicts

## State Management

**State File:** `.claude/state/workflow-state.json`

**Structure:**
```json
{
  "current_cr": "CR-001",
  "description": "Feature description",
  "phase": "development",
  "created_at": "2025-10-29T10:00:00Z",
  "updated_at": "2025-10-29T11:30:00Z",
  "tasks": [
    {
      "id": "TASK-001",
      "type": "backend",
      "title": "...",
      "description": "...",
      "acceptance_criteria": [...],
      "dependencies": [],
      "status": "completed",
      "assigned_to": "backend-developer-agent",
      "started_at": "...",
      "completed_at": "...",
      "qa_status": "APPROVED",
      "qa_feedback": null
    }
  ],
  "history": [...]
}
```

See `references/state-schema.md` for complete schema documentation.

## Workflow Example

**User Request:**
```
User: "new feature: Add user authentication with login, logout, and password reset"
```

**Orchestrator Actions:**

**1. Planning Phase**
```
Invoke: @product-owner-agent
Input: Feature request
Output: Task breakdown
  - TASK-001 (backend): Auth API endpoints
  - TASK-002 (backend): Password reset flow
  - TASK-003 (frontend): Login form
  - TASK-004 (frontend): Password reset UI
  Dependencies: TASK-003 depends on TASK-001, TASK-004 depends on TASK-002

Generate: docs/change-requests/CR-001.md
Initialize: .claude/state/workflow-state.json
```

**2. Development Phase**
```
Generate execution plan:
  Wave 1: TASK-001, TASK-002 (independent, both backend)
  Wave 2: TASK-003, TASK-004 (depend on Wave 1, both frontend)

Execute Wave 1 in parallel:
  Invoke: @backend-developer-agent for TASK-001
  Invoke: @backend-developer-agent for TASK-002
  (Single message with two Task tool calls)

Wait for completions, update statuses

Execute Wave 2 in parallel:
  Invoke: @frontend-developer-agent for TASK-003 (with TASK-001 API details)
  Invoke: @frontend-developer-agent for TASK-004 (with TASK-002 API details)

Wait for completions, update statuses
```

**3. Validation Phase**
```
For each task:
  Invoke: @qa-validator-agent
  Input: Task details + implementation
  Output: APPROVED or CHANGES_REQUESTED

If CHANGES_REQUESTED for TASK-003:
  Update: task.qa_status = "CHANGES_REQUESTED"
  Update: task.qa_feedback = "Missing error handling for invalid credentials"
  Update: task.status = "in_progress"
  Re-invoke: @frontend-developer-agent with feedback
  Wait for completion
  Re-validate

All approved: Proceed to integration
```

**4. Integration Phase**
```
Verify all tasks completed and approved
Update documentation
Generate PR description:
  # CR-001: Add User Authentication

  ## Tasks Completed
  - TASK-001: Auth API endpoints
  - TASK-002: Password reset flow
  - TASK-003: Login form
  - TASK-004: Password reset UI

  ## Testing
  All tasks validated by QA agent

  ## Related Documents
  - Change Request: docs/change-requests/CR-001.md

Update CR status to "Completed"
Mark workflow phase as "completed"
```

## Best Practices

1. **Always use scripts for state management** - Don't manually edit state file
2. **Invoke parallel tasks in single message** - Multiple Task tool calls at once
3. **Pass context between agents** - Include relevant output from previous agents
4. **Validate before proceeding** - Check task completion before phase transition
5. **Update state immediately** - Don't batch status updates
6. **Provide complete context to agents** - Include all requirements and acceptance criteria
7. **Handle QA feedback automatically** - Reassign immediately, no user intervention
8. **Track everything in history** - State file history provides audit trail

## Troubleshooting

**Issue:** Task stuck in "in_progress"
- Check if agent completed but status not updated
- Use state_manager.py to manually update if needed

**Issue:** Circular dependencies detected
- Review task dependencies in state file
- Adjust dependencies to break cycle
- Re-run task_orchestrator.py plan

**Issue:** QA keeps requesting changes
- Review feedback carefully
- May need to refine acceptance criteria
- Consider splitting task into smaller pieces

**Issue:** State file not found
- Ensure .claude/state/ directory exists
- Run state_manager.py init to create new workflow

## References

For detailed information, see reference documents:
- `references/workflow-phases.md` - Detailed phase documentation
- `references/agent-delegation.md` - Agent invocation patterns and templates
- `references/state-schema.md` - Complete state file schema

Use `grep -r "pattern" references/` to search reference docs when needed.

## Assets

Template files available in `assets/`:
- `workflow-state-template.json` - Empty state file template
- `change-request-template.md` - CR document template
- `task-template.md` - Individual task documentation template

These are used by the generator scripts but can be customized for project needs.
