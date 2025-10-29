---
name: task-tracker
description: Manage task state, dependencies, and progress tracking using JSON-based storage. Use this skill when users request task management operations such as creating tasks from change requests, updating task status, tracking dependencies, or viewing sprint boards. Typical triggers include "create tasks", "start working on", "mark as complete", "track progress", or "show status board".
---

# Task Tracker

## Overview

Track and manage development tasks with state management, dependency tracking, and sprint board visualization. This skill provides a lightweight, file-based task management system that integrates with the local development workflow. All tasks are stored in `.claude/tasks/active-sprint.json` for easy version control and portability.

## When to Use This Skill

Use this skill when users request:

- Creating tasks from change request documents
- Updating task status (start, complete, block, unblock)
- Tracking task dependencies and blockers
- Viewing current sprint status and progress
- Managing task properties (assignee, priority, estimates, tags)

**Example triggers:**
- "Create tasks from CR-123"
- "Start working on TASK-001"
- "Mark TASK-005 as completed"
- "Block TASK-003 because we're waiting for API keys"
- "Show me the sprint board"

## Core Capabilities

### 1. Task Creation from Change Requests

Parse change request markdown files and generate individual tasks with proper metadata.

**Change Request Location:** `.claude/change-requests/CR-XXX.md`

**Change Request Format:**
```markdown
# CR-001: Feature Name

**Priority**: high
**Estimate**: 16h
**Tags**: backend, api, database
**Assignee**: johndoe

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

**Workflow:**
1. Read the change request file from `.claude/change-requests/CR-XXX.md`
2. Parse the frontmatter fields (Priority, Estimate, Tags, Assignee)
3. Extract task items from the "Tasks" section
4. Generate task IDs in the format `CR-XXX-T1`, `CR-XXX-T2`, etc.
5. Create each task using `task_manager.py` with inherited metadata
6. Report created tasks and initial sprint board view

**Example:**
```bash
# User: "Create tasks from CR-042"

# Step 1: Read the change request
Read .claude/change-requests/CR-042.md

# Step 2: Parse and create tasks
python3 scripts/task_manager.py create "CR-042-T1" "Implement user authentication" \
  --description "Add JWT-based auth to API" \
  --priority high \
  --tags backend,security,api \
  --assignee johndoe \
  --estimate 8

python3 scripts/task_manager.py create "CR-042-T2" "Add login endpoint" \
  --description "Create /auth/login endpoint" \
  --priority high \
  --tags backend,api \
  --assignee johndoe \
  --dependencies CR-042-T1 \
  --estimate 4

# Step 3: Show status
python3 scripts/task_manager.py show-status
```

### 2. Task State Management

Update task status throughout the development lifecycle.

**Available States:**
- `todo` - Not yet started
- `in_progress` - Actively being worked on
- `blocked` - Blocked by external factors
- `completed` - Finished
- `cancelled` - No longer needed

**Operations:**

#### Start Task
Mark a task as in progress. Automatically validates that all dependencies are completed.

```bash
python3 scripts/task_manager.py start TASK-001
```

**Dependency Validation:** If the task has dependencies, the script will check that all dependency tasks are in `completed` state. If not, the operation will fail with an error message.

#### Complete Task
Mark a task as completed and record completion timestamp.

```bash
python3 scripts/task_manager.py complete TASK-001
```

#### Block Task
Mark a task as blocked with a reason for the blocker.

```bash
python3 scripts/task_manager.py block TASK-001 "Waiting for API access credentials"
```

**Blocker Tracking:** Each blocker is recorded with a timestamp. Multiple blockers can be added to track the history of blocking issues.

#### Unblock Task
Remove blocked status and return task to `todo` state.

```bash
python3 scripts/task_manager.py unblock TASK-001
```

### 3. Sprint Board Visualization

Display a kanban-style board showing all tasks grouped by status.

```bash
python3 scripts/task_manager.py show-status
```

**Board Features:**
- Tasks grouped by status (TODO, IN PROGRESS, BLOCKED, COMPLETED)
- Priority indicators (🔴 critical, 🟠 high, 🟡 medium, 🔵 low)
- Task counts per status
- Assignee display
- Estimate display
- Dependency information
- Blocker reasons for blocked tasks
- Tag display

**Example Output:**
```
================================================================================
📋 Active Sprint - sprint-1
================================================================================

📝 TODO (3)
--------------------------------------------------------------------------------
  🟡 TASK-001: Implement user authentication [@johndoe] [8h]
     🏷️  Tags: backend, security, api
  🔵 TASK-004: Write unit tests [@janedoe] [4h]
     ↳ Depends on: TASK-001
  🟠 TASK-007: Update documentation [2h]

🔄 IN PROGRESS (2)
--------------------------------------------------------------------------------
  🟠 TASK-002: Add login endpoint [@johndoe] [4h]
     ↳ Depends on: TASK-001
  🟡 TASK-005: Setup CI/CD pipeline [@devops] [6h]

🚫 BLOCKED (1)
--------------------------------------------------------------------------------
  🔴 TASK-003: Integrate payment gateway [@johndoe] [12h]
     ⚠️  Blocked: Waiting for API access credentials

✅ COMPLETED (2)
--------------------------------------------------------------------------------
  🟡 TASK-000: Project setup [4h]
  🔵 TASK-006: Database migration [2h]

================================================================================
```

### 4. Task Query and Inspection

Retrieve detailed information about specific tasks.

```bash
python3 scripts/task_manager.py get TASK-001
```

**Output:** Full JSON representation of the task with all metadata, dependencies, blockers, and timestamps.

### 5. Dependency Management

Tasks can depend on other tasks. Dependencies are validated when starting tasks.

**Add Dependency During Creation:**
```bash
python3 scripts/task_manager.py create TASK-002 "Login endpoint" \
  --dependencies TASK-001
```

**Dependency Rules:**
- Tasks cannot be started until all dependencies are completed
- Circular dependencies should be avoided (not validated by the system)
- Missing dependencies will cause start operations to fail

**When checking if a task can start:**
```bash
# This will fail if TASK-001 is not completed
python3 scripts/task_manager.py start TASK-002
# Output: ❌ Cannot start task: Dependency TASK-001 is not completed (status: in_progress)
```

### 6. Task Metadata Management

Tasks support rich metadata for organization and prioritization.

**Supported Metadata:**
- **Assignee**: Username of the person assigned
- **Priority**: low, medium, high, critical
- **Estimate**: Hours estimated to complete
- **Tags**: Array of tags for categorization
- **Due Date**: ISO8601 date format (YYYY-MM-DD)

**Example with full metadata:**
```bash
python3 scripts/task_manager.py create TASK-042 "Implement feature X" \
  --description "Detailed description of the task" \
  --assignee johndoe \
  --priority high \
  --estimate 12 \
  --tags backend,api,database \
  --due-date 2025-01-31 \
  --dependencies TASK-040,TASK-041
```

## Typical Workflows

### Workflow 1: Starting a New Sprint from Change Request

**User Request:** "Create tasks from CR-123 and start the sprint"

**Steps:**
1. Read `.claude/change-requests/CR-123.md`
2. Parse the change request structure
3. Generate task IDs with prefix `CR-123-T1`, `CR-123-T2`, etc.
4. Create each task with `task_manager.py create`
5. Show the initial sprint board with `task_manager.py show-status`
6. Confirm tasks are ready and suggest which task to start first

### Workflow 2: Working on a Task

**User Request:** "Start working on TASK-005"

**Steps:**
1. Check if task can be started (dependencies completed)
2. If validation passes, run `task_manager.py start TASK-005`
3. Confirm the task is now in progress
4. Optionally show updated sprint board

### Workflow 3: Completing a Task

**User Request:** "Mark TASK-003 as done"

**Steps:**
1. Run `task_manager.py complete TASK-003`
2. Confirm completion with timestamp
3. Check if any other tasks were waiting on this dependency
4. Show updated sprint board highlighting newly unblocked tasks

### Workflow 4: Handling Blockers

**User Request:** "Block TASK-007 because we need design approval"

**Steps:**
1. Run `task_manager.py block TASK-007 "Waiting for design approval"`
2. Record blocker with timestamp
3. Show updated sprint board with blocker visible
4. Suggest alternative tasks that can be worked on

**User Request (later):** "We got design approval, unblock TASK-007"

**Steps:**
1. Run `task_manager.py unblock TASK-007`
2. Confirm task is unblocked
3. Show updated sprint board

### Workflow 5: Sprint Status Check

**User Request:** "Show me the current sprint status" or "What's the progress?"

**Steps:**
1. Run `task_manager.py show-status`
2. Display the full sprint board
3. Optionally provide summary:
   - Total tasks
   - Completed tasks percentage
   - Blocked tasks count
   - Tasks ready to start (no incomplete dependencies)

## Storage and Data Management

### Storage Location

All tasks are stored in `.claude/tasks/active-sprint.json`

**Benefits:**
- Version control friendly (can be committed to git)
- Portable across environments
- Easy to backup and restore
- Human-readable JSON format

### Storage Structure

See `references/task_schema.md` for complete schema documentation.

**Top-level structure:**
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

### Initializing Storage

If `.claude/tasks/active-sprint.json` does not exist, it will be created automatically on the first task operation. Alternatively, copy the template from `assets/active-sprint-template.json`:

```bash
mkdir -p .claude/tasks
cp assets/active-sprint-template.json .claude/tasks/active-sprint.json
```

## Best Practices

1. **Task ID Conventions**
   - Use consistent prefixes (CR-XXX-T1 for change requests, TASK-XXX for ad-hoc tasks)
   - Use sequential numbering for clarity
   - Include the change request ID in task IDs for traceability

2. **Dependency Management**
   - Define dependencies during task creation when possible
   - Avoid circular dependencies
   - Keep dependency chains shallow for better parallelization

3. **Status Updates**
   - Always validate dependencies before starting tasks
   - Record specific blocker reasons for faster resolution
   - Complete tasks promptly to unblock dependent work

4. **Metadata Usage**
   - Set realistic estimates to track progress
   - Use consistent tag naming (e.g., "backend" not "back-end")
   - Assign tasks to specific people for accountability
   - Set due dates for time-sensitive work

5. **Sprint Board Reviews**
   - Show the sprint board after bulk operations (creating many tasks)
   - Display the board when users ask about progress
   - Highlight blocked tasks that need attention

## Resources

### scripts/task_manager.py

Core Python script providing all task CRUD operations. Can be executed directly from the command line or imported as a module.

**Usage:**
```bash
python3 scripts/task_manager.py <command> [args...]
```

**Available commands:**
- `create <id> <title> [options]` - Create new task
- `start <id>` - Start task
- `complete <id>` - Complete task
- `block <id> <reason>` - Block task
- `unblock <id>` - Unblock task
- `show-status` - Display sprint board
- `get <id>` - Get task details

### references/task_schema.md

Complete JSON schema documentation for task storage format. Consult this file for:
- Detailed field descriptions
- Validation rules
- Status and priority enums
- Change request format specification
- Dependency rules
- Best practices for schema usage

### assets/active-sprint-template.json

Template JSON file for initializing a new sprint. Contains the basic structure with one example task. Use this to initialize storage or as a reference for the expected format.

## Future Enhancements

The skill is designed to be extensible. Potential future additions:

1. **External Integrations**
   - Linear API sync
   - Jira API sync
   - GitHub Projects integration
   - Notion database sync

2. **Advanced Features**
   - Sprint velocity tracking
   - Burndown charts
   - Task time tracking
   - Sprint planning and retrospectives
   - Task templates for common patterns

3. **Reporting**
   - Sprint reports (completed vs planned)
   - Individual contributor metrics
   - Blocker analysis
   - Dependency graph visualization

These enhancements can be added as additional scripts in the `scripts/` directory without modifying the core task management functionality.
