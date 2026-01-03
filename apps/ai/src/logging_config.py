"""
============================================================================
Logging Configuration
============================================================================
Custom logging setup for better readability and debugging.

Configures logging with:
- Clean, readable output with line breaks
- Better timestamp formatting
- Visual separators for node execution
- Context information formatted nicely
============================================================================
"""

import logging
import sys

# ============================================================================
# ANSI Color Codes for Terminal Output
# ============================================================================


class Colors:
    """ANSI color codes for colored terminal output."""

    RESET = "\033[0m"
    BOLD = "\033[1m"
    DIM = "\033[2m"

    # Log levels
    INFO = "\033[36m"  # Cyan
    WARNING = "\033[33m"  # Yellow
    ERROR = "\033[31m"  # Red
    DEBUG = "\033[35m"  # Magenta

    # Node lifecycle
    NODE_START = "\033[32m"  # Green
    NODE_END = "\033[34m"  # Blue

    # Context
    KEY = "\033[90m"  # Gray
    VALUE = "\033[37m"  # White


# ============================================================================
# Custom Formatter
# ============================================================================


class ReadableFormatter(logging.Formatter):
    """
    Custom log formatter with better readability.

    Features:
    - Colored output based on log level
    - Clean timestamp format
    - Multi-line support
    - Context key-value pairs on separate lines
    """

    def format(self, record: logging.LogRecord) -> str:
        """Format log record with colors and structure."""
        # Format timestamp
        timestamp = self.formatTime(record, "%H:%M:%S")

        # Color code based on level
        level_colors = {
            "DEBUG": Colors.DEBUG,
            "INFO": Colors.INFO,
            "WARNING": Colors.WARNING,
            "ERROR": Colors.ERROR,
        }
        level_color = level_colors.get(record.levelname, Colors.RESET)

        # Build the main log line
        parts = [
            f"{Colors.DIM}{timestamp}{Colors.RESET}",
            f"{level_color}{record.levelname:8}{Colors.RESET}",
            f"{Colors.BOLD}{record.name}{Colors.RESET}",
            record.getMessage(),
        ]

        log_line = " | ".join(parts)

        # Add context if available (stored in record.__dict__)
        context_items = []
        for key, value in record.__dict__.items():
            # Skip standard logging attributes
            if key not in {
                "name",
                "msg",
                "args",
                "created",
                "filename",
                "funcName",
                "levelname",
                "levelno",
                "lineno",
                "module",
                "msecs",
                "message",
                "pathname",
                "process",
                "processName",
                "relativeCreated",
                "thread",
                "threadName",
                "exc_info",
                "exc_text",
                "stack_info",
                "taskName",
            }:
                context_items.append(
                    f"  {Colors.KEY}{key}{Colors.RESET}: {Colors.VALUE}{value}{Colors.RESET}"
                )

        if context_items:
            log_line += "\n" + "\n".join(context_items)

        return log_line


# ============================================================================
# Configuration Function
# ============================================================================


def configure_logging(dev_mode: bool = True) -> None:
    """
    Configure application logging with readable formatting.

    Args:
        dev_mode: If True, uses human-readable console output with colors.
                  If False, uses simple text formatting.
    """
    # Get root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.WARNING)  # Default: only warnings and errors

    # Remove existing handlers
    root_logger.handlers.clear()

    # Create console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.DEBUG)  # Handler accepts all levels

    # Set formatter based on mode
    if dev_mode:
        formatter = ReadableFormatter()
    else:
        # Production: Simple text format
        formatter = logging.Formatter(
            "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )

    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)

    # Suppress noisy third-party libraries completely (only show errors)
    logging.getLogger("httpx").setLevel(logging.ERROR)
    logging.getLogger("httpcore").setLevel(logging.ERROR)
    logging.getLogger("langgraph_api").setLevel(logging.ERROR)
    logging.getLogger("langgraph_runtime").setLevel(logging.ERROR)
    logging.getLogger("langgraph_runtime_inmem").setLevel(logging.ERROR)
    logging.getLogger("browser_opener").setLevel(logging.ERROR)

    # Enable INFO logging only for our custom node loggers
    # This shows the agent's decision-making process
    logging.getLogger("node").setLevel(logging.INFO)


# ============================================================================
# Custom Node Logger
# ============================================================================


class NodeLogger:
    """
    Specialized logger for LangGraph nodes with better formatting.

    Provides convenient methods for logging node execution with
    clear visual separation and context information.
    """

    def __init__(self, node_name: str) -> None:
        """Initialize node logger with specific node name."""
        self.node_name = node_name
        self.logger = logging.getLogger(f"node.{node_name}")

    def node_start(self, **context: object) -> None:
        """Log node execution start with visual separator."""
        separator = "─" * 70
        message = f"\n{separator}\n▶ {self.node_name.upper()}"
        self._log_with_context(logging.INFO, message, context)

    def node_end(self, **context: object) -> None:
        """Log node execution end with visual separator."""
        separator = "─" * 70
        message = f"✓ {self.node_name.upper()}\n{separator}\n"
        self._log_with_context(logging.INFO, message, context)

    def info(self, message: str, **context: object) -> None:
        """Log info message with node context."""
        formatted_msg = f"[{self.node_name}] {message}"
        self._log_with_context(logging.INFO, formatted_msg, context)

    def debug(self, message: str, **context: object) -> None:
        """Log debug message with node context."""
        formatted_msg = f"[{self.node_name}] {message}"
        self._log_with_context(logging.DEBUG, formatted_msg, context)

    def warning(self, message: str, **context: object) -> None:
        """Log warning message with node context."""
        formatted_msg = f"[{self.node_name}] {message}"
        self._log_with_context(logging.WARNING, formatted_msg, context)

    def error(self, message: str, **context: object) -> None:
        """Log error message with node context."""
        formatted_msg = f"[{self.node_name}] {message}"
        self._log_with_context(logging.ERROR, formatted_msg, context)

    def _log_with_context(self, level: int, message: str, context: dict[str, object]) -> None:
        """
        Internal method to log with context as extra fields.

        This allows the formatter to access context values for pretty printing.
        """
        self.logger.log(level, message, extra=context)


# ============================================================================
# Initialize logging on module import
# ============================================================================

# Auto-configure logging when module is imported
# Uses dev mode by default for local development
configure_logging(dev_mode=True)
