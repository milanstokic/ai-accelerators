"""Tests for BaseSettings."""

import os
from typing import Any

import pytest
from pydantic_settings import SettingsConfigDict

from accelerators.config import BaseSettings


class TestSettings(BaseSettings):
    """Test settings class."""

    api_key: str
    debug: bool = False
    max_retries: int = 3

    model_config = SettingsConfigDict(
        env_prefix="TEST_",
        case_sensitive=False,
    )


def test_settings_from_env():
    """Test loading settings from environment variables."""
    os.environ["TEST_API_KEY"] = "test-key-123"
    os.environ["TEST_DEBUG"] = "true"
    os.environ["TEST_MAX_RETRIES"] = "5"

    settings = TestSettings()
    assert settings.api_key == "test-key-123"
    assert settings.debug is True
    assert settings.max_retries == 5

    # Cleanup
    del os.environ["TEST_API_KEY"]
    del os.environ["TEST_DEBUG"]
    del os.environ["TEST_MAX_RETRIES"]


def test_settings_defaults():
    """Test that default values work correctly."""
    os.environ["TEST_API_KEY"] = "test-key"

    settings = TestSettings()
    assert settings.api_key == "test-key"
    assert settings.debug is False
    assert settings.max_retries == 3

    # Cleanup
    del os.environ["TEST_API_KEY"]


def test_settings_case_insensitive():
    """Test that environment variables are case-insensitive."""
    os.environ["test_api_key"] = "lowercase-key"
    os.environ["TEST_DEBUG"] = "true"

    settings = TestSettings()
    assert settings.api_key == "lowercase-key"

    # Cleanup
    del os.environ["test_api_key"]
    del os.environ["TEST_DEBUG"]
