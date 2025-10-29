# Workflow Phases Documentation

This document provides detailed information about each phase in the development workflow orchestration.

---

## Phase 1: Planning

**Entry Condition:** User provides a feature request or requirement

**Responsible Agent:** `@product-owner-agent`

**Activities:**
1. Analyze feature request and gather requirements
2. Define business value and success criteria
3. Break down work into discrete tasks
4. Identify dependencies between tasks
5. Determine task types (frontend, backend, fullstack, qa, docs)
6. Document acceptance criteria for each task
7. Estimate effort and timeline
8. Generate Change Request (CR) document

**Outputs:**
- Change Request document (stored in `docs/change-requests/`)
- Task list with dependencies
- Initial workflow state (`.claude/state/workflow-state.json`)

**Exit Condition:** CR document approved and tasks ready for execution

**State Transition:** `planning` → `development`

---

## Phase 2: Development

**Entry Condition:** Tasks are defined and ready for execution

**Responsible Agents:**
- `@frontend-developer-agent` (frontend tasks)
- `@backend-developer-agent` (backend tasks)
- Both agents for fullstack tasks

**Activities:**
1. Orchestrator determines execution waves (tasks that can run in parallel)
2. For each wave:
   - Assign tasks to appropriate developer agents
   - Agents implement features according to specifications
   - Agents write tests (unit, integration as appropriate)
   - Update task status in real-time
3. Handle task dependencies sequentially
4. Execute independent tasks in parallel
5. Monitor progress and update state

**Parallel Execution Rules:**
- Tasks with no dependencies can run concurrently
- Frontend and backend tasks are independent by default unless specified
- Fullstack tasks may require sequential frontend → backend or vice versa

**Task Assignment Logic:**
```
IF task.type == "frontend":
    ASSIGN TO: @frontend-developer-agent
ELIF task.type == "backend":
    ASSIGN TO: @backend-developer-agent
ELIF task.type == "fullstack":
    ASSIGN TO: @frontend-developer-agent AND @backend-developer-agent
    (May require coordination)
```

**Outputs:**
- Implemented features (code changes)
- Tests (unit tests, integration tests)
- Updated task status in state file
- Documentation updates (if applicable)

**Exit Condition:** All tasks reach `completed` status

**State Transition:** `development` → `validation`

---

## Phase 3: Validation (QA)

**Entry Condition:** Development tasks are completed

**Responsible Agent:** `@qa-validator-agent`

**Activities:**
1. For each completed task:
   - Review task requirements and acceptance criteria
   - Examine implementation and tests
   - Verify functionality meets specifications
   - Check test coverage and quality
   - Validate edge cases and error handling
2. Provide one of two outcomes:
   - **APPROVED**: Task meets all requirements
   - **CHANGES_REQUESTED**: Issues found, feedback provided

**QA Validation Criteria:**
- All acceptance criteria met
- Tests written and passing
- Code quality meets standards
- No obvious bugs or regressions
- Error handling implemented
- Edge cases considered

**Feedback Loop:**
```
IF qa_status == "CHANGES_REQUESTED":
    1. Update task.qa_status = "CHANGES_REQUESTED"
    2. Update task.qa_feedback = "<detailed feedback>"
    3. Update task.status = "in_progress"
    4. RETURN TO Phase 2 (Development)
    5. Reassign to original developer agent
ELSE:
    1. Update task.qa_status = "APPROVED"
    2. Keep task.status = "completed"
    3. PROCEED to next task or Phase 4
```

**Outputs:**
- QA validation results for each task
- Detailed feedback for any changes requested
- Updated task statuses

**Exit Condition:** All tasks have `qa_status == "APPROVED"`

**State Transition:** `validation` → `integration`

---

## Phase 4: Integration & Documentation

**Entry Condition:** All tasks validated and approved

**Responsible Agent:** Orchestrator (with potential agent assistance)

**Activities:**
1. Verify workflow completion
   - All tasks status: `completed`
   - All tasks qa_status: `APPROVED`
   - No pending dependencies

2. Documentation updates
   - Update project documentation
   - Generate API documentation (if applicable)
   - Update changelog
   - Create release notes

3. Prepare for deployment
   - Create pull request description
   - Summarize changes by component
   - List all completed tasks
   - Include testing summary
   - Note any migration steps

4. Final cleanup
   - Update CR status to "Completed"
   - Archive workflow state (optional)
   - Notify stakeholders

**Pull Request Description Format:**
```markdown
# [CR-ID]: [Title]

## Summary
Brief overview of changes

## Tasks Completed
- [TASK-001]: Description
- [TASK-002]: Description
...

## Testing
Summary of test coverage and validation

## Deployment Notes
Any special instructions for deployment

## Related Documents
- Change Request: docs/change-requests/CR-XXX.md
```

**Outputs:**
- Updated documentation
- Pull request description
- Release notes
- Completed CR document
- Final workflow state snapshot

**Exit Condition:** All deliverables ready for review and merge

**State Transition:** `integration` → `completed`

---

## Phase Transition Rules

```
NEW REQUEST
    ↓
[Planning] ──────→ (CR approved) ──────→ [Development]
                                              ↓
                                      (All tasks completed)
                                              ↓
[Validation] ←──── (Changes requested) ───┘
    ↓
(All approved)
    ↓
[Integration] ──────→ (Ready for merge) ──────→ [Completed]
```

---

## Error Handling

### Blocked Tasks
If a task cannot proceed due to external blockers:
1. Update task status to `blocked`
2. Document blocker in task notes
3. Notify user
4. Pause workflow or skip task temporarily
5. Resume when blocker resolved

### Failed Tasks
If a task fails repeatedly after QA feedback:
1. Escalate to user
2. Consider task refinement or splitting
3. May require replanning in Phase 1

### Abandoned Workflows
If user abandons workflow:
1. State remains in `.claude/state/workflow-state.json`
2. Can be resumed with `continue` command
3. Can be cleared with state manager script
