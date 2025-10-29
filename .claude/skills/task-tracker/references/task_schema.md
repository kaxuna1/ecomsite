# Task Schema Reference

This document describes the JSON schema used for task storage in the task-tracker skill.

## Storage Structure

Tasks are stored in `.claude/tasks/active-sprint.json` with the following top-level structure:

```json
{
  "sprint": {
    "id": "sprint-1",
    "name": "Active Sprint",
    "created": "2025-01-15T10:00:00"
  },
  "tasks": {
    "TASK-001": { ... },
    "TASK-002": { ... }
  }
}
```

## Sprint Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier for the sprint |
| `name` | string | Yes | Human-readable sprint name |
| `created` | ISO8601 datetime | Yes | Sprint creation timestamp |

## Task Object

Each task in the `tasks` object has the following structure:

### Core Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique task identifier (e.g., "TASK-001") |
| `title` | string | Yes | Brief task description |
| `description` | string | No | Detailed task description |
| `status` | enum | Yes | Current status (see Status Values) |
| `created` | ISO8601 datetime | Yes | Task creation timestamp |
| `updated` | ISO8601 datetime | Yes | Last update timestamp |
| `completed_at` | ISO8601 datetime | No | Completion timestamp (null if not completed) |

### Assignment & Scheduling

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `assignee` | string | No | Username of assigned person |
| `due_date` | ISO8601 date | No | Task due date |
| `estimate` | integer | No | Estimated hours to complete |

### Prioritization & Organization

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `priority` | enum | Yes | Priority level (see Priority Values) |
| `tags` | string[] | No | Array of tag strings for categorization |

### Dependencies & Blockers

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `dependencies` | string[] | No | Array of task IDs this task depends on |
| `blockers` | Blocker[] | No | Array of blocker objects (see Blocker Object) |

## Status Values

The `status` field must be one of:

- `"todo"` - Task is not yet started
- `"in_progress"` - Task is actively being worked on
- `"blocked"` - Task is blocked by external factors
- `"completed"` - Task has been finished
- `"cancelled"` - Task has been cancelled

## Priority Values

The `priority` field must be one of:

- `"low"` - Low priority (🔵)
- `"medium"` - Medium priority (🟡)
- `"high"` - High priority (🟠)
- `"critical"` - Critical priority (🔴)

## Blocker Object

When a task is blocked, blocker objects are added to the `blockers` array:

```json
{
  "reason": "Waiting for API access credentials",
  "created": "2025-01-15T14:30:00"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `reason` | string | Yes | Description of what is blocking the task |
| `created` | ISO8601 datetime | Yes | When the blocker was added |

## Complete Task Example

```json
{
  "id": "TASK-001",
  "title": "Implement user authentication",
  "description": "Add JWT-based authentication to the API endpoints",
  "status": "in_progress",
  "created": "2025-01-15T09:00:00",
  "updated": "2025-01-15T14:00:00",
  "completed_at": null,
  "assignee": "johndoe",
  "due_date": "2025-01-20",
  "estimate": 8,
  "priority": "high",
  "tags": ["backend", "security", "api"],
  "dependencies": ["TASK-000"],
  "blockers": []
}
```

## Change Request Format

Change requests are stored as markdown files in `.claude/change-requests/` with the following structure:

```markdown
# CR-001: Feature Name

**Priority**: high
**Estimate**: 16h
**Tags**: backend, api, database

## Description
Detailed description of the change request...

## Tasks
- [ ] Task 1 description
- [ ] Task 2 description
- [ ] Task 3 description

## Acceptance Criteria
- Criteria 1
- Criteria 2
```

### Change Request Frontmatter Fields

| Field | Type | Description |
|-------|------|-------------|
| `Priority` | low/medium/high/critical | Default priority for generated tasks |
| `Estimate` | string | Total estimate (can be split across tasks) |
| `Tags` | comma-separated | Tags to apply to all generated tasks |
| `Assignee` | string | Default assignee for generated tasks |

## Dependency Rules

- Tasks with dependencies cannot be started until all dependency tasks are completed
- Circular dependencies are not validated but should be avoided
- Missing dependencies will cause start operations to fail
- Dependencies are checked when calling `start_task` or using the `start-task` command

## Best Practices

1. **Task IDs**: Use a consistent prefix (e.g., "TASK-", "FEAT-", "BUG-") followed by a number
2. **Estimates**: Use hours as the unit for estimates
3. **Tags**: Keep tags consistent across tasks (e.g., use "backend" not "back-end" or "back_end")
4. **Dependencies**: List dependencies in order of required completion
5. **Blockers**: Be specific about blocker reasons to help with resolution
6. **Due Dates**: Use ISO8601 date format (YYYY-MM-DD)
