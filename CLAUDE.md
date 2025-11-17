# CLAUDE.md - AI Assistant Guide for SistemaLabG

## Project Overview

**SistemaLabG** (Sistema Web de Gestión de Servicios de un Laboratorio) is a Clinical Laboratory Management System designed to streamline laboratory operations, patient management, appointment scheduling, and test result reporting.

### Project Status

The repository recently underwent a major refactor (November 2025):
- Previous implementation with backend (Node.js/NestJS), frontend (React/Next.js), and database directories was removed
- Project is in a documentation and planning phase
- Software directory structure is being reorganized

## Repository Structure

```
SistemaLabG/
├── README.md                          # Main project README
├── .gitignore                        # Git ignore rules
├── CLAUDE.md                         # This file - AI assistant guide
└── SistemaWebLaboratorio/
    ├── Documentos/                   # Project documentation
    │   ├── 01_Alcance/              # Project scope
    │   ├── 02_CasosDeUso/           # Use cases
    │   ├── 03_HistoriasDeUsuario/   # User stories
    │   ├── 04_Requerimientos/       # Requirements (functional & non-functional)
    │   ├── 05_Tecnologias/          # Technology stack decisions
    │   └── 06_Arquitectura/         # Architecture documentation
    └── Software/                     # Application source code (currently empty)
        └── .claude/                  # Claude Code configuration
            └── settings.local.json   # Permission settings
```

## Documentation Structure

The project follows a structured documentation approach in `SistemaWebLaboratorio/Documentos/`:

### 01_Alcance (Scope)
- General objectives
- Specific objectives
- Out of scope items
- Deliverables
- Assumptions and dependencies

### 02_CasosDeUso (Use Cases)
- Actor definitions
- Use case diagrams
- Detailed use case descriptions:
  - ID and Name
  - Actors
  - Preconditions
  - Basic flow
  - Alternate flows
  - Postconditions
  - Business rules

### 03_HistoriasDeUsuario (User Stories)
- Format: "Como [rol] quiero [necesidad] para [beneficio]"
- Prioritized backlog
- Acceptance criteria (Gherkin format)
- Definition of Done (DoD)
- Traceability to use cases/requirements

### 04_Requerimientos (Requirements)
- Functional requirements (RF-XXX)
- Non-functional requirements (RNF-XXX)
- Constraints
- Assumptions

### 05_Tecnologias (Technologies)
Planned technology stack:
- **Backend**: Node.js/NestJS with TypeScript
- **Frontend**: React/Next.js/Vite with TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma or TypeORM
- **Package Manager**: pnpm/yarn/npm
- **Infrastructure**: Docker/docker-compose (optional)

### 06_Arquitectura (Architecture)
- Overall vision (layers, modules)
- C4 diagrams: Context, Containers, Components
- Interfaces and contracts
- Architecture Decision Records (ADRs)
- Quality aspects: logging, errors, validation, security

## Development Workflow

### Git Branch Strategy

The project uses a feature branch workflow:

1. **Branch Naming Convention**:
   - Feature branches: `claude/descriptive-name-{session-id}`
   - All Claude-created branches must start with `claude/` and end with the session ID

2. **Main Branch**:
   - The default branch is `main` (not explicitly set, but implied by repository structure)

3. **Workflow**:
   ```bash
   # Always work on feature branches
   git checkout -b claude/feature-name-{session-id}

   # Make changes and commit
   git add .
   git commit -m "feat: descriptive message"

   # Push to remote (with retry on network failures)
   git push -u origin claude/feature-name-{session-id}
   ```

### Commit Message Conventions

Follow conventional commit format:
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `refactor:` - Code refactoring
- `test:` - Test additions/modifications
- `chore:` - Maintenance tasks
- `style:` - Code style changes

**Examples**:
- `feat: implement patient appointment scheduling module`
- `docs: update architecture diagrams with authentication flow`
- `fix: resolve database connection timeout in test results endpoint`

### Pull Request Guidelines

When creating PRs:
1. Use descriptive titles that summarize the change
2. Include a summary section with 1-3 bullet points
3. Provide a test plan with actionable items
4. Reference related issues or user stories
5. Use `gh pr create` command with proper formatting

## Key Conventions for AI Assistants

### 1. File Organization

- **Documentation**: Keep all documentation in `SistemaWebLaboratorio/Documentos/`
  - Use the templates defined in each subdirectory README
  - Maintain consistency across documentation sections

- **Source Code**: Place application code in `SistemaWebLaboratorio/Software/`
  - Follow the planned architecture (backend, frontend, database structure)
  - Use TypeScript for all application code

### 2. Code Style

- **Language**: TypeScript for both backend and frontend
- **Naming Conventions**:
  - camelCase for variables and functions
  - PascalCase for classes and components
  - UPPER_SNAKE_CASE for constants
  - Use descriptive, meaningful names in Spanish or English (consistent within modules)

### 3. Documentation Standards

- **README Files**: Each major directory should have a README.md explaining its purpose and structure
- **Code Comments**: Use JSDoc/TSDoc style comments for functions and classes
- **Inline Comments**: Write comments in Spanish or English (match project convention)
- **ADRs**: Document significant architectural decisions in `06_Arquitectura/`

### 4. Testing

- Write unit tests for business logic
- Write integration tests for API endpoints
- Include test plans in user stories and documentation
- Ensure tests pass before committing

### 5. Security

- Never commit sensitive data (.env files, credentials, secrets)
- Validate all user inputs
- Implement proper authentication and authorization
- Follow OWASP Top 10 guidelines
- Use parameterized queries to prevent SQL injection

### 6. Error Handling

- Use proper error handling patterns
- Log errors appropriately
- Provide meaningful error messages
- Implement proper HTTP status codes for API responses

## Recent Changes and Context

### Major Refactor (November 2025)

The repository underwent a significant cleanup:

**Removed**:
- `backend/` directory (Node.js/NestJS implementation)
- `frontend/` directory (React/Next.js implementation)
- `database/` directory (SQL schemas and migrations)
- Various configuration files (.gitignore, .editorconfig, .gitattributes)
- Temporary files and SQL schemas in Software directory

**Reason**: Project reset for proper documentation-first approach and clean architecture implementation

**Previous Features** (for context):
- Patient portal with modern UI
- Enhanced sidebar navigation with user profile
- Advanced validations and security
- Activity stats and visualizations

## Working with This Repository

### For Implementation Tasks

1. **Start with Documentation**: Before implementing features, ensure they are properly documented in the relevant Documentos sections
2. **Follow Architecture**: Reference `06_Arquitectura/` for design decisions
3. **Trace Requirements**: Link implementation to user stories and requirements
4. **Test-Driven**: Write tests alongside implementation

### For Documentation Tasks

1. **Use Templates**: Each documentation folder has a structure template in its README
2. **Maintain Consistency**: Follow the established format across all documentation
3. **Cross-Reference**: Link related documents (e.g., user stories to use cases)
4. **Version Control**: Commit documentation changes with clear commit messages

### For Refactoring Tasks

1. **Document First**: Update architecture documentation before major refactors
2. **Incremental Changes**: Break large refactors into smaller, reviewable commits
3. **Maintain Tests**: Ensure existing tests still pass or update them accordingly
4. **Update Documentation**: Keep code and documentation in sync

## Claude Code Configuration

The `.claude/settings.local.json` file contains permission settings for Claude Code operations. Current permissions allow:
- File tree operations
- Directory listing commands
- Module exploration

**Note**: The current configuration references old Windows paths that should be updated when the Software directory is repopulated.

## Project-Specific Commands

### Common Tasks

```bash
# View project structure
ls -R SistemaWebLaboratorio/

# Find documentation on a specific topic
grep -r "keyword" SistemaWebLaboratorio/Documentos/

# Check git status
git status

# View recent commits
git log --oneline -10

# Create a new feature branch
git checkout -b claude/feature-name-{session-id}
```

## Best Practices for AI Assistants

1. **Always Read Before Writing**: Use the Read tool before making changes to files
2. **Prefer Editing to Creating**: Edit existing files rather than creating new ones unless necessary
3. **Use TodoWrite**: Track multi-step tasks with the TodoWrite tool
4. **Parallel Operations**: Run independent operations in parallel when possible
5. **Security First**: Never introduce vulnerabilities (SQL injection, XSS, command injection, etc.)
6. **Documentation Updates**: Update relevant documentation when changing code
7. **Commit Frequently**: Make atomic commits with clear messages
8. **Test Before Committing**: Ensure code works before committing

## Questions and Issues

- For general help: Use `/help` command
- For feedback or issues: https://github.com/anthropics/claude-code/issues
- For project-specific questions: Review the relevant documentation section first

## Future Considerations

As the project evolves from its current documentation phase to active development:

1. **Package Configuration**: Add package.json, tsconfig.json, and other configuration files
2. **Database Schema**: Implement database migrations and seeding
3. **CI/CD Pipeline**: Set up automated testing and deployment
4. **Environment Configuration**: Implement proper .env handling and environment-specific configs
5. **API Documentation**: Add OpenAPI/Swagger documentation for REST APIs
6. **Docker Setup**: Create Dockerfile and docker-compose.yml for containerization

---

**Last Updated**: 2025-11-17
**Project Phase**: Documentation and Planning
**AI Assistant**: Claude Code via Anthropic SDK
