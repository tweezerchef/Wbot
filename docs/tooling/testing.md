# Testing Guide

This guide covers testing practices for the Wbot monorepo, including both the TypeScript frontend and Python backend.

---

## Quick Start

```bash
# Run all tests
pnpm test

# Run frontend tests only
pnpm test:web

# Run backend tests only
pnpm test:ai

# Run with coverage
pnpm test:coverage
```

---

## Testing Stack Overview

| Layer               | Framework           | Key Libraries                     |
| ------------------- | ------------------- | --------------------------------- |
| Frontend Unit       | Vitest              | @testing-library/react, happy-dom |
| Frontend Coverage   | @vitest/coverage-v8 | -                                 |
| Backend Unit        | pytest              | pytest-mock, pytest-asyncio       |
| Backend Integration | pytest              | Same as unit                      |

---

## Frontend Testing (TypeScript/React)

### Running Tests

```bash
cd apps/web

# Run tests in watch mode (development)
pnpm test

# Run tests once (CI)
pnpm test run

# Run with UI dashboard
pnpm test:ui

# Run with coverage report
pnpm test:coverage
```

### Configuration Files

- **`vitest.config.ts`** - Test runner configuration
- **`vitest.setup.ts`** - Global setup (jest-dom matchers, mocks)

### Writing Tests

Tests are colocated with source files:

```
src/
├── lib/
│   ├── parseActivity.ts
│   └── parseActivity.test.ts    # Tests next to implementation
└── components/
    └── Button/
        ├── Button.tsx
        └── Button.test.tsx
```

#### Basic Test Structure

```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from './myModule';

describe('myFunction', () => {
  it('should do something specific', () => {
    const result = myFunction('input');
    expect(result).toBe('expected output');
  });
});
```

#### Testing React Components

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent title="Hello" />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('handles user interaction', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<MyComponent onClick={onClick} />);
    await user.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalled();
  });
});
```

### Best Practices

1. **Test behavior, not implementation** - Focus on what the user sees and does
2. **Use `screen.getByRole`** - Queries by role promote accessibility
3. **Use `userEvent` over `fireEvent`** - More realistic user interactions
4. **Mock external dependencies** - API calls, Supabase, etc.
5. **Keep tests focused** - One assertion per test when possible

### Mocking

```typescript
import { vi } from 'vitest';

// Mock a module
vi.mock('./api', () => ({
  fetchData: vi.fn().mockResolvedValue({ data: 'mocked' }),
}));

// Mock a function
const mockFn = vi.fn().mockReturnValue('mocked value');

// Spy on console
vi.spyOn(console, 'error').mockImplementation(() => {});
```

---

## Backend Testing (Python)

### Running Tests

```bash
cd apps/ai

# Run all tests
uv run pytest

# Run with verbose output
uv run pytest -v

# Run specific test file
uv run pytest tests/unit/test_user_context.py

# Run specific test class or function
uv run pytest tests/unit/test_auth.py::TestVerifyToken::test_raises_when_header_missing

# Run with coverage
uv run pytest --cov=src --cov-report=html
```

### Project Structure

```
apps/ai/
├── tests/
│   ├── __init__.py
│   ├── conftest.py           # Shared fixtures
│   ├── unit/
│   │   ├── __init__.py
│   │   ├── test_user_context.py
│   │   └── test_auth.py
│   └── integration/
│       ├── __init__.py
│       └── test_breathing_node.py
└── src/
    └── ...
```

### Configuration

pytest is configured in `pyproject.toml`:

```toml
[tool.pytest.ini_options]
asyncio_mode = "auto"        # Auto-detect async tests
testpaths = ["tests"]        # Where to find tests
```

### Writing Tests

#### Basic Test Structure

```python
import pytest
from src.utils.user_context import format_user_context


def test_returns_message_when_context_is_none():
    """Should return generic message when no context provided."""
    result = format_user_context(None)
    assert "No user context available" in result
```

#### Async Tests

```python
import pytest

@pytest.mark.asyncio
async def test_async_function():
    """Tests async functions automatically."""
    result = await some_async_function()
    assert result == expected
```

#### Using Fixtures

Fixtures are defined in `conftest.py` and automatically available:

```python
def test_with_fixture(sample_user_context):
    """Fixtures are injected as parameters."""
    assert sample_user_context["display_name"] == "Alex"
```

#### Parametrized Tests

```python
@pytest.mark.parametrize("input,expected", [
    ("stress_anxiety", "managing stress and anxiety"),
    ("mood", "improving their mood"),
    ("sleep", "sleeping better"),
])
def test_goal_mapping(input, expected):
    context = {"preferences": {"primary_goal": input}}
    result = format_user_context(context)
    assert expected in result
```

### Mocking

#### Using pytest-mock

```python
def test_with_mock(mocker):
    """mocker fixture from pytest-mock."""
    mock_llm = mocker.patch("src.nodes.breathing_exercise.node.create_llm")
    mock_llm.return_value.ainvoke.return_value.content = "box"

    result = await select_technique_with_llm(state)
    assert result["id"] == "box"
```

#### Using unittest.mock

```python
from unittest.mock import AsyncMock, MagicMock, patch

@pytest.mark.asyncio
async def test_with_patch():
    mock_client = AsyncMock()
    mock_client.auth.get_user = AsyncMock(return_value=MagicMock(user=None))

    with patch("src.auth.acreate_client", return_value=mock_client):
        # Test code here
        pass
```

### Available Fixtures

From `tests/conftest.py`:

| Fixture                  | Description                         |
| ------------------------ | ----------------------------------- |
| `mock_env`               | Sets up mock environment variables  |
| `mock_supabase_client`   | Mock async Supabase client          |
| `mock_supabase_user`     | Sample Supabase user data           |
| `mock_supabase_profile`  | Sample user profile data            |
| `mock_llm`               | Mock LLM with configurable response |
| `sample_user_context`    | Sample user context dict            |
| `sample_wellness_state`  | Sample graph state with messages    |
| `mock_interrupt_start`   | HITL response: start exercise       |
| `mock_interrupt_change`  | HITL response: change technique     |
| `mock_interrupt_decline` | HITL response: decline              |

### Best Practices

1. **Use fixtures for common setup** - Keep tests DRY
2. **Mock external services** - Supabase, LLMs, Redis
3. **Test error paths** - Not just happy paths
4. **Use `pytest.raises`** - For exception testing
5. **Keep tests fast** - Mock slow operations

---

## Test Coverage

### Frontend Coverage

```bash
cd apps/web
pnpm test:coverage
```

Coverage report is generated in `apps/web/coverage/`:

- `index.html` - Open in browser for visual report
- `lcov.info` - For CI integration

### Backend Coverage

```bash
cd apps/ai
uv run pytest --cov=src --cov-report=html
```

Coverage report is generated in `apps/ai/htmlcov/`.

---

## CI Integration

Tests run automatically on:

- Pull requests
- Pushes to main branch

### GitHub Actions (example)

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm test:web run

  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: astral-sh/setup-uv@v4
      - run: cd apps/ai && uv sync
      - run: cd apps/ai && uv run pytest
```

---

## Troubleshooting

### Frontend

**Tests hang or timeout**

- Check for unresolved promises
- Ensure async operations are awaited
- Increase timeout in `vitest.config.ts`

**CSS/Style issues**

- CSS Modules are handled by Vite
- Check `vitest.setup.ts` for missing mocks

**Path alias errors**

- Verify `vite-tsconfig-paths` is configured
- Check `tsconfig.json` paths match

### Backend

**Async tests not running**

- Ensure `@pytest.mark.asyncio` decorator is present
- Check `asyncio_mode = "auto"` in `pyproject.toml`

**Import errors**

- Run tests from `apps/ai` directory
- Check `PYTHONPATH` includes `src/`

**Mock not working**

- Verify patch target matches import path
- Use `patch.object` for instance methods

---

## Adding New Tests

### Frontend Checklist

1. Create `*.test.ts` or `*.test.tsx` file next to source
2. Import from `vitest` and `@testing-library/react`
3. Use `describe` and `it` blocks for organization
4. Mock external dependencies
5. Run `pnpm test` to verify

### Backend Checklist

1. Create test file in `tests/unit/` or `tests/integration/`
2. Name file `test_*.py`
3. Add fixtures to `conftest.py` if reusable
4. Use `@pytest.mark.asyncio` for async tests
5. Run `uv run pytest` to verify

---

_Last updated: January 2025_
