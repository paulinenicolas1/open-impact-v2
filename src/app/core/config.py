from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Python React Template"

    model_config = SettingsConfigDict(case_sensitive=True)


settings = Settings()
