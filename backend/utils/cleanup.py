"""
File cleanup utilities for background tasks.
"""

import time
import logging
from pathlib import Path

logger = logging.getLogger(__name__)


def delete_file_after_delay(file_path: Path, delay_seconds: int = 3600) -> None:
    """
    Synchronous cleanup used with FastAPI BackgroundTasks.
    In production, replace with Celery/RQ for true async scheduling.
    Note: This runs in a thread pool — safe to use blocking calls.
    """
    import threading

    def _delete():
        time.sleep(delay_seconds)
        try:
            if file_path.exists():
                file_path.unlink()
                logger.info("🗑️  Deleted temp file: %s", file_path.name)
        except Exception as e:
            logger.warning("Failed to delete %s: %s", file_path, e)

    t = threading.Thread(target=_delete, daemon=True)
    t.start()


def schedule_file_cleanup(background_tasks, *file_paths: Path, delay: int = 3600):
    """Convenience wrapper — schedule multiple files for deletion."""
    for path in file_paths:
        background_tasks.add_task(delete_file_after_delay, path, delay)
