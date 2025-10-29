# Skills & Agents Development System

A comprehensive collection of specialized skills and agent definitions for orchestrating complex software development workflows with AI assistance.

## Overview

This repository contains two complementary systems:

- **Skills**: Detailed implementation guides with templates, scripts, and best practices for specific technologies and workflows
- **Agents**: Role-based agent definitions that leverage skills to accomplish complex, multi-step development tasks

## Table of Contents

- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Available Skills](#available-skills)
- [Available Agents](#available-agents)
- [Workflows](#workflows)
- [Usage Examples](#usage-examples)
- [Directory Structure](#directory-structure)
- [Contributing](#contributing)

## Quick Start

### Using Skills Directly

Skills provide detailed implementation guidance, templates, and scripts:

```bash
# Example: Use React TypeScript Development skill
cd skills/react-typescript-dev
cat SKILL.md  # Read the skill documentation

# Use included templates
cp assets/ComponentTemplate.tsx your-project/src/components/
```

### Using Agents with AI

Agents are designed to work with AI assistants (like Claude Code) to orchestrate development:

```
User: "Create a new feature for user authentication"

→ Product Owner Agent activates:
  - Researches requirements
  - Creates change request
  - Breaks down into tasks

→ Backend Developer Agent:
  - Implements API endpoints
  - Creates database schema
  - Writes tests

→ Frontend Developer Agent:
  - Builds login/register UI
  - Integrates with API
  - Adds form validation

→ QA Validator Agent:
  - Validates against criteria
  - Tests all flows
  - Approves or requests changes
```

## Architecture

### Skills vs Agents

```
┌─────────────────┐         ┌──────────────────┐
│     SKILLS      │         │     AGENTS       │
├─────────────────┤         ├──────────────────┤
│ Implementation  │  used   │ Role-based       │
│ guides with     │  ────>  │ orchestrators    │
│ templates &     │   by    │ that leverage    │
│ scripts         │         │ skills           │
└─────────────────┘         └──────────────────┘

     How                         Who
```

**Skills** = The "how" (technical implementation details)
**Agents** = The "who" (roles that execute using skills)

### Workflow Orchestration

```
Product Owner Agent
        │
        ├─> Creates change requests
        ├─> Breaks down tasks
        ├─> Assigns to agents
        │
        ├─────────┬─────────────┐
        ↓         ↓             ↓
    Frontend  Backend      QA Validator
    Developer Developer       Agent
    Agent     Agent
        │         │             │
        └─────────┴─────────────┘
                  │
                  ↓
          Validated Feature
```

## Available Skills

### 1. Product Owner Agent Skill
**Location**: `skills/product-owner-agent/`

Guides for product ownership activities:
- Requirements research methodology
- Change request creation
- Task breakdown strategies
- Agent assignment rules
- Acceptance criteria definition

**Key Resources**:
- `references/research_methodology.md`
- `references/task_breakdown_guide.md`
- `references/agent_assignment_rules.md`

---

### 2. Development Workflow Orchestrator
**Location**: `skills/dev-workflow-orchestrator/`

Multi-agent workflow orchestration from feature request to completion:
- Phase-based workflow (Planning → Development → Validation → Integration)
- Parallel task execution
- State management
- Agent delegation patterns

**Key Resources**:
- `references/workflow-phases.md`
- `references/agent-delegation.md`
- `references/state-schema.md`
- `scripts/` - State and task management utilities

---

### 3. Backend Developer Agent Skill
**Location**: `skills/backend-developer-agent/`

Express.js + PostgreSQL backend development:
- RESTful API patterns
- Database design
- Authentication/authorization
- Error handling
- Testing strategies

**Use Cases**: API development, database operations, business logic

---

### 4. Frontend Developer Agent Skill
**Location**: `skills/frontend-developer-agent/`

React + TypeScript + Tailwind frontend development:
- Component development
- State management
- Form handling
- API integration
- Accessibility

**Use Cases**: UI development, component creation, frontend features

---

### 5. React TypeScript Development
**Location**: `skills/react-typescript-dev/`

Comprehensive React 18 + TypeScript + Vite + Tailwind guide:
- Project setup and configuration
- TypeScript patterns
- Performance optimization
- Testing (Vitest, React Testing Library, Playwright)

**Key Resources**:
- `references/advanced-patterns.md`
- `references/tailwind-utilities.md`
- `assets/` - Project templates and configs

---

### 6. Express PostgreSQL API
**Location**: `skills/express-postgres-api/`

Production-ready Express.js + PostgreSQL API development:
- Complete project template
- Layered architecture
- Security best practices
- Database patterns

**Key Resources**:
- `assets/express-postgres-template/` - Full project scaffold
- `references/database_patterns.md`
- `references/api_conventions.md`
- `references/security_checklist.md`
- `scripts/generate_endpoint.py` - CRUD generator
- `scripts/generate_migration.py` - Migration generator

---

### 7. Task Tracker
**Location**: `skills/task-tracker/`

File-based task management with dependency tracking:
- Task creation and status management
- Dependency validation
- Sprint board visualization
- Integration with change requests

**Key Resources**:
- `scripts/task_manager.py` - Core task management
- `references/task_schema.md`
- `assets/active-sprint-template.json`

## Available Agents

### 1. Product Owner Agent
**File**: `agents/product-owner.md`

**Role**: Planning and coordination

**Responsibilities**:
- Requirements research and analysis
- Change request creation
- Feature decomposition into tasks
- Task assignment to specialized agents
- Acceptance criteria definition
- Validation of completed work

**Skills Used**: product-owner-agent, task-tracker

**Output**: Change requests, task breakdowns, validation reports

---

### 2. Frontend Developer Agent
**File**: `agents/frontend-developer.md`

**Role**: UI/UX implementation

**Tech Stack**: React 18, TypeScript, Vite, Tailwind CSS, Vitest

**Responsibilities**:
- Build React components with TypeScript
- Implement responsive designs
- Form handling and validation
- API integration
- State management
- Accessibility compliance
- Frontend testing

**Skills Used**: frontend-developer-agent, react-typescript-dev

**Output**: Components, tests, implementation summary

---

### 3. Backend Developer Agent
**File**: `agents/backend-developer.md`

**Role**: API and database implementation

**Tech Stack**: Node.js, Express.js, TypeScript, PostgreSQL

**Responsibilities**:
- Design and implement RESTful APIs
- Database schema design
- Migration creation
- Business logic implementation
- Authentication/authorization
- Security hardening
- Integration testing

**Skills Used**: backend-developer-agent, express-postgres-api

**Output**: API endpoints, database migrations, tests, API documentation

---

### 4. QA Validator Agent
**File**: `agents/qa-validator.md`

**Role**: Quality assurance and validation

**Responsibilities**:
- Validate against acceptance criteria
- Functional and security testing
- Code quality review
- Test coverage verification
- Performance validation
- Accessibility checking
- Provide detailed feedback

**Output**: Validation reports (APPROVED / CHANGES_REQUESTED)

## Workflows

### Complete Feature Development

```
1. User Request
   "Add user authentication with login and registration"

2. Product Owner Agent
   ├─> Research authentication best practices
   ├─> Create change request (CR-001)
   └─> Break down into tasks:
       ├─ TASK-001: Database schema for users
       ├─ TASK-002: Registration API endpoint
       ├─ TASK-003: Login API endpoint
       ├─ TASK-004: Registration form UI
       └─ TASK-005: Login form UI

3. Development Phase (Parallel)
   Backend Agent:
   ├─> TASK-001: Create users table migration
   ├─> TASK-002: Implement registration endpoint
   └─> TASK-003: Implement login endpoint

   Frontend Agent (after backend):
   ├─> TASK-004: Build registration form
   └─> TASK-005: Build login form

4. QA Validation
   ├─> Test all acceptance criteria
   ├─> Security review
   ├─> Test coverage check
   └─> Decision: APPROVED ✅

5. Integration & Deployment
   └─> Feature ready for production
```

### Task Management Workflow

```
1. Create Tasks from Change Request
   $ python3 skills/task-tracker/scripts/task_manager.py create \
     CR-001-T1 "Create users table" \
     --priority high --estimate 4

2. Start Working on Task
   $ python3 skills/task-tracker/scripts/task_manager.py start CR-001-T1

3. Complete Task
   $ python3 skills/task-tracker/scripts/task_manager.py complete CR-001-T1

4. View Sprint Board
   $ python3 skills/task-tracker/scripts/task_manager.py show-status
```

## Usage Examples

### Example 1: Building a New API Endpoint

**Using Backend Developer Agent**:

```
User: "Create an API endpoint for managing products"

Agent Process:
1. Reviews task requirements
2. Designs database schema (products table)
3. Creates migration file
4. Implements layered architecture:
   ├─ Repository (data access)
   ├─ Service (business logic)
   ├─ Controller (HTTP handling)
   └─ Routes (endpoint definitions)
5. Adds validation with Zod
6. Implements authentication
7. Writes integration tests
8. Reports completion with API documentation
```

### Example 2: Building a React Component

**Using Frontend Developer Agent**:

```
User: "Create a user profile component with edit functionality"

Agent Process:
1. Reviews requirements and design
2. Creates TypeScript interfaces
3. Builds ProfileView component
4. Builds ProfileEdit component with form validation
5. Implements API integration
6. Adds error and loading states
7. Ensures responsive design
8. Writes component tests
9. Reports completion with usage examples
```

### Example 3: Orchestrated Feature Development

**Using Dev Workflow Orchestrator**:

```
User: "new feature: Add shopping cart functionality"

Workflow:
1. Product Owner Agent creates change request
   └─> 8 tasks identified across frontend/backend

2. Task execution plan generated:
   Wave 1 (parallel):
   ├─> Backend: Database schema
   └─> Backend: Cart API endpoints

   Wave 2 (parallel, depends on Wave 1):
   ├─> Frontend: Cart UI components
   └─> Frontend: Checkout flow

3. Each task validated by QA Agent

4. Integration and deployment
```

## Directory Structure

```
skils/
├── README.md                          # This file
├── workflow-template.md               # Workflow documentation template
│
├── skills/                            # Implementation guides
│   ├── product-owner-agent/
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── research_methodology.md
│   │       ├── task_breakdown_guide.md
│   │       └── agent_assignment_rules.md
│   │
│   ├── dev-workflow-orchestrator/
│   │   ├── SKILL.md
│   │   ├── references/
│   │   ├── scripts/
│   │   └── assets/
│   │
│   ├── backend-developer-agent/
│   │   └── SKILL.md
│   │
│   ├── frontend-developer-agent/
│   │   └── SKILL.md
│   │
│   ├── react-typescript-dev/
│   │   ├── SKILL.md
│   │   ├── references/
│   │   └── assets/
│   │
│   ├── express-postgres-api/
│   │   ├── SKILL.md
│   │   ├── references/
│   │   ├── scripts/
│   │   └── assets/
│   │       └── express-postgres-template/
│   │
│   └── task-tracker/
│       ├── SKILL.md
│       ├── references/
│       ├── scripts/
│       └── assets/
│
└── agents/                            # Agent role definitions
    ├── product-owner.md
    ├── frontend-developer.md
    ├── backend-developer.md
    └── qa-validator.md
```

## Key Features

### Skills System
- ✅ Detailed implementation guides
- ✅ Templates and boilerplate code
- ✅ Best practices and patterns
- ✅ Executable scripts and utilities
- ✅ Reference documentation
- ✅ Technology-specific guidance

### Agents System
- ✅ Role-based specialization
- ✅ Clear responsibilities and workflows
- ✅ Integration patterns
- ✅ Quality standards
- ✅ Reporting formats
- ✅ Skills utilization

### Workflow Orchestration
- ✅ Multi-agent coordination
- ✅ Parallel task execution
- ✅ Dependency management
- ✅ State tracking
- ✅ Quality gates
- ✅ Validation checkpoints

## Technology Coverage

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Vitest / React Testing Library / Playwright
- React Query / SWR
- Zustand / Redux

### Backend
- Node.js
- Express.js
- TypeScript
- PostgreSQL
- JWT Authentication
- Zod Validation
- Vitest / Jest / Supertest

### DevOps & Tools
- Docker
- Database Migrations
- Task Management
- Change Request Tracking
- Sprint Planning

## Best Practices

### Using Skills
1. Read the SKILL.md file first for overview
2. Review reference documentation for details
3. Use templates and scripts to accelerate development
4. Follow the recommended workflows
5. Adapt patterns to your specific needs

### Using Agents
1. Assign tasks with clear acceptance criteria
2. Provide complete context and requirements
3. Let agents use their specialized skills
4. Review agent outputs thoroughly
5. Iterate based on QA feedback

### Workflow Orchestration
1. Start with Product Owner for planning
2. Execute tasks in optimal sequence (consider parallelization)
3. Validate each task before proceeding
4. Maintain state and progress tracking
5. Document decisions and changes

## Contributing

To add new skills or agents:

### Adding a New Skill

1. Create directory: `skills/your-skill-name/`
2. Create `SKILL.md` with frontmatter:
   ```yaml
   ---
   name: your-skill-name
   description: Brief description of the skill
   ---
   ```
3. Add content following existing skill patterns
4. Include reference docs in `references/`
5. Add templates in `assets/`
6. Add scripts in `scripts/` (if needed)
7. Update this README

### Adding a New Agent

1. Create file: `agents/your-agent.md`
2. Define:
   - When to use the agent
   - Core responsibilities
   - Implementation workflow
   - Skills utilized
   - Reporting format
   - Success criteria
3. Update this README

### Guidelines

- Keep documentation clear and actionable
- Include practical examples
- Follow existing formatting patterns
- Test scripts and templates before committing
- Update README with new capabilities

## License

[Specify your license here]

## Support

For questions or issues:
- Review the skill documentation in `skills/*/SKILL.md`
- Check agent definitions in `agents/*.md`
- Review reference documentation in `skills/*/references/`

---

**Last Updated**: October 29, 2025

**Version**: 1.0.0
