"""
============================================================================
Analyze Profile Node
============================================================================
Analyzes conversations and updates user wellness profiles.

This node runs after store_memory to analyze the conversation and extract:
- Emotional state and trends
- Topics and concerns
- Activity effectiveness
- Profile updates

Uses FAST tier (Gemini Flash) for cost-effective analysis.
============================================================================
"""

from .node import analyze_profile

__all__ = ["analyze_profile"]
