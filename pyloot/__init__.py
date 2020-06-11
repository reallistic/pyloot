import logging
import threading
import time
from typing import Optional
from typing import Set

from pyloot.backends.base import BaseBackend
from pyloot.backends.http import HTTPRemoteBackend
from pyloot.backends.memory import InMemoryBackend
from pyloot.collector import get_object_descriptors
from pyloot.server import PyLootServer
from pyloot.utils import start_thread


logger = logging.getLogger(__name__)


class PyLoot:
    def __init__(
        self,
        host: Optional[str] = None,
        port: Optional[int] = None,
        backend: Optional[BaseBackend] = None,
        interval: int = 30,
    ):
        if backend and (host or port):
            logger.warning("ignoring host and port since backend is present")
        if backend:
            self._backend = backend
        elif host or port:
            self._backend = HTTPRemoteBackend(host=host, port=port)
        else:
            self._backend = InMemoryBackend()

        self._running = False
        self._thread_ended = threading.Event()
        self._server: Optional[PyLootServer] = None
        self._interval = interval

    def start(self):
        """
        Start collecting data in a background thread.

        If gevent is detected, gevent.threadpool.spawn is used.
        Otherwise, threading.Thread is used.
        """
        if self._running:
            logger.warning("pyloot looter thread already started")
            return

        self._running = True

        logger.debug("Starting pyloot looter thread")
        start_thread(self._run)
        logger.debug("Finished starting pyloot looter thread")

    def stop(self, blocking=False):
        """
        Stop running the collector background thread.

        NOTE: This does not do a "final" collection.
        To ensure objects were collected in a short lived execution, call collect_objects().

        :param blocking: When true, wait until the thread has died
        """
        self._running = False
        if blocking:
            self._thread_ended.wait()

    def _run(self):
        while self._running:
            try:
                self.collect_objects()
            except Exception:  # pylint: disable=broad-except
                logger.exception("Error collecting objects")
            time.sleep(self._interval)

        self._thread_ended.set()

    def collect_objects(self):
        """
        Collect objects still in `gc.get_objects` after a call to `gc.collect`
        """
        logger.debug("Collecting objects")
        st = time.monotonic()
        ignored = self._backend.get_ids()
        ignore_set: Set[int] = set(ignored)
        del ignored
        ignore_set.add(id(self))
        ignore_set.add(id(ignore_set))
        logger.debug("There are %s ids to ignore", len(ignore_set))
        data = get_object_descriptors(ignore_set)
        dur = time.monotonic() - st
        logger.debug("Collecting objects took %s secs.", dur)
        self._backend.store(data)

    def get_wsgi(self) -> PyLootServer:
        """
        Return a WSGI compatible application serving the PyLoot remote backend and
        and the website.
        :return: ::class::`PyLootServer`
        """
        if not self._server:
            self._server = PyLootServer(backend=self._backend)
        return self._server
