# Agent Assignment Rules

## Agent Types and Specializations

### Frontend Agent
**Specialization:** User interface, client-side logic, user experience

**Typical Technologies:**
- React, Vue, Angular, Svelte
- HTML, CSS, JavaScript/TypeScript
- State management (Redux, Zustand, Context API)
- CSS frameworks (Tailwind, Styled Components)
- Testing (Jest, React Testing Library, Cypress)

**Assign When Task Involves:**
- Creating/modifying UI components
- Implementing forms and validation (client-side)
- State management
- Routing and navigation
- Styling and responsive design
- Accessibility implementation
- Client-side API integration
- Frontend testing
- Performance optimization (lazy loading, code splitting)

**Example Tasks:**
- "Create user registration form with validation"
- "Implement product catalog with filters"
- "Add dark mode toggle"
- "Build responsive navigation menu"
- "Integrate charts/graphs for analytics dashboard"

### Backend Agent
**Specialization:** Server-side logic, APIs, databases, business logic

**Typical Technologies:**
- Node.js/Express, Python/Django, Java/Spring
- PostgreSQL, MongoDB, Redis
- REST APIs, GraphQL
- Authentication/Authorization (JWT, OAuth)
- ORM/Query builders (Prisma, Sequelize, TypeORM)
- Testing (Jest, Mocha, PyTest)

**Assign When Task Involves:**
- API endpoint implementation
- Business logic in services
- Database operations
- Authentication/authorization
- Data validation (server-side)
- Third-party API integration
- Background jobs/workers
- Email/notification services
- Backend testing
- Database migrations
- Middleware implementation

**Example Tasks:**
- "Implement user authentication service"
- "Create REST endpoints for product CRUD"
- "Add payment processing integration"
- "Implement email notification service"
- "Create database migration for new table"

### Database Agent
**Specialization:** Database design, optimization, migrations (typically handled by Backend Agent)

**Note:** Usually backend agent handles database tasks, but for large-scale database work, you might want a specialized database agent.

**Assign When Task Involves:**
- Complex schema design
- Database optimization
- Index strategy
- Query performance tuning
- Data migration (large datasets)
- Backup/recovery procedures
- Replication setup
- Database monitoring

**Example Tasks:**
- "Design database schema for multi-tenant application"
- "Optimize slow queries on orders table"
- "Implement database sharding strategy"
- "Set up read replicas for scaling"

### DevOps Agent
**Specialization:** Infrastructure, deployment, monitoring, CI/CD (typically handled by Backend Agent)

**Typical Technologies:**
- Docker, Kubernetes
- AWS, Azure, GCP
- GitHub Actions, Jenkins, CircleCI
- Terraform, CloudFormation
- Nginx, Load Balancers
- Monitoring (Prometheus, Grafana, DataDog)

**Assign When Task Involves:**
- CI/CD pipeline setup
- Deployment configuration
- Infrastructure as code
- Container orchestration
- Load balancing
- Monitoring and alerting
- Performance optimization
- Security hardening
- Log aggregation

**Example Tasks:**
- "Set up GitHub Actions for CI/CD"
- "Configure Docker containers for development"
- "Add application monitoring with DataDog"
- "Implement rate limiting at load balancer"
- "Set up automated backups"

### Fullstack Agent
**Specialization:** Features spanning frontend and backend (assign to either Frontend or Backend based on primary focus)

**Assign When Task Involves:**
- Integration work spanning frontend/backend
- Features requiring both UI and API
- End-to-end feature implementation
- Testing coordination

**Assignment Strategy:**
- If primarily UI work with some API calls → Frontend Agent
- If primarily backend work with some UI → Backend Agent
- If balanced → Assign to backend agent (tends to be more versatile)

**Example Tasks:**
- "Implement file upload feature end-to-end"
- "Add real-time notifications with WebSockets"
- "Integrate authentication across frontend and backend"

## Decision Tree for Agent Assignment

```
START
│
├─ Is this primarily UI work?
│  ├─ YES → Frontend Agent
│  └─ NO → Continue
│
├─ Is this primarily API/backend work?
│  ├─ YES → Backend Agent
│  └─ NO → Continue
│
├─ Is this database-specific work?
│  ├─ YES (complex) → Database Agent
│  ├─ YES (simple) → Backend Agent
│  └─ NO → Continue
│
├─ Is this infrastructure/deployment work?
│  ├─ YES (complex) → DevOps Agent
│  ├─ YES (simple) → Backend Agent
│  └─ NO → Continue
│
└─ Does it span multiple areas?
   ├─ Primarily frontend → Frontend Agent
   ├─ Primarily backend → Backend Agent
   └─ Balanced → Backend Agent (default)
```

## Assignment Rules by Task Type

### Feature Development

| Task Description | Primary Agent | Secondary Agent | Notes |
|-----------------|---------------|-----------------|-------|
| UI component creation | Frontend | - | Pure frontend work |
| API endpoint implementation | Backend | - | Pure backend work |
| Form with validation | Frontend | Backend | Frontend creates UI, backend validates |
| Database schema | Backend | Database | Backend for simple, Database for complex |
| Authentication system | Backend | Frontend | Backend owns auth, frontend integrates |
| File upload | Backend | Frontend | Backend handles storage, frontend uploads |
| Search functionality | Backend | Frontend | Backend implements, frontend displays |
| Real-time features | Backend | Frontend | Backend WebSocket, frontend client |
| Payment processing | Backend | Frontend | Backend integration, frontend checkout |

### Bug Fixes

| Bug Location | Agent | Notes |
|-------------|-------|-------|
| UI rendering issue | Frontend | Visual bugs, component issues |
| API returning wrong data | Backend | Service/repository logic bugs |
| Database query slow | Backend | Query optimization needed |
| Authentication failing | Backend | Auth logic issues |
| Form validation | Frontend | Client-side validation bugs |
| CSS/styling issue | Frontend | Layout, responsive design |
| API integration | Frontend | Client-side API call issues |
| Deployment failing | DevOps | CI/CD, infrastructure issues |

### Refactoring

| Refactoring Target | Agent | Notes |
|-------------------|-------|-------|
| React components | Frontend | Component structure, hooks |
| Backend services | Backend | Business logic, architecture |
| Database queries | Backend | Query optimization, ORM |
| API structure | Backend | Endpoint organization |
| State management | Frontend | Redux, Context, Zustand |
| Styling architecture | Frontend | CSS organization, theme |
| Infrastructure | DevOps | Deployment, containers |

### Testing

| Test Type | Agent | Notes |
|-----------|-------|-------|
| Unit tests (frontend) | Frontend | Component tests |
| Unit tests (backend) | Backend | Service/repository tests |
| Integration tests (API) | Backend | Endpoint tests |
| E2E tests | Frontend | User flow tests |
| Performance tests | Backend | Load testing, benchmarks |
| Security tests | Backend | Penetration testing |

## Multi-Agent Coordination

### When to Split Tasks

**Split into multiple tasks when:**
- Work can be done in parallel
- Different skill sets needed
- Clear interface between frontend/backend
- One part can be mocked/stubbed

**Example: User Authentication Feature**
```yaml
# Split approach (parallel work possible)
- TASK-001: Create auth backend service (Backend Agent)
- TASK-002: Create login form (Frontend Agent) # Can use mock API
- TASK-003: Integrate frontend with backend (Frontend Agent, depends on 1&2)
```

### When to Keep as Single Task

**Keep as single task when:**
- Work is tightly coupled
- Small feature (< 2 days)
- Splitting adds coordination overhead
- One agent can handle both sides

**Example: Add validation rule**
```yaml
# Single task approach (tight coupling, small)
- TASK-001: Add age validation (Backend Agent)
  # Includes: backend validation + frontend error display
```

## Agent Assignment by Tech Stack

### MERN Stack (MongoDB, Express, React, Node)
- Frontend: React components → Frontend Agent
- Backend: Express APIs → Backend Agent
- Database: MongoDB operations → Backend Agent

### PERN Stack (PostgreSQL, Express, React, Node)
- Frontend: React components → Frontend Agent
- Backend: Express APIs → Backend Agent
- Database: PostgreSQL operations → Backend Agent

### Django + React
- Frontend: React components → Frontend Agent
- Backend: Django views/APIs → Backend Agent
- Database: Django ORM → Backend Agent

### Spring Boot + Angular
- Frontend: Angular components → Frontend Agent
- Backend: Spring Boot services → Backend Agent
- Database: JPA/Hibernate → Backend Agent

## Special Considerations

### Mobile Development
If the project includes mobile apps:
- Assign to Frontend Agent
- Or create dedicated Mobile Agent
- Backend remains Backend Agent

### Microservices
If using microservices architecture:
- Each service → Backend Agent
- Frontend → Frontend Agent
- Infrastructure → DevOps Agent
- Consider service-specific agents for large teams

### Monorepo
If using monorepo structure:
- Frontend packages → Frontend Agent
- Backend packages → Backend Agent
- Shared packages → Based on content (usually Backend Agent)

## Agent Handoff Protocols

### Frontend to Backend Handoff
**When:** Frontend needs API endpoints

**Handoff includes:**
- API contract/specification
- Request/response formats
- Error handling requirements
- Performance requirements

**Example:**
```yaml
- TASK-001: Design and implement user profile API (Backend Agent)
  description: |
    Create API endpoints for user profile management.

    API Specification:
    GET /api/users/:id → Returns user profile
    PUT /api/users/:id → Updates user profile

    Response format: { id, email, firstName, lastName, avatar }

    Frontend needs this for user profile page.
```

### Backend to Frontend Handoff
**When:** Backend API ready for integration

**Handoff includes:**
- API endpoints and documentation
- Authentication requirements
- Error codes and handling
- Example requests/responses

**Example:**
```yaml
- TASK-002: Integrate user profile API in frontend (Frontend Agent)
  dependencies: [TASK-001]
  description: |
    Integrate user profile API in React components.

    Available endpoints:
    GET /api/users/:id (requires auth token)
    PUT /api/users/:id (requires auth token)

    Error codes:
    401: Unauthorized
    404: User not found
    422: Validation error
```

## Assignment Best Practices

1. **Default to Backend Agent** when uncertain (usually more versatile)
2. **Keep related work together** when possible
3. **Enable parallelization** through clear interfaces
4. **Document handoffs** clearly
5. **Consider agent expertise** if you know specific strengths
6. **Minimize context switching** by batching similar tasks
7. **Clear ownership** - one agent per task
8. **Coordination tasks** - assign to primary stakeholder agent
9. **Review/validation tasks** - assign to original implementer
10. **Documentation tasks** - assign based on what's being documented

## Examples by Feature Type

### Example: E-commerce Product Catalog

```yaml
tasks:
  - id: TASK-001
    title: "Create products database schema"
    agent: backend
    type: database

  - id: TASK-002
    title: "Implement product API endpoints"
    agent: backend
    type: backend
    dependencies: [TASK-001]

  - id: TASK-003
    title: "Create product listing page"
    agent: frontend
    type: frontend
    dependencies: [TASK-002]

  - id: TASK-004
    title: "Add product filters and search"
    agent: frontend
    type: frontend
    dependencies: [TASK-003]

  - id: TASK-005
    title: "Optimize product search queries"
    agent: backend
    type: database
    dependencies: [TASK-004]
```

### Example: Real-time Chat Feature

```yaml
tasks:
  - id: TASK-001
    title: "Set up WebSocket server"
    agent: backend
    type: backend

  - id: TASK-002
    title: "Implement chat message storage"
    agent: backend
    type: backend
    dependencies: [TASK-001]

  - id: TASK-003
    title: "Create chat UI components"
    agent: frontend
    type: frontend
    # Can start in parallel with backend work

  - id: TASK-004
    title: "Integrate WebSocket client"
    agent: frontend
    type: frontend
    dependencies: [TASK-001, TASK-003]

  - id: TASK-005
    title: "Add Redis for message queuing"
    agent: backend
    type: devops
    dependencies: [TASK-002]
```

### Example: Performance Optimization

```yaml
tasks:
  - id: TASK-001
    title: "Profile application performance"
    agent: backend
    type: backend

  - id: TASK-002
    title: "Optimize database queries"
    agent: backend
    type: database
    dependencies: [TASK-001]

  - id: TASK-003
    title: "Implement code splitting in frontend"
    agent: frontend
    type: frontend

  - id: TASK-004
    title: "Add Redis caching layer"
    agent: backend
    type: backend
    dependencies: [TASK-002]

  - id: TASK-005
    title: "Set up CDN for static assets"
    agent: devops
    type: devops
```

## Summary

**Quick Reference:**
- UI work → Frontend Agent
- API work → Backend Agent
- Database work → Backend Agent (or Database Agent for complex)
- Infrastructure → Backend Agent (or DevOps Agent for complex)
- Integrated features → Assign to primary focus area
- When uncertain → Backend Agent
