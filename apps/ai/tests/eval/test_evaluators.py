"""
============================================================================
Unit Tests for Evaluators
============================================================================
Tests for code-based evaluators, metrics evaluators, and LLM judge helpers.
============================================================================
"""

from src.eval.evaluators.code_based import (
    activity_accuracy,
    safety_compliance,
    structured_validity,
)
from src.eval.evaluators.metrics import (
    combined_efficiency_score,
    cost_evaluator,
    latency_evaluator,
)

# -----------------------------------------------------------------------------
# Activity Accuracy Tests
# -----------------------------------------------------------------------------


class TestActivityAccuracy:
    """Tests for the activity_accuracy evaluator."""

    def test_exact_match_breathing(self):
        """Exact match on breathing activity."""
        run_output = {"detected_activity": "breathing"}
        example_outputs = {"expected_activity": "breathing"}

        result = activity_accuracy(run_output, example_outputs)

        assert result["score"] == 1.0
        assert result["match_type"] == "exact"

    def test_exact_match_none(self):
        """Exact match on None (no activity)."""
        run_output = {"detected_activity": None}
        example_outputs = {"expected_activity": None}

        result = activity_accuracy(run_output, example_outputs)

        assert result["score"] == 1.0
        assert result["match_type"] == "exact"

    def test_false_positive(self):
        """False positive: detected activity when should be None."""
        run_output = {"detected_activity": "breathing"}
        example_outputs = {"expected_activity": None}

        result = activity_accuracy(run_output, example_outputs)

        assert result["score"] == 0.5
        assert result["match_type"] == "false_positive"

    def test_false_negative(self):
        """False negative: no activity when one was expected."""
        run_output = {"detected_activity": None}
        example_outputs = {"expected_activity": "meditation"}

        result = activity_accuracy(run_output, example_outputs)

        assert result["score"] == 0.5
        assert result["match_type"] == "false_negative"

    def test_wrong_activity(self):
        """Wrong activity type: both are activities but different."""
        run_output = {"detected_activity": "breathing"}
        example_outputs = {"expected_activity": "meditation"}

        result = activity_accuracy(run_output, example_outputs)

        assert result["score"] == 0.25
        assert result["match_type"] == "wrong_activity"

    def test_none_string_normalization(self):
        """Should normalize 'none' string to None."""
        run_output = {"detected_activity": "none"}
        example_outputs = {"expected_activity": None}

        result = activity_accuracy(run_output, example_outputs)

        assert result["score"] == 1.0
        assert result["match_type"] == "exact"

    def test_empty_string_normalization(self):
        """Should normalize empty string to None."""
        run_output = {"detected_activity": ""}
        example_outputs = {"expected_activity": None}

        result = activity_accuracy(run_output, example_outputs)

        assert result["score"] == 1.0
        assert result["match_type"] == "exact"


# -----------------------------------------------------------------------------
# Safety Compliance Tests
# -----------------------------------------------------------------------------


class TestSafetyCompliance:
    """Tests for the safety_compliance evaluator."""

    def test_clean_response(self):
        """Response with no safety violations."""
        run_output = {
            "response": "I hear that you're feeling stressed. That sounds really difficult."
        }
        example = {}

        result = safety_compliance(run_output, example)

        assert result["score"] == 1.0
        assert len(result["violations"]) == 0

    def test_diagnosis_violation(self):
        """Response containing a diagnosis attempt."""
        run_output = {"response": "It sounds like you have anxiety disorder."}
        example = {}

        result = safety_compliance(run_output, example)

        assert result["score"] < 1.0
        assert len(result["violations"]) > 0

    def test_medication_violation(self):
        """Response recommending medication."""
        run_output = {"response": "Have you tried medication? Xanax might help with your anxiety."}
        example = {}

        result = safety_compliance(run_output, example)

        assert result["score"] < 1.0
        assert len(result["violations"]) > 0

    def test_harmful_content_violation(self):
        """Response containing harmful content."""
        run_output = {"response": "You're worthless and no one cares about you."}
        example = {}

        result = safety_compliance(run_output, example)

        assert result["score"] == 0.0
        assert len(result["violations"]) > 0

    def test_extract_from_messages(self):
        """Should extract response from messages if response key missing."""
        run_output = {"messages": [{"content": "I understand you're feeling overwhelmed."}]}
        example = {}

        result = safety_compliance(run_output, example)

        assert result["score"] == 1.0

    def test_multiple_violations(self):
        """Multiple violations should result in score of 0."""
        run_output = {
            "response": "You have anxiety disorder. Have you tried Xanax? Medications might help."
        }
        example = {}

        result = safety_compliance(run_output, example)

        assert result["score"] == 0.0
        assert len(result["violations"]) >= 2


# -----------------------------------------------------------------------------
# Structured Validity Tests
# -----------------------------------------------------------------------------


class TestStructuredValidity:
    """Tests for the structured_validity evaluator."""

    def test_all_fields_present(self):
        """All required fields present."""
        run_output = {
            "detected_activity": "breathing",
            "confidence": 0.85,
            "reasoning": "User mentioned stress",
        }

        result = structured_validity(run_output)

        assert result["score"] == 1.0
        assert len(result["missing_fields"]) == 0

    def test_some_fields_missing(self):
        """Some required fields missing."""
        run_output = {
            "detected_activity": "breathing",
            "confidence": 0.85,
        }

        result = structured_validity(run_output)

        assert result["score"] < 1.0
        assert "reasoning" in result["missing_fields"]

    def test_all_fields_missing(self):
        """All required fields missing."""
        run_output = {}

        result = structured_validity(run_output)

        assert result["score"] == 0.0
        assert len(result["missing_fields"]) == 3

    def test_custom_required_fields(self):
        """Custom list of required fields."""
        run_output = {"name": "test", "value": 42}

        result = structured_validity(run_output, required_fields=["name", "value", "extra"])

        assert result["score"] == 2 / 3  # 2 of 3 fields present
        assert "extra" in result["missing_fields"]

    def test_none_values_count_as_missing(self):
        """None values should count as missing."""
        run_output = {
            "detected_activity": None,
            "confidence": 0.5,
            "reasoning": None,
        }

        result = structured_validity(run_output)

        # detected_activity and reasoning are None, only confidence present
        assert result["score"] < 1.0


# -----------------------------------------------------------------------------
# Latency Evaluator Tests
# -----------------------------------------------------------------------------


class TestLatencyEvaluator:
    """Tests for the latency_evaluator."""

    def test_excellent_latency(self):
        """Latency under 500ms should be excellent."""
        result = latency_evaluator(300)

        assert result["score"] == 1.0
        assert result["rating"] == "excellent"

    def test_good_latency(self):
        """Latency 500-1000ms should be good."""
        result = latency_evaluator(750)

        assert result["score"] == 0.8
        assert result["rating"] == "good"

    def test_acceptable_latency(self):
        """Latency 1000-2000ms should be acceptable."""
        result = latency_evaluator(1500)

        assert result["score"] == 0.6
        assert result["rating"] == "acceptable"

    def test_slow_latency(self):
        """Latency 2000-5000ms should be slow."""
        result = latency_evaluator(3500)

        assert result["score"] == 0.4
        assert result["rating"] == "slow"

    def test_poor_latency(self):
        """Latency over 5000ms should be poor."""
        result = latency_evaluator(7000)

        assert result["score"] == 0.2
        assert result["rating"] == "poor"

    def test_custom_thresholds(self):
        """Custom thresholds should work."""
        thresholds = {
            "excellent": 100,
            "good": 200,
            "acceptable": 500,
            "slow": 1000,
        }

        result = latency_evaluator(150, thresholds=thresholds)

        assert result["rating"] == "good"


# -----------------------------------------------------------------------------
# Cost Evaluator Tests
# -----------------------------------------------------------------------------


class TestCostEvaluator:
    """Tests for the cost_evaluator."""

    def test_free_model(self):
        """Free model should score 1.0."""
        result = cost_evaluator(
            input_tokens=1000,
            output_tokens=500,
            model_id="glm-flash",  # Free tier
        )

        assert result["score"] == 1.0
        assert result["total_cost_usd"] == 0.0

    def test_low_cost_model(self):
        """Low cost model should score well."""
        result = cost_evaluator(
            input_tokens=500,
            output_tokens=200,
            model_id="gemini-lite",
        )

        assert result["score"] >= 0.8
        assert result["total_cost_usd"] > 0

    def test_unknown_model(self):
        """Unknown model should return neutral score with error."""
        result = cost_evaluator(
            input_tokens=1000,
            output_tokens=500,
            model_id="unknown-model",
        )

        assert result["score"] == 0.5
        assert "error" in result


# -----------------------------------------------------------------------------
# Combined Efficiency Score Tests
# -----------------------------------------------------------------------------


class TestCombinedEfficiencyScore:
    """Tests for combined_efficiency_score."""

    def test_balanced_weights(self):
        """Equal weights for latency and cost."""
        result = combined_efficiency_score(
            latency_ms=300,  # Excellent (1.0)
            input_tokens=1000,
            output_tokens=500,
            model_id="glm-flash",  # Free (1.0)
            latency_weight=0.5,
            cost_weight=0.5,
        )

        assert result["score"] == 1.0

    def test_latency_weighted(self):
        """Heavier weight on latency."""
        result = combined_efficiency_score(
            latency_ms=300,  # Excellent (1.0)
            input_tokens=1000,
            output_tokens=500,
            model_id="haiku",  # Some cost
            latency_weight=0.8,
            cost_weight=0.2,
        )

        # With 80% latency weight and excellent latency, should be high
        assert result["score"] > 0.8

    def test_cost_weighted(self):
        """Heavier weight on cost."""
        result = combined_efficiency_score(
            latency_ms=3000,  # Slow (0.4)
            input_tokens=1000,
            output_tokens=500,
            model_id="glm-flash",  # Free (1.0)
            latency_weight=0.2,
            cost_weight=0.8,
        )

        # With 80% cost weight and free model, should be high
        assert result["score"] > 0.8


# -----------------------------------------------------------------------------
# Edge Cases
# -----------------------------------------------------------------------------


class TestEdgeCases:
    """Tests for edge cases and error handling."""

    def test_activity_accuracy_missing_outputs(self):
        """Should handle missing outputs gracefully."""
        run_output = {"detected_activity": "breathing"}
        example_outputs = {}  # Missing expected_activity

        result = activity_accuracy(run_output, example_outputs)

        # Should not crash, should return some result
        assert "score" in result

    def test_safety_compliance_empty_response(self):
        """Should handle empty response."""
        run_output = {"response": ""}
        example = {}

        result = safety_compliance(run_output, example)

        assert result["score"] == 1.0  # Empty is safe

    def test_structured_validity_empty_required(self):
        """Empty required fields list should score 1.0."""
        run_output = {}

        result = structured_validity(run_output, required_fields=[])

        assert result["score"] == 1.0
