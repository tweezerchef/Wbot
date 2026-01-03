---
event: PostToolUse
tool: Write,StrReplace
match_path: 'apps/(ai|web)/src/**/*.(py|ts|tsx)'
---

# Documentation Update Hook

When source code files are modified, check if documentation needs to be updated.

## Instructions

After editing source files in `apps/ai/src/` or `apps/web/src/`, analyze whether documentation updates are needed:

### File-to-Doc Mapping

| Source Pattern                | Documentation File                            |
| ----------------------------- | --------------------------------------------- |
| `apps/ai/src/nodes/*/node.py` | `docs/ai/langgraph.md`                        |
| `apps/ai/src/memory/*.py`     | `docs/ai/memory.md`                           |
| `apps/ai/src/graph/*.py`      | `docs/architecture/data-flow.md`              |
| `apps/web/src/components/*/`  | `docs/web/activities.md` or new component doc |
| `apps/web/src/lib/*.ts`       | `docs/web/{filename}.md`                      |

### When to Update Docs

**DO suggest doc updates when:**

- Function signatures change (parameters, return types)
- New public functions/classes are added
- Behavior changes significantly
- New activity types are added
- API contracts change

**DO NOT suggest doc updates for:**

- Internal refactoring that does not change public API
- Bug fixes that do not change behavior
- Code formatting changes
- Comment-only changes

### Documentation Style

Follow the existing documentation style in `docs/`:

- Use Docusaurus frontmatter (sidebar_position, etc.)
- Include Mermaid diagrams for data flow
- Show code examples from the actual codebase
- Use admonitions (:::tip, :::warning) for important notes

### Action

If documentation updates are needed, inform the user:

"Documentation may need updating:

- [doc file] - [reason]

Would you like me to update the documentation?"

If no documentation updates are needed, do not mention this hook.
