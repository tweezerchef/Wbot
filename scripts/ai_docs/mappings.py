"""
Source file to documentation mapping configuration.

This module defines how source code files map to their corresponding
documentation files in the docs/ folder.
"""

import re
from dataclasses import dataclass
from pathlib import Path
from typing import Optional


@dataclass
class DocMapping:
    """Represents a mapping from source files to documentation."""

    source_pattern: str  # Glob pattern for source files
    doc_path: str  # Path to the documentation file
    doc_section: Optional[str] = None  # Optional section within the doc


# File-to-documentation mappings
MAPPINGS: list[DocMapping] = [
    # AI Backend - Nodes
    DocMapping(
        source_pattern="apps/ai/src/nodes/*/node.py",
        doc_path="docs/ai/langgraph.md",
        doc_section="Nodes",
    ),
    DocMapping(
        source_pattern="apps/ai/src/nodes/breathing_exercise/*.py",
        doc_path="docs/web/activities.md",
        doc_section="Breathing Exercise",
    ),
    DocMapping(
        source_pattern="apps/ai/src/nodes/meditation_guidance/*.py",
        doc_path="docs/web/activities.md",
        doc_section="Meditation",
    ),
    DocMapping(
        source_pattern="apps/ai/src/nodes/journaling_prompt/*.py",
        doc_path="docs/web/activities.md",
        doc_section="Journaling",
    ),
    # AI Backend - Memory System
    DocMapping(source_pattern="apps/ai/src/memory/*.py", doc_path="docs/ai/memory.md"),
    # AI Backend - Graph
    DocMapping(
        source_pattern="apps/ai/src/graph/*.py",
        doc_path="docs/architecture/data-flow.md",
    ),
    # AI Backend - Logging
    DocMapping(
        source_pattern="apps/ai/src/logging_config.py", doc_path="docs/ai/logging.md"
    ),
    # Web Frontend - Components
    DocMapping(
        source_pattern="apps/web/src/components/BreathingExercise/*.tsx",
        doc_path="docs/web/activities.md",
        doc_section="Breathing Exercise",
    ),
    DocMapping(
        source_pattern="apps/web/src/components/pages/*.tsx",
        doc_path="docs/architecture/overview.md",
        doc_section="Frontend Components",
    ),
    # Web Frontend - Library modules
    DocMapping(
        source_pattern="apps/web/src/lib/ai-client.ts", doc_path="docs/web/ai-client.md"
    ),
    DocMapping(
        source_pattern="apps/web/src/lib/supabase.ts", doc_path="docs/web/supabase.md"
    ),
    DocMapping(
        source_pattern="apps/web/src/lib/conversations.ts",
        doc_path="docs/web/supabase.md",
        doc_section="Conversations",
    ),
    DocMapping(
        source_pattern="apps/web/src/lib/parseActivity.ts",
        doc_path="docs/web/activities.md",
        doc_section="Activity Parsing",
    ),
    # Database (Supabase migrations)
    DocMapping(
        source_pattern="supabase/migrations/*.sql", doc_path="docs/database/schema.md"
    ),
]


def find_doc_for_source(source_path: str | Path) -> Optional[DocMapping]:
    """
    Find the documentation mapping for a given source file.

    Args:
        source_path: Path to the source file (relative to project root)

    Returns:
        DocMapping if found, None otherwise
    """
    source_str = str(source_path)

    for mapping in MAPPINGS:
        # Convert glob pattern to regex
        pattern = mapping.source_pattern
        pattern = pattern.replace("**", ".*")
        pattern = pattern.replace("*", "[^/]*")
        pattern = pattern.replace("/", r"\/")

        if re.match(pattern, source_str):
            return mapping

    return None


def get_all_source_patterns() -> list[str]:
    """Get all source file patterns that have documentation mappings."""
    return [m.source_pattern for m in MAPPINGS]


def get_all_doc_paths() -> set[str]:
    """Get all unique documentation file paths."""
    return {m.doc_path for m in MAPPINGS}
