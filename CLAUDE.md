# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **FastMCP Starter Kit** - a Japanese-language educational project designed to help beginners learn MCP (Model Context Protocol) server development using the FastMCP framework. The project provides tutorials, templates, and comprehensive documentation for building MCP servers that support both SSE (Server-Sent Events) and STDIO communication protocols.

## Project Status

⚠️ **This is currently a documentation and planning repository.** The actual FastMCP implementation is not yet present in the codebase.

### What Currently Exists
- Comprehensive project documentation in `project-docs/` (Japanese)
- Tutorial structure in `tutorials/` directory
- Project configuration in `project-config.yaml`
- Cursor IDE rules in `.cursor/rules/project-design.mdc`

### What Needs to Be Implemented
- Source code in `src/` directory
- Requirements and dependency files
- Test suite
- Build and deployment scripts

## Future Commands (When Implementation is Complete)

The following commands are planned based on the project documentation:

### Environment Setup
```bash
# Virtual environment setup (to be implemented)
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# Install dependencies (requires requirements.txt)
pip install -r requirements.txt
```

### Development Commands (Planned)
```bash
# Run MCP server in SSE mode (to be implemented)
python src/main.py --mode production
python src/main.py --transport sse

# Run MCP server in STDIO mode
python src/main.py --transport stdio

# Run in learning mode
python src/main.py --mode learning
```

### Quality Assurance (Planned)
```bash
# Code formatting (when src/ exists)
black src/ tests/

# Linting
flake8 src/ tests/

# Type checking
mypy src/

# Security check
bandit -r src/

# Run all tests with coverage
pytest tests/ --cov=src --cov-report=term-missing
```

## Architecture Overview

The project follows a **layered architecture** with educational focus:

### Core Components
- **FastMCP Communication Layer**: Handles both SSE and STDIO transport protocols
- **MCP Server Core Engine**: Implements MCP protocol with Tools, Resources, and Prompts management
- **Tutorial & Learning System**: Provides progressive learning with progress tracking
- **Developer Tools**: Template generation, testing, and deployment helpers
- **Storage Layer**: SQLite database for lightweight, portable data persistence

### Key Design Patterns
- **Strategy Pattern**: For SSE/STDIO transport selection
- **Factory Pattern**: For project template generation
- **Transport Abstraction**: Unified interface for different communication modes

### Current Directory Structure
```
mcp-starter-kit/
├── project-docs/           # Comprehensive project documentation (Japanese)
│   ├── 01_requirements/        # Business and technical requirements
│   ├── 02_design/             # System architecture and design
│   ├── 03_development/        # Development standards and testing
│   └── 04_operations/         # Operations and deployment
├── tutorials/             # Step-by-step learning materials
│   ├── 01-basics.md           # Basic concepts
│   ├── 02-hello-world.md      # Hello World tutorial
│   ├── 03-data-handling.md    # Data handling
│   ├── 04-practical-usage.md  # Practical applications
│   ├── 05-deployment.md       # Deployment guide
│   ├── examples.md            # Example collection
│   ├── faq.md                # Frequently asked questions
│   └── troubleshooting.md     # Troubleshooting guide
├── .cursor/rules/          # Cursor IDE configuration
│   └── project-design.mdc     # Document management rules
├── CLAUDE.md               # This file
├── directory-structure.md   # Project structure documentation
└── project-config.yaml     # Basic project configuration
```

### Planned Directory Structure (To Be Implemented)
```
├── src/                    # Source code (to be created)
│   ├── core/              # MCP server core functionality
│   ├── features/          # MCP Tools, Resources, Prompts
│   ├── learning/          # Tutorial and learning system
│   └── utils/             # Utilities and helpers
├── tests/                 # Test suite (to be created)
├── templates/             # Project templates (to be created)
├── scripts/               # Development scripts (to be created)
└── requirements.txt       # Python dependencies (to be created)
```

## Development Standards

### Code Quality Requirements
- **Test Coverage**: ≥90%
- **Type Coverage**: ≥95% (use mypy)
- **Code Complexity**: ≤10 cyclomatic complexity
- **Documentation**: 100% docstring coverage for public APIs

### Python Coding Standards
- Follow PEP 8 with Black formatting
- **Type hints required** for all functions
- **Async/await** patterns for I/O operations
- **Error handling** with custom exception classes
- **Comprehensive docstrings** with Args, Returns, Raises, Examples

### FastMCP Specific Patterns
```python
# Standard MCP tool pattern
@app.tool()
async def tool_name(parameter: str) -> str:
    """Tool description with proper docstring"""
    # Implementation
    return result

# Resource pattern
@app.resource("resource/{resource_id}")
async def get_resource(resource_id: str) -> str:
    """Resource description"""
    # Implementation
    return content

# Prompt pattern
@app.prompt()
async def prompt_name() -> str:
    """Prompt description"""
    return "Prompt content"
```

## Configuration Management

The project uses a multi-environment configuration system:

### Configuration Files
- `project-config.yaml`: Basic project settings and metadata
- `config.toml`: Environment-specific configurations (dev/prod/test)
- `.cursor/rules/project-design.mdc`: Cursor IDE rules for document management

### Environment Variables
- `FASTMCP_MODE`: "production" | "learning" | "development"
- `FASTMCP_TRANSPORT`: "sse" | "stdio"
- `FASTMCP_DEBUG`: Boolean for debug mode

## Important Notes for Development

### Learning-Focused Design
This project prioritizes educational value and beginner accessibility:
- Code should be **self-documenting** with extensive comments in Japanese
- Error messages should be **educational** rather than just technical
- Provide **progressive complexity** in tutorials and examples
- Include **best practice explanations** in documentation

### Japanese Language Support
- All user-facing documentation is in Japanese
- Error messages and help text should be in Japanese
- Comments in code should be in Japanese for educational content
- English is acceptable for technical implementation details

### Security Considerations
- Local-only operation (bind to 127.0.0.1)
- File system access limited to user directory
- Input validation using Pydantic models
- Secure logging (no sensitive data exposure)

### Performance Targets
- Server startup: ≤10 seconds
- Tool execution: ≤2 seconds
- Resource access: ≤1 second
- Memory usage: ≤256MB

## Testing Strategy

### Test Categories
1. **Unit Tests (70%)**: Individual component testing
2. **Integration Tests (20%)**: MCP protocol communication testing
3. **E2E Tests (10%)**: Complete learning workflow testing

### Special Testing Considerations
- Test both SSE and STDIO transport modes
- Validate educational content and progression
- Test error handling with beginner-friendly messages
- Performance testing for resource constraints

## Current Working With Documentation

This repository currently contains extensive Japanese documentation that should be maintained according to the rules in `.cursor/rules/project-design.mdc`:

### Key Documentation Management Rules
- **Document Dependency Chain**: Requirements → Design → Development → Operations
- **Metadata Tracking**: All documents include version, dependencies, and impact tracking
- **Consistency Maintenance**: Use `directory-structure.md` as the source of truth for file organization
- **Update Protocol**: When changing requirements, propagate updates through dependent documents
- **Language Standard**: User-facing documentation in Japanese, technical implementation details may be in English

### Working with Project Documents
- Documents in `project-docs/` follow a strict dependency hierarchy
- Changes to upstream documents (requirements) must trigger updates to downstream documents (design, development)
- All documents include comprehensive metadata headers with version tracking
- Use the project configuration in `project-config.yaml` for consistent authoring information

## Next Steps for Implementation

To transform this documentation repository into a working FastMCP starter kit:

### 1. Create Basic Project Structure
```bash
mkdir -p src/{core,features,learning,utils}
mkdir -p tests/{unit,integration,e2e}
mkdir -p scripts
mkdir -p templates
```

### 2. Initialize Python Environment
```bash
# Create requirements.txt based on development standards document
# Initialize setup.py for package management
# Add FastMCP dependencies as specified in project-docs/03_development/01_development_standards.md
```

### 3. Implement Core Components
Based on the architecture defined in `project-docs/02_design/01_system_architecture.md`:
- FastMCP Communication Layer (SSE/STDIO transport)
- MCP Server Core Engine
- Tutorial & Learning System
- Developer Tools

### 4. Following the Development Standards
Reference `project-docs/03_development/01_development_standards.md` for:
- Python coding standards and patterns
- FastMCP-specific implementation patterns
- Quality assurance requirements
- Testing strategy implementation