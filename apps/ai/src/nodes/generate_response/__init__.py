"""
Generate Response Node

Main node that creates AI responses using the configured LLM.
Personalizes responses based on user context from their profile.
"""

from src.nodes.generate_response.node import generate_response

__all__ = ["generate_response"]
