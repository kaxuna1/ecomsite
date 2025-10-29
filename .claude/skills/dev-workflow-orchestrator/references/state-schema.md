# Workflow State Schema

This document defines the JSON schema for the workflow state file stored at `.claude/state/workflow-state.json`.

---

## Complete Schema

```json
{
  "current_cr": "CR-001",
  "description": "Feature: Add user authentication",
  "phase": "development",
  "created_at": "2025-10-29T10:00:00Z",
  "updated_at": "2025-10-29T11:30:00Z",
  "tasks": [
    {
      "id": "TASK-001",
      "type": "backend",
      "title": "Implement user authentication API",
      "description": "Create login, logout, and token refresh endpoints",
      "acceptance_criteria": [
        "POST /api/auth/login endpoint accepts email and password",
        "Returns JWT token on successful authentication",
        "Token expires after 24 hours",
        "Refresh token mechanism implemented"
      ],
      "dependencies": [],
      "status": "completed",
      "assigned_to": "backend-developer-agent",
      "started_at": "2025-10-29T10:15:00Z",
      "completed_at": "2025-10-29T11:00:00Z",
      "qa_status": "APPROVED",
      "qa_feedback": null,
      "technical_notes": "Using JWT with RS256 algorithm",
      "files_changed": [
        "src/api/auth.ts",
        "src/services/authService.ts",
        "tests/auth.test.ts"
      ]
    }
  ],
  "history": [
    {
      "timestamp": "2025-10-29T10:00:00Z",
      "event": "workflow_initialized",
      "cr_id": "CR-001"
    },
    {
      "timestamp": "2025-10-29T10:15:00Z",
      "task_id": "TASK-001",
      "event": "status_change",
      "old_status": "pending",
      "new_status": "in_progress"
    }
  ]
}
```

---

## Field Definitions

### Root Level

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `current_cr` | string | Yes | Current change request ID (e.g., "CR-001") |
| `description` | string | Yes | Brief description of the feature/change |
| `phase` | enum | Yes | Current workflow phase: `"planning"`, `"development"`, `"validation"`, `"integration"`, `"completed"` |
| `created_at` | string | Yes | ISO 8601 timestamp when workflow was created |
| `updated_at` | string | Yes | ISO 8601 timestamp of last update |
| `tasks` | array | Yes | Array of task objects |
| `history` | array | Yes | Array of history event objects |

### Task Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique task identifier (e.g., "TASK-001") |
| `type` | enum | Yes | Task type: `"frontend"`, `"backend"`, `"fullstack"`, `"qa"`, `"docs"` |
| `title` | string | Yes | Short descriptive title |
| `description` | string | Yes | Detailed task description |
| `acceptance_criteria` | array[string] | Yes | List of acceptance criteria |
| `dependencies` | array[string] | Yes | List of task IDs this task depends on (can be empty) |
| `status` | enum | Yes | Task status: `"pending"`, `"in_progress"`, `"completed"`, `"blocked"`, `"failed"` |
| `assigned_to` | string | No | Agent assigned to this task (null if not assigned) |
| `started_at` | string | No | ISO 8601 timestamp when task started (null if not started) |
| `completed_at` | string | No | ISO 8601 timestamp when task completed (null if not completed) |
| `qa_status` | enum | No | QA validation status: `"APPROVED"`, `"CHANGES_REQUESTED"`, null if not validated |
| `qa_feedback` | string | No | Feedback from QA agent if changes requested |
| `technical_notes` | string | No | Additional technical notes or context |
| `files_changed` | array[string] | No | List of files modified by this task |

### History Event Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `timestamp` | string | Yes | ISO 8601 timestamp of event |
| `event` | enum | Yes | Event type (see Event Types below) |
| `task_id` | string | Conditional | Task ID if event is task-specific |
| Additional fields | varies | No | Event-specific fields |

---

## Enumeration Values

### Phase Values
- `planning` - Initial requirements analysis and task breakdown
- `development` - Active development of tasks
- `validation` - QA validation of completed tasks
- `integration` - Final integration and documentation
- `completed` - Workflow finished

### Task Type Values
- `frontend` - Frontend-only task (UI, components, client logic)
- `backend` - Backend-only task (API, services, database)
- `fullstack` - Requires both frontend and backend work
- `qa` - Quality assurance or testing task
- `docs` - Documentation task

### Task Status Values
- `pending` - Task not yet started, waiting for dependencies
- `in_progress` - Task currently being worked on
- `completed` - Task finished (may await QA validation)
- `blocked` - Task blocked by external factor
- `failed` - Task failed and requires replanning

### QA Status Values
- `APPROVED` - Task approved by QA validation
- `CHANGES_REQUESTED` - QA found issues, changes needed
- `null` - Not yet validated

---

## Event Types

### `workflow_initialized`
Workflow created and initialized.

**Additional Fields:**
```json
{
  "event": "workflow_initialized",
  "cr_id": "CR-001"
}
```

### `status_change`
Task status changed.

**Additional Fields:**
```json
{
  "event": "status_change",
  "task_id": "TASK-001",
  "old_status": "pending",
  "new_status": "in_progress"
}
```

### `qa_validation`
QA validation completed for task.

**Additional Fields:**
```json
{
  "event": "qa_validation",
  "task_id": "TASK-001",
  "qa_status": "APPROVED",
  "feedback": null
}
```

### `phase_change`
Workflow phase transitioned.

**Additional Fields:**
```json
{
  "event": "phase_change",
  "old_phase": "development",
  "new_phase": "validation"
}
```

### `task_assigned`
Task assigned to agent.

**Additional Fields:**
```json
{
  "event": "task_assigned",
  "task_id": "TASK-001",
  "assigned_to": "backend-developer-agent"
}
```

### `task_blocked`
Task blocked by external factor.

**Additional Fields:**
```json
{
  "event": "task_blocked",
  "task_id": "TASK-001",
  "reason": "Waiting for API key from third-party service"
}
```

---

## State File Location

**Default Path:** `.claude/state/workflow-state.json`

**Directory Creation:** The `.claude/state/` directory is created automatically by `state_manager.py` if it doesn't exist.

**File Permissions:** Standard file permissions (644 or similar). No sensitive data should be stored in state file.

---

## State Persistence Patterns

### Creating New Workflow
```python
from scripts.state_manager import WorkflowStateManager

manager = WorkflowStateManager()
state = manager.initialize_workflow(
    cr_id="CR-001",
    description="Add user authentication"
)
```

### Loading Existing State
```python
state = manager.load_state()
if state is None:
    # No active workflow
    pass
```

### Adding Tasks
```python
manager.add_task(
    task_id="TASK-001",
    task_type="backend",
    title="Implement auth API",
    description="Create login and logout endpoints",
    acceptance_criteria=[
        "POST /api/auth/login endpoint works",
        "Returns JWT token"
    ],
    dependencies=[]
)
```

### Updating Task Status
```python
manager.update_task_status(
    task_id="TASK-001",
    status="in_progress",
    assigned_to="backend-developer-agent"
)
```

### QA Validation
```python
# Approved
manager.update_qa_status(
    task_id="TASK-001",
    qa_status="APPROVED"
)

# Changes requested
manager.update_qa_status(
    task_id="TASK-001",
    qa_status="CHANGES_REQUESTED",
    feedback="Need to add error handling for invalid credentials"
)
```

### Changing Phase
```python
manager.set_phase("validation")
```

### Getting Status Summary
```python
summary = manager.get_status_summary()
print(f"Phase: {summary['phase']}")
print(f"Total tasks: {summary['total_tasks']}")
print(f"Completed: {summary['task_counts']['completed']}")
```

---

## Validation Rules

### Required Fields
- All root-level fields marked as required must be present
- All task required fields must be present
- All history events must have timestamp and event type

### Data Integrity
- `current_cr` must reference an existing CR document
- Task `dependencies` must reference valid task IDs within same workflow
- `status` transitions must be logical (e.g., can't go from "completed" to "pending")
- Timestamps must be valid ISO 8601 format
- `started_at` must be after `created_at`
- `completed_at` must be after `started_at`

### Consistency Checks
- If `status == "completed"`, `completed_at` must be set
- If `status == "in_progress"`, `started_at` must be set
- If `qa_status == "CHANGES_REQUESTED"`, `qa_feedback` should be present
- Task in `completed` or `in_progress` should have `assigned_to` set

---

## Migration and Versioning

If schema changes are needed in the future, follow this pattern:

1. Add `schema_version` field to root level
2. Implement migration script to convert old format to new
3. Update state_manager.py to handle both versions during transition
4. Document changes in changelog

**Example:**
```json
{
  "schema_version": "2.0",
  "current_cr": "CR-001",
  ...
}
```
