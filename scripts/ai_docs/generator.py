#!/usr/bin/env python3
"""
AI Documentation Generator for Wbot.

This script uses Claude API to analyze source code and generate/update
Docusaurus documentation automatically.

Usage:
    python scripts/ai-docs/generator.py                    # Update changed files only
    python scripts/ai-docs/generator.py --full             # Regenerate all docs
    python scripts/ai-docs/generator.py --file <path>      # Generate doc for specific file
    python scripts/ai-docs/generator.py --dry-run          # Show what would be updated
"""

import argparse
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv

# Load environment variables from apps/ai/.env
env_path = Path(__file__).parent.parent.parent / "apps" / "ai" / ".env"
load_dotenv(env_path)

try:
    import anthropic

    HAS_ANTHROPIC = True
except ImportError:
    HAS_ANTHROPIC = False
    anthropic = None  # type: ignore

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from scripts.ai_docs.mappings import MAPPINGS, find_doc_for_source
from scripts.ai_docs.prompts import (
    SYSTEM_PROMPT,
    get_prompt_for_file_type,
)

# Project root directory
PROJECT_ROOT = Path(__file__).parent.parent.parent


def get_anthropic_client():
    """Get configured Anthropic client."""
    if not HAS_ANTHROPIC:
        print("Error: anthropic package not installed.")
        print("Install with: pip install anthropic")
        sys.exit(1)
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("Error: ANTHROPIC_API_KEY environment variable not set")
        sys.exit(1)
    return anthropic.Anthropic(api_key=api_key)


def read_file(path: Path) -> str:
    """Read file contents."""
    try:
        return path.read_text()
    except Exception as e:
        print(f"Warning: Could not read {path}: {e}")
        return ""


def read_existing_doc(doc_path: str) -> str:
    """Read existing documentation if it exists."""
    full_path = PROJECT_ROOT / doc_path
    if full_path.exists():
        return read_file(full_path)
    return ""


def get_language_from_path(path: str) -> str:
    """Get language identifier from file path."""
    if path.endswith(".py"):
        return "python"
    elif path.endswith(".tsx"):
        return "tsx"
    elif path.endswith(".ts"):
        return "typescript"
    elif path.endswith(".sql"):
        return "sql"
    else:
        return "text"


def generate_doc_for_file(
    client: anthropic.Anthropic, source_path: Path, dry_run: bool = False
) -> Optional[str]:
    """
    Generate documentation for a single source file.

    Args:
        client: Anthropic API client
        source_path: Path to source file (relative to project root)
        dry_run: If True, don't write files, just print what would happen

    Returns:
        Path to updated doc file, or None if no update needed
    """
    # Find the documentation mapping
    mapping = find_doc_for_source(source_path)
    if not mapping:
        print(f"  No doc mapping for: {source_path}")
        return None

    # Read source code
    full_source_path = PROJECT_ROOT / source_path
    if not full_source_path.exists():
        print(f"  Source file not found: {source_path}")
        return None

    source_code = read_file(full_source_path)
    existing_doc = read_existing_doc(mapping.doc_path)

    # Get appropriate prompt
    prompt_template = get_prompt_for_file_type(str(source_path))
    language = get_language_from_path(str(source_path))

    # Build the prompt with appropriate placeholders based on file type
    format_args = {
        "existing_doc": existing_doc or "(No existing documentation)",
    }

    # Different prompts expect different placeholders
    if language == "sql":
        # SCHEMA_PROMPT uses {migrations}
        format_args["migrations"] = (
            f"### {source_path}\n```{language}\n{source_code}\n```"
        )
    elif "nodes/" in str(source_path) or "graph/" in str(source_path):
        # ARCHITECTURE_PROMPT uses {code_files}
        format_args["code_files"] = (
            f"### {source_path}\n```{language}\n{source_code}\n```"
        )
    else:
        # API_REFERENCE_PROMPT and COMPONENT_PROMPT use {code} and {language}
        format_args["language"] = language
        format_args["code"] = source_code

    prompt = prompt_template.format(**format_args)

    print(f"  Generating docs for: {source_path}")
    print(f"  Target doc: {mapping.doc_path}")

    if dry_run:
        print("  [DRY RUN] Would generate documentation")
        return mapping.doc_path

    # Call Claude API
    try:
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=4096,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": prompt}],
        )

        generated_doc = response.content[0].text

        # Write the documentation
        doc_full_path = PROJECT_ROOT / mapping.doc_path
        doc_full_path.parent.mkdir(parents=True, exist_ok=True)
        doc_full_path.write_text(generated_doc)

        print(f"  Updated: {mapping.doc_path}")
        return mapping.doc_path

    except Exception as e:
        print(f"  Error generating docs: {e}")
        return None


def find_changed_files() -> list[Path]:
    """Find source files that have changed since last doc generation."""
    import subprocess

    # Get files changed in git (staged and unstaged)
    try:
        result = subprocess.run(
            ["git", "diff", "--name-only", "HEAD"],
            capture_output=True,
            text=True,
            cwd=PROJECT_ROOT,
        )
        changed = result.stdout.strip().split("\n") if result.stdout.strip() else []

        # Also get staged files
        result = subprocess.run(
            ["git", "diff", "--name-only", "--cached"],
            capture_output=True,
            text=True,
            cwd=PROJECT_ROOT,
        )
        staged = result.stdout.strip().split("\n") if result.stdout.strip() else []

        all_changed = set(changed + staged)

        # Filter to only source files with mappings
        source_files = []
        for f in all_changed:
            if find_doc_for_source(f):
                source_files.append(Path(f))

        return source_files

    except Exception as e:
        print(f"Error finding changed files: {e}")
        return []


def find_all_source_files() -> list[Path]:
    """Find all source files that have documentation mappings."""
    import glob

    source_files = []
    for mapping in MAPPINGS:
        pattern = str(PROJECT_ROOT / mapping.source_pattern)
        matches = glob.glob(pattern, recursive=True)
        source_files.extend(Path(m).relative_to(PROJECT_ROOT) for m in matches)

    return list(set(source_files))


def main():
    parser = argparse.ArgumentParser(
        description="Generate AI-powered documentation for Wbot"
    )
    parser.add_argument(
        "--full",
        action="store_true",
        help="Regenerate all documentation (not just changed files)",
    )
    parser.add_argument(
        "--file", type=str, help="Generate documentation for a specific file"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be updated without making changes",
    )

    args = parser.parse_args()

    print("=" * 60)
    print("Wbot AI Documentation Generator")
    print("=" * 60)
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()

    # Determine which files to process
    if args.file:
        source_files = [Path(args.file)]
        print(f"Mode: Single file - {args.file}")
    elif args.full:
        source_files = find_all_source_files()
        print(f"Mode: Full regeneration - {len(source_files)} files")
    else:
        source_files = find_changed_files()
        print(f"Mode: Changed files only - {len(source_files)} files")

    if not source_files:
        print("\nNo source files to process.")
        return

    print("\nFiles to process:")
    for f in source_files:
        print(f"  - {f}")
    print()

    # Initialize client
    if not args.dry_run:
        client = get_anthropic_client()
    else:
        client = None
        print("[DRY RUN MODE - No changes will be made]\n")

    # Process each file
    updated_docs = []
    for source_file in source_files:
        result = generate_doc_for_file(client, source_file, dry_run=args.dry_run)
        if result:
            updated_docs.append(result)
        print()

    # Summary
    print("=" * 60)
    print("Summary")
    print("=" * 60)
    print(f"Files processed: {len(source_files)}")
    print(f"Docs updated: {len(updated_docs)}")
    if updated_docs:
        print("\nUpdated documentation:")
        for doc in set(updated_docs):
            print(f"  - {doc}")


if __name__ == "__main__":
    main()
