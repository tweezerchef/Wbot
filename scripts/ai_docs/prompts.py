"""
AI prompts for documentation generation.

This module contains specialized prompts for different types of documentation
that Claude will use when generating or updating docs.
"""

# Base system prompt for all doc generation
SYSTEM_PROMPT = """You are a technical documentation writer for the Wbot project, 
an AI wellness chatbot. You write clear, concise documentation that follows 
Docusaurus conventions.

Key guidelines:
- Use proper Docusaurus frontmatter (sidebar_position, title, etc.)
- Include Mermaid diagrams for data flow and architecture
- Show real code examples from the codebase
- Use admonitions (:::tip, :::warning, :::info) for important notes
- Keep explanations practical and developer-focused
- Link to related documentation where appropriate
"""

# Prompt for generating API reference documentation
API_REFERENCE_PROMPT = """Analyze the following code and generate API reference documentation.

Include:
1. Module/file overview (1-2 sentences)
2. All public functions/classes with:
   - Function signature
   - Parameter descriptions with types
   - Return value description
   - Code example showing typical usage
3. Any important constants or configuration

Format as Docusaurus markdown with proper frontmatter.

Code to document:
```{language}
{code}
```

Current documentation (if exists, update rather than replace):
{existing_doc}
"""

# Prompt for generating architecture documentation
ARCHITECTURE_PROMPT = """Analyze the following code and generate/update architecture documentation.

Include:
1. High-level overview of the component's role
2. Mermaid diagram showing data flow
3. Key classes/functions and their relationships
4. Integration points with other components
5. Configuration options

Format as Docusaurus markdown.

Code files:
{code_files}

Current documentation:
{existing_doc}
"""

# Prompt for generating component documentation
COMPONENT_PROMPT = """Analyze the following React component and generate documentation.

Include:
1. Component purpose and when to use it
2. Props interface with descriptions
3. Usage examples (basic and advanced)
4. Styling/customization notes
5. Link to Storybook stories if available

Format as Docusaurus markdown.

Component code:
```tsx
{code}
```

Current documentation:
{existing_doc}
"""

# Prompt for updating existing documentation
UPDATE_PROMPT = """The following source code has been modified. Update the documentation
to reflect these changes while preserving the existing structure and content where still valid.

Changes made:
{changes_summary}

Updated source code:
```{language}
{code}
```

Current documentation:
{existing_doc}

Generate the updated documentation, marking any significant changes with :::info admonitions.
"""

# Prompt for generating database schema documentation
SCHEMA_PROMPT = """Analyze the following SQL migrations and generate database schema documentation.

Include:
1. Table descriptions and purposes
2. Column definitions with types and constraints
3. Relationships between tables (as Mermaid ERD if complex)
4. Row Level Security (RLS) policies explained
5. Common queries for each table

SQL migrations:
{migrations}

Current documentation:
{existing_doc}
"""

# Prompt for detecting if documentation needs updating
NEEDS_UPDATE_PROMPT = """Analyze the code changes and determine if documentation needs updating.

Changes:
{diff}

Current documentation:
{existing_doc}

Respond with JSON:
{{
  "needs_update": true/false,
  "reason": "explanation if needs_update is true",
  "sections_affected": ["list", "of", "sections"],
  "priority": "high/medium/low"
}}

Documentation needs updating if:
- Function signatures changed
- New public APIs added
- Behavior changed significantly
- New features added

Documentation does NOT need updating for:
- Internal refactoring
- Bug fixes without behavior change
- Code formatting
- Comment changes
"""


def get_prompt_for_file_type(file_path: str) -> str:
    """
    Get the appropriate prompt template based on file type.
    
    Args:
        file_path: Path to the source file
        
    Returns:
        The prompt template string
    """
    if file_path.endswith('.py'):
        if 'nodes/' in file_path or 'graph/' in file_path:
            return ARCHITECTURE_PROMPT
        return API_REFERENCE_PROMPT
    elif file_path.endswith('.tsx'):
        if 'components/' in file_path:
            return COMPONENT_PROMPT
        return API_REFERENCE_PROMPT
    elif file_path.endswith('.ts'):
        return API_REFERENCE_PROMPT
    elif file_path.endswith('.sql'):
        return SCHEMA_PROMPT
    else:
        return API_REFERENCE_PROMPT
