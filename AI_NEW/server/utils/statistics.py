"""
Statistical Utilities

Helper functions for calculating means, standard deviations, volatility, and normalization.
"""

import math
from typing import List, Optional


def calculate_mean(values: List[float]) -> float:
    """Calculate arithmetic mean of a list of values."""
    if not values:
        return 0.0
    return sum(values) / len(values)


def calculate_std_dev(values: List[float], mean: Optional[float] = None) -> float:
    """
    Calculate standard deviation of a list of values.

    Args:
        values: List of numeric values
        mean: Pre-calculated mean (optional, will calculate if not provided)

    Returns:
        Standard deviation
    """
    if not values or len(values) < 2:
        return 0.0

    if mean is None:
        mean = calculate_mean(values)

    variance = sum((x - mean) ** 2 for x in values) / (len(values) - 1)
    return math.sqrt(variance)


def calculate_moving_average(values: List[float], window: int = 3) -> List[float]:
    """
    Calculate moving average with specified window size.

    Args:
        values: List of numeric values
        window: Window size for moving average

    Returns:
        List of moving average values
    """
    if not values or len(values) < window:
        return values

    result = []
    for i in range(len(values)):
        if i < window - 1:
            # Not enough data for full window, use available data
            result.append(calculate_mean(values[: i + 1]))
        else:
            # Full window available
            result.append(calculate_mean(values[i - window + 1 : i + 1]))

    return result


def calculate_volatility(prices: List[float], period: Optional[int] = None) -> float:
    """
    Calculate price volatility (coefficient of variation).

    Volatility = (Standard Deviation / Mean) * 100

    Args:
        prices: List of historical prices
        period: Number of recent periods to consider (None = all data)

    Returns:
        Volatility as percentage (0-100+)
    """
    if not prices or len(prices) < 2:
        return 0.0

    # Use recent period if specified
    if period and period < len(prices):
        prices = prices[-period:]

    mean = calculate_mean(prices)
    if mean == 0:
        return 0.0

    std_dev = calculate_std_dev(prices, mean)
    volatility = (std_dev / mean) * 100

    return volatility


def normalize_score(
    value: float,
    min_val: float,
    max_val: float,
    inverse: bool = False,
) -> float:
    """
    Normalize a value to 0-1 range.

    Args:
        value: Value to normalize
        min_val: Minimum possible value
        max_val: Maximum possible value
        inverse: If True, inverts the score (higher value = lower score)

    Returns:
        Normalized score between 0 and 1
    """
    if max_val == min_val:
        return 0.5  # Neutral score if no range

    # Clamp value to range
    value = max(min_val, min(max_val, value))

    # Normalize to 0-1
    normalized = (value - min_val) / (max_val - min_val)

    # Invert if needed (for metrics where lower is better)
    if inverse:
        normalized = 1.0 - normalized

    return normalized


def calculate_trend(values: List[float], periods: int = 3) -> str:
    """
    Calculate trend direction based on recent values.

    Args:
        values: List of values (most recent last)
        periods: Number of recent periods to analyze

    Returns:
        "increasing", "decreasing", or "stable"
    """
    if not values or len(values) < 2:
        return "stable"

    recent = values[-periods:] if len(values) >= periods else values

    # Calculate simple linear trend
    first_half_avg = calculate_mean(recent[: len(recent) // 2])
    second_half_avg = calculate_mean(recent[len(recent) // 2 :])

    change_pct = ((second_half_avg - first_half_avg) / first_half_avg * 100) if first_half_avg > 0 else 0

    if change_pct > 5:
        return "increasing"
    elif change_pct < -5:
        return "decreasing"
    else:
        return "stable"


def calculate_growth_rate(old_value: float, new_value: float) -> float:
    """
    Calculate percentage growth rate.

    Args:
        old_value: Starting value
        new_value: Ending value

    Returns:
        Growth rate as percentage
    """
    if old_value == 0:
        return 0.0 if new_value == 0 else 100.0

    return ((new_value - old_value) / old_value) * 100


def predict_linear(values: List[float], periods_ahead: int = 1) -> List[float]:
    """
    Simple linear prediction based on trend.

    Args:
        values: Historical values
        periods_ahead: Number of periods to predict

    Returns:
        List of predicted values
    """
    if not values or len(values) < 2:
        # No data to predict, return last value or zero
        last_value = values[-1] if values else 0.0
        return [last_value] * periods_ahead

    # Calculate simple linear trend
    n = len(values)
    x_mean = (n - 1) / 2
    y_mean = calculate_mean(values)

    # Calculate slope
    numerator = sum((i - x_mean) * (values[i] - y_mean) for i in range(n))
    denominator = sum((i - x_mean) ** 2 for i in range(n))

    slope = numerator / denominator if denominator != 0 else 0

    # Generate predictions
    predictions = []
    for i in range(1, periods_ahead + 1):
        next_x = n + i - 1
        prediction = values[-1] + slope * i
        predictions.append(max(0, prediction))  # Ensure non-negative

    return predictions


def calculate_percentile(values: List[float], percentile: int) -> float:
    """
    Calculate specified percentile of values.

    Args:
        values: List of values
        percentile: Percentile to calculate (0-100)

    Returns:
        Value at specified percentile
    """
    if not values:
        return 0.0

    sorted_values = sorted(values)
    index = int((percentile / 100) * (len(sorted_values) - 1))
    return sorted_values[index]
