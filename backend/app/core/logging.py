import logging
import sys
from app.core.config import settings


def setup_logging() -> None:
    """
    Configure application-wide centralized structured logging.
    """
    log_level = logging.DEBUG if settings.DEBUG else logging.INFO
    log_format = "%(asctime)s | %(levelname)-8s | %(name)s:%(lineno)d - %(message)s"
    date_format = "%Y-%m-%d %H:%M:%S"

    logging.basicConfig(
        level=log_level,
        format=log_format,
        datefmt=date_format,
        handlers=[
            logging.StreamHandler(sys.stdout)
        ],
        force=True
    )

    # Set external noisier loggers to INFO or WARNING
    logging.getLogger("uvicorn.access").setLevel(logging.INFO)
    logging.getLogger("uvicorn.error").setLevel(logging.INFO)


logger = logging.getLogger("zen")

