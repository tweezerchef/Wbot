"""
============================================================================
Nodes Module - LangGraph Node Functions
============================================================================
Each subdirectory contains a single node for the conversation graph.

Nodes are functions that:
1. Take the current state as input
2. Process, analyze, or generate content
3. Return updates to be merged into state

Directory structure:
- generate_response/    Main AI response generation
- detect_activity/      Detect when to suggest activities
- breathing_exercise/   Guide breathing exercises
- meditation_guidance/  Provide meditation guidance
- journaling_prompt/    Offer journaling prompts
============================================================================
"""

from src.nodes.generate_response import generate_response

__all__ = ["generate_response"]
