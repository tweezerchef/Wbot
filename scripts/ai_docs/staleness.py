#!/usr/bin/env python3
"""
Documentation Staleness Detection for Wbot.

This script detects documentation that may be out of date by comparing
source file modification times with their corresponding documentation.

Usage:
    python scripts/ai-docs/staleness.py              # Check all docs
    python scripts/ai-docs/staleness.py --verbose    # Show detailed info
    python scripts/ai-docs/staleness.py --json       # Output as JSON
"""

import argparse
import json
import os
import sys
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Optional
import glob
import subprocess

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from scripts.ai_docs.mappings import MAPPINGS, find_doc_for_source, get_all_doc_paths


# Project root directory
PROJECT_ROOT = Path(__file__).parent.parent.parent


@dataclass
class StalenessReport:
    """Report for a potentially stale documentation file."""
    doc_path: str
    source_files: list[str]
    doc_modified: Optional[datetime]
    latest_source_modified: Optional[datetime]
    is_stale: bool
    reason: str
    priority: str  # high, medium, low


def get_file_mtime(path: Path) -> Optional[datetime]:
    """Get file modification time."""
    try:
        if path.exists():
            return datetime.fromtimestamp(path.stat().st_mtime)
    except Exception:
        pass
    return None


def get_git_last_modified(path: Path) -> Optional[datetime]:
    """Get last git commit time for a file."""
    try:
        result = subprocess.run(
            ["git", "log", "-1", "--format=%ct", "--", str(path)],
            capture_output=True,
            text=True,
            cwd=PROJECT_ROOT
        )
        if result.stdout.strip():
            timestamp = int(result.stdout.strip())
            return datetime.fromtimestamp(timestamp)
    except Exception:
        pass
    return None


def find_source_files_for_doc(doc_path: str) -> list[Path]:
    """Find all source files that map to a given documentation file."""
    source_files = []
    
    for mapping in MAPPINGS:
        if mapping.doc_path == doc_path:
            pattern = str(PROJECT_ROOT / mapping.source_pattern)
            matches = glob.glob(pattern, recursive=True)
            source_files.extend(Path(m).relative_to(PROJECT_ROOT) for m in matches)
    
    return list(set(source_files))


def check_doc_staleness(doc_path: str, verbose: bool = False) -> StalenessReport:
    """
    Check if a documentation file is potentially stale.
    
    Args:
        doc_path: Path to documentation file (relative to project root)
        verbose: Print verbose output
        
    Returns:
        StalenessReport with findings
    """
    doc_full_path = PROJECT_ROOT / doc_path
    source_files = find_source_files_for_doc(doc_path)
    
    # Get doc modification time
    doc_mtime = get_file_mtime(doc_full_path)
    doc_git_time = get_git_last_modified(doc_full_path)
    doc_modified = doc_git_time or doc_mtime
    
    if not doc_full_path.exists():
        return StalenessReport(
            doc_path=doc_path,
            source_files=[str(f) for f in source_files],
            doc_modified=None,
            latest_source_modified=None,
            is_stale=True,
            reason="Documentation file does not exist",
            priority="high"
        )
    
    if not source_files:
        return StalenessReport(
            doc_path=doc_path,
            source_files=[],
            doc_modified=doc_modified,
            latest_source_modified=None,
            is_stale=False,
            reason="No source files mapped to this doc",
            priority="low"
        )
    
    # Find the latest source file modification
    latest_source_mtime = None
    latest_source_file = None
    
    for source_file in source_files:
        source_full_path = PROJECT_ROOT / source_file
        source_mtime = get_git_last_modified(source_full_path) or get_file_mtime(source_full_path)
        
        if source_mtime and (latest_source_mtime is None or source_mtime > latest_source_mtime):
            latest_source_mtime = source_mtime
            latest_source_file = source_file
    
    # Determine if stale
    is_stale = False
    reason = "Documentation is up to date"
    priority = "low"
    
    if latest_source_mtime and doc_modified:
        if latest_source_mtime > doc_modified:
            is_stale = True
            days_behind = (latest_source_mtime - doc_modified).days
            reason = f"Source modified after doc (by {days_behind} days): {latest_source_file}"
            priority = "high" if days_behind > 7 else "medium"
    
    return StalenessReport(
        doc_path=doc_path,
        source_files=[str(f) for f in source_files],
        doc_modified=doc_modified,
        latest_source_modified=latest_source_mtime,
        is_stale=is_stale,
        reason=reason,
        priority=priority
    )


def check_all_docs(verbose: bool = False) -> list[StalenessReport]:
    """Check all documentation files for staleness."""
    reports = []
    
    doc_paths = get_all_doc_paths()
    
    for doc_path in sorted(doc_paths):
        report = check_doc_staleness(doc_path, verbose)
        reports.append(report)
    
    return reports


def print_report(reports: list[StalenessReport], verbose: bool = False):
    """Print staleness report to console."""
    stale = [r for r in reports if r.is_stale]
    up_to_date = [r for r in reports if not r.is_stale]
    
    print("=" * 60)
    print("Documentation Staleness Report")
    print("=" * 60)
    print(f"Generated at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    if stale:
        print(f"STALE DOCUMENTATION ({len(stale)} files)")
        print("-" * 40)
        
        # Sort by priority
        priority_order = {"high": 0, "medium": 1, "low": 2}
        stale.sort(key=lambda r: priority_order.get(r.priority, 3))
        
        for report in stale:
            priority_icon = {"high": "!!!", "medium": "!!", "low": "!"}.get(report.priority, "")
            print(f"\n[{report.priority.upper()}] {priority_icon} {report.doc_path}")
            print(f"  Reason: {report.reason}")
            if verbose:
                print(f"  Doc modified: {report.doc_modified}")
                print(f"  Source modified: {report.latest_source_modified}")
                print(f"  Source files: {len(report.source_files)}")
                for sf in report.source_files[:5]:
                    print(f"    - {sf}")
                if len(report.source_files) > 5:
                    print(f"    ... and {len(report.source_files) - 5} more")
    else:
        print("All documentation is up to date!")
    
    print()
    print("-" * 40)
    print(f"Summary: {len(stale)} stale, {len(up_to_date)} up-to-date")
    
    if stale:
        print("\nTo update stale documentation, run:")
        print("  python scripts/ai-docs/generator.py")


def main():
    parser = argparse.ArgumentParser(
        description="Check Wbot documentation for staleness"
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Show detailed information"
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Output as JSON"
    )
    
    args = parser.parse_args()
    
    reports = check_all_docs(verbose=args.verbose)
    
    if args.json:
        output = []
        for r in reports:
            output.append({
                "doc_path": r.doc_path,
                "source_files": r.source_files,
                "doc_modified": r.doc_modified.isoformat() if r.doc_modified else None,
                "latest_source_modified": r.latest_source_modified.isoformat() if r.latest_source_modified else None,
                "is_stale": r.is_stale,
                "reason": r.reason,
                "priority": r.priority
            })
        print(json.dumps(output, indent=2))
    else:
        print_report(reports, verbose=args.verbose)
    
    # Exit with error code if stale docs found
    stale_count = sum(1 for r in reports if r.is_stale)
    sys.exit(1 if stale_count > 0 else 0)


if __name__ == "__main__":
    main()
