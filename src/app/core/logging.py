import logging
import sys

import structlog
from structlog.types import Processor


def configure_logging(json_logs: bool = False, log_level: str = "INFO") -> None:
    """
    Configure strict, structured logging compatible with standard Python logging.
    """
    timestamper = structlog.processors.TimeStamper(fmt="iso")

    shared_processors: list[Processor] = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.StackInfoRenderer(),
        structlog.stdlib.ExtraAdder(),
        timestamper,
        structlog.processors.UnicodeDecoder(),
    ]

    if json_logs:
        # Production mode: Render as JSON
        processors = shared_processors + [
            structlog.processors.format_exc_info,
            structlog.processors.JSONRenderer(),
        ]
    else:
        # Development mode: Nice colors
        processors = shared_processors + [
            structlog.processors.ExceptionPrettyPrinter(),
            structlog.dev.ConsoleRenderer(),
        ]

    # 1. Configure standard logging to redirect to structlog
    structlog.configure(
        processors=processors,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )

    # 2. Configure standard library basicConfig to handle output
    # We want standard library logs to also go through our formatters if possible,
    # or at least be intercepted.
    # For simplicity in this guide, we leave standard logging handlers as is but set level.
    # In a full setup, you might use structlog.stdlib.ProcessorFormatter to wrap stdlib handlers.

    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=log_level.upper(),
    )
