"""Base settings class with environment variable support."""

from typing import Any

from pydantic import Field
from pydantic_settings import BaseSettings as PydanticBaseSettings, SettingsConfigDict


class BaseSettings(PydanticBaseSettings):
    """Base settings class with enhanced environment variable support.

    This class extends Pydantic's BaseSettings to provide a consistent
    configuration interface across all accelerators templates.

    Example:
        ```python
        from accelerators.config import BaseSettings
        from pydantic_settings import SettingsConfigDict

        class AppSettings(BaseSettings):
            api_key: str
            debug: bool = False
            max_retries: int = 3

            model_config = SettingsConfigDict(
                env_prefix="APP_",
                case_sensitive=False,
            )

        settings = AppSettings()
        # Loads from environment variables: APP_API_KEY, APP_DEBUG, APP_MAX_RETRIES
        ```
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    def model_post_init(self, __context: Any) -> None:
        """Validate settings after initialization."""
        self._validate()

    def _validate(self) -> None:
        """Override this method to add custom validation logic."""
        pass
