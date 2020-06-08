import logging
import threading
from concurrent.futures import Future
from functools import wraps
from typing import Any
from typing import Callable


logger = logging.getLogger(__name__)


def _wrap_call(func, fut: Future):
    @wraps(func)
    def inner(*args, **kwargs):
        try:
            result = func(*args, **kwargs)
            fut.set_result(result)
            return result
        except Exception as e:
            fut.set_exception(e)
            raise

    return inner


def start_thread(func: Callable, *args: Any, **kwargs: Any) -> Future:
    future: Future = Future()
    should_spawn_thread = True
    try:
        # Gevent greenlets would block all other threads while this one
        # is doing its computation. If we detect gevent has patched
        # threading we run this in a native thread via gevent.threadpool.
        import gevent.monkey

        try:
            if gevent.monkey.is_module_patched("threading"):
                gevent.get_hub().threadpool.spawn(
                    _wrap_call(func, future), *args, **kwargs
                )
                should_spawn_thread = False
        except:
            logger.warning(
                "error using gevent threadpool. Falling back to regular thread",
                exc_info=True,
            )
    except ImportError:
        pass

    if should_spawn_thread:
        thread = threading.Thread(
            name="PyLoot Thread",
            target=_wrap_call(func, future),
            daemon=True,
            args=args,
            kwargs=kwargs,
        )
        thread.start()

    return future
