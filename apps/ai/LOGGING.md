# Python Logging - Minimal & Clean

## Philosophy

**Show only what matters** - the AI agent's decision flow. No framework noise.

## What You'll See

### Normal Conversation

```
──────────────────────────────────────────────────────────────────────
▶ DETECT_ACTIVITY
19:15:30 | INFO | [detect_activity] No activity needed → conversation
✓ DETECT_ACTIVITY
──────────────────────────────────────────────────────────────────────

──────────────────────────────────────────────────────────────────────
▶ GENERATE_RESPONSE
19:15:32 | INFO | [generate_response] Using memories
  count: 2
✓ GENERATE_RESPONSE
──────────────────────────────────────────────────────────────────────
```

### Activity Detected

```
──────────────────────────────────────────────────────────────────────
▶ DETECT_ACTIVITY
19:15:30 | INFO | [detect_activity] Activity detected → routing
  activity: breathing
  confidence: 85%
✓ DETECT_ACTIVITY
──────────────────────────────────────────────────────────────────────

──────────────────────────────────────────────────────────────────────
▶ BREATHING_EXERCISE
19:15:32 | INFO | [breathing_exercise] Selected technique
  technique: Box Breathing
✓ BREATHING_EXERCISE
──────────────────────────────────────────────────────────────────────
```

## Benefits

✅ **Minimal** - Only agent decisions, no framework noise
✅ **Clear flow** - Visual separators show node execution
✅ **Easy to scan** - Context on separate lines
✅ **Color-coded** - Cyan (INFO), Yellow (WARNING), Red (ERROR)

## What's Hidden

All these are suppressed to ERROR-only:

- LangGraph framework logs
- HTTP request/response logs
- Worker queue stats
- Browser opener messages

You only see them if something goes wrong.

## Usage

Just restart the dev server:

```bash
pnpm dev:ai
```

Logging is auto-configured!

## Advanced

### Enable Debug Logging

```python
import logging
logging.getLogger("node").setLevel(logging.DEBUG)
```

### Show Framework Logs

```python
import logging
logging.getLogger("langgraph_api").setLevel(logging.INFO)
```

### Show HTTP Requests

```python
import logging
logging.getLogger("httpx").setLevel(logging.INFO)
```

## Implementation

- `apps/ai/src/logging_config.py` - Minimal logging setup
- All nodes use `NodeLogger` class
- Framework logs suppressed by default
- Only errors shown from third-party code
