import gzip
import json
import logging
import re

try:
    from importlib import resources
except ImportError:
    import importlib_resources as resources  # type: ignore

from typing import Optional
from wsgiref import simple_server

from webob import exc
from webob import Request
from webob import Response
from webob import static

from pyloot.backends.base import BaseBackend
from pyloot.backends.memory import InMemoryBackend
from pyloot.types import ObjectDescriptor

logger = logging.getLogger(__name__)


def _get_param(req: Request, name: str, default=None, typ=None):
    val = req.GET.get(name)
    if val:
        if typ is not None:
            val = typ(val)
    else:
        val = default
    return val


class PyLootServer:
    def __init__(self, backend: Optional[BaseBackend] = None):
        self._handlers = {
            ("GET", "/static/[a-z0-9._-]+"): self._static,
            ("GET", "/api/history"): self._get_history,
            ("GET", "/api/objects"): self._get_objects,
            ("POST", "/api/objects"): self._post_objects,
            ("GET", "/api/objects/([0-9]+)"): self._get_object_by_id,
            ("GET", "/api/objects/([0-9]+)/children"): self._get_object_children,
            ("GET", "/api/objects/([0-9]+)/parents"): self._get_object_parents,
        }
        if backend:
            self._storage = backend
        else:
            self._storage = InMemoryBackend()

    def __call__(self, environ, start_response):
        if isinstance(self._storage, InMemoryBackend):
            assert not environ["wsgi.multiprocess"], (
                "pyloot middleware is not usable in a " "multi-process environment"
            )
        return self._dispatch(environ, start_response)

    def _dispatch(self, environ, start_response):
        req = Request(environ)
        logger.info(
            "[_dispatch] path_info=%s path=%s", req.path_info, req.path,
        )

        if req.path_info == "/" and req.method == "GET":
            logger.info(
                "[_dispatch] %s handler=%s", req.path_info, self._static.__name__
            )
            return self._static(req)(environ, start_response)

        for handler_spec, handler in self._handlers.items():
            method, handler_pattern = handler_spec
            match = re.fullmatch(handler_pattern, req.path_info.rstrip("/"))
            if method == req.method and match:
                logger.info(
                    "[_dispatch] %s handler=%s", req.path_info, handler.__name__
                )
                return handler(req, *match.groups())(environ, start_response)
        return exc.HTTPNotFound("No endpoint found")(environ, start_response)

    def _get_history(self, req: Request) -> Response:
        top = _get_param(req, "top", typ=int)
        items = self._storage.fetch_history(top=top)
        data = [item._asdict() for item in items]
        logger.info("[history] returning %s items [top=%s]", len(data), top)
        res = Response(json=data)
        res.encode_content()
        return res

    def _get_objects(self, req: Request) -> Response:
        limit = _get_param(req, "limit", typ=int)
        group = _get_param(req, "group")
        if group:
            items = self._storage.fetch_by_group(group, limit=limit)
        else:
            items = self._storage.fetch(limit=limit)
        data = [item._asdict() for item in items]
        logger.info("[objects] returning %s items [group=%s]", len(data), group)
        res = Response(json=data)
        res.encode_content()
        return res

    def _post_objects(self, req: Request) -> Response:
        data = gzip.GzipFile(fileobj=req.body_file).read().decode(req.charset)
        items = json.loads(data)
        items = [ObjectDescriptor(**item) for item in items]
        self._storage.store(items)
        logger.info("[objects] stored %s items", len(items))
        res = Response(json={})
        res.encode_content()
        return res

    def _get_object_by_id(self, _: Request, _id: str) -> Response:
        item = self._storage.fetch_by_id(int(_id))
        if item:
            data = item._asdict()
            logger.info("[objects_by_id] found %s [%s]", _id, item.type_name)
            res = Response(json=data)
        else:
            logger.error("[objects_by_id] not found %s", _id)
            res = Response(json=dict(error="Item not found"), status=404)

        res.encode_content()
        return res

    def _get_object_children(self, _: Request, _id: str) -> Response:
        items = self._storage.fetch_children_of(int(_id))
        data = [item._asdict() for item in items]
        logger.info("[object children] returning %s items [id=%s]", len(data), _id)

        res = Response(json=data)
        res.encode_content()
        return res

    def _get_object_parents(self, _: Request, _id: str) -> Response:
        items = self._storage.fetch_parents_of(int(_id))
        data = [item._asdict() for item in items]
        logger.info("[object parents] returning %s items [id=%s]", len(data), _id)

        res = Response(json=data)
        res.encode_content()
        return res

    def _static(self, req: Request):
        """Static path where images and other files live"""
        if req.path_info_peek() == "static":
            req.path_info_pop()
        logger.info("[static asset] %s", req.path_info)
        with resources.path("pyloot", "static") as path:
            return static.DirectoryApp(path)

    def serve_forever(self, host: str = "0.0.0.0", port: int = 8000):
        httpd = simple_server.make_server(host, port, self)
        try:
            logger.info("Starting PyLoot Server at http://%s:%s", host, port)
            httpd.serve_forever()
        except KeyboardInterrupt:
            logger.info("Shutting down")
            httpd.server_close()
