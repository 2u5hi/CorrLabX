import sys
import os
import pytest
import numpy as np
import pandas as pd

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from inefficiency_score import autocorrelation_score, volatility_clustering_score, arima_edge_score


def make_returns(values):
    return pd.Series(values, dtype=float)


class TestAutocorrelationScore:
    def test_returns_float(self):
        returns = make_returns([0.01, -0.02, 0.03, -0.01, 0.02] * 10)
        score = autocorrelation_score(returns)
        assert isinstance(score, float)
        assert score >= 0.0

    def test_alternating_series_has_nonzero_score(self):
        returns = make_returns([0.05, -0.05] * 25)
        score = autocorrelation_score(returns)
        assert score > 0.0

    def test_score_is_nonnegative(self):
        np.random.seed(0)
        returns = make_returns(np.random.randn(80) * 0.01)
        assert autocorrelation_score(returns) >= 0.0


class TestVolatilityClusteringScore:
    def test_returns_float(self):
        returns = make_returns([0.01, -0.02, 0.03, -0.01, 0.02] * 10)
        score = volatility_clustering_score(returns)
        assert isinstance(score, float)
        assert score >= 0.0

    def test_burst_series_has_nonzero_score(self):
        returns = make_returns([0.1, 0.1, 0.1, 0.0, 0.0, 0.0] * 10)
        score = volatility_clustering_score(returns)
        assert score > 0.0

    def test_score_is_nonnegative(self):
        np.random.seed(1)
        returns = make_returns(np.random.randn(80) * 0.01)
        assert volatility_clustering_score(returns) >= 0.0


class TestArimaEdgeScore:
    def test_short_series_returns_zero(self):
        returns = make_returns([0.01] * 20)
        assert arima_edge_score(returns) == 0.0

    def test_exactly_29_returns_zero(self):
        returns = make_returns([0.01] * 29)
        assert arima_edge_score(returns) == 0.0

    def test_sufficient_data_returns_float(self):
        np.random.seed(42)
        returns = make_returns(np.random.randn(60) * 0.02)
        score = arima_edge_score(returns)
        assert isinstance(score, float)
        assert score >= 0.0

    def test_score_is_nonnegative(self):
        np.random.seed(2)
        returns = make_returns(np.random.randn(50) * 0.01)
        assert arima_edge_score(returns) >= 0.0


class TestNormalization:
    def test_perfect_scores_sum_to_100(self):
        ac_norm   = min(0.20 / 0.20, 1.0) * 40
        vc_norm   = min(0.20 / 0.20, 1.0) * 30
        edge_norm = min(0.05 / 0.05, 1.0) * 30
        assert round(ac_norm + vc_norm + edge_norm, 2) == 100.0

    def test_zero_scores_sum_to_zero(self):
        ac_norm   = min(0.0 / 0.20, 1.0) * 40
        vc_norm   = min(0.0 / 0.20, 1.0) * 30
        edge_norm = min(0.0 / 0.05, 1.0) * 30
        assert round(ac_norm + vc_norm + edge_norm, 2) == 0.0

    def test_ac_capped_at_40(self):
        assert min(0.50 / 0.20, 1.0) * 40 == 40.0

    def test_vc_capped_at_30(self):
        assert min(0.50 / 0.20, 1.0) * 30 == 30.0

    def test_edge_capped_at_30(self):
        assert min(0.10 / 0.05, 1.0) * 30 == 30.0

    def test_partial_score_in_range(self):
        ac_norm   = min(0.10 / 0.20, 1.0) * 40
        vc_norm   = min(0.10 / 0.20, 1.0) * 30
        edge_norm = min(0.025 / 0.05, 1.0) * 30
        total = round(ac_norm + vc_norm + edge_norm, 2)
        assert 0.0 < total < 100.0
