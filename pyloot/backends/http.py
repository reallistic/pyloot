import gzip
import http.client
import io
import json
import logging
import urllib.error
import urllib.request
from typing import cast
from typing import Dict
from typing import Iterable
from typing import List
from typing import Optional
from typing import Union

from pyloot.backends.base import BaseBackend
from pyloot.types import ObjectDescriptor
from pyloot.types import ObjectTypeHistory


logger = logging.getLogger(__name__)


class HTTPRemoteBackend(BaseBackend):
    def __init__(
        self,
        host: Optional[str] = None,
        port: Optional[int] = None,
        prefix: Optional[str] = None,
    ):
        self._host = host or "localhost"
        self._port = port or 8000
        self._prefix = prefix or "/"

    def _make_url(self, endpoint: Optional[str] = None) -> str:
        endpoint = endpoint or "/"
        return "http://{host}:{port}{prefix}/{endpoint}".format(
            host=self._host,
            port=self._port,
            prefix=self._prefix.rstrip("/"),
            endpoint=endpoint.lstrip("/"),
        )

    @staticmethod
    def compress(entity: str) -> bytes:
        out = io.BytesIO()
        with gzip.GzipFile(fileobj=out, mode="w") as f:
            f.write(entity.encode("utf-8"))
        return out.getvalue()

    @staticmethod
    def decompress(entity: bytes) -> str:
        buf = io.BytesIO(entity)
        f = gzip.GzipFile(fileobj=buf)
        return f.read().decode()

    @classmethod
    def _read_response(cls, response: http.client.HTTPResponse) -> str:
        if response.info().get("Content-Encoding") == "gzip":
            return cls.decompress(response.read())
        else:
            return response.read().decode()

    @classmethod
    def _read_error(cls, response: urllib.error.HTTPError) -> str:
        if response.headers.get("Content-Encoding", "identity") == "gzip":
            return cls.decompress(response.read())
        else:
            return response.read().decode()

    def _make_request(
        self,
        endpoint: Optional[str] = None,
        method: Optional[str] = None,
        json_data: Optional[Union[Dict, List]] = None,
    ) -> urllib.request.Request:
        headers = {
            "Accept-Encoding": "gzip",
        }

        url = self._make_url(endpoint)
        data = None
        if json_data:
            if not method:
                method = "POST"

            data = self.compress(json.dumps(json_data))

            headers["Content-Encoding"] = "gzip"
            headers["Content-Type"] = "application/json"

        method = method or "GET"
        return urllib.request.Request(url, data=data, method=method, headers=headers)

    def _request_json(self, request: urllib.request.Request) -> Union[Dict, List]:
        response: http.client.HTTPResponse = urllib.request.urlopen(request, timeout=5)
        data = self._read_response(response)
        if response.getheader("Content-Type") == "application/json":
            return json.loads(data)

        return dict(content=data)

    def store(self, object_data: List[ObjectDescriptor]):
        data = [dict(item._asdict()) for item in object_data]
        for item in data:
            try:
                json.dumps(item)
            except:
                logger.exception("Unable to dump %s", item)
        request = self._make_request("/api/objects", json_data=data)
        try:
            self._request_json(request)
        except:
            logger.exception("Error storing data")

    def fetch(self, limit: Optional[int] = None) -> List[ObjectDescriptor]:
        if limit is not None:
            request = self._make_request("/api/objects?limit={}".format(limit))
        else:
            request = self._make_request("/api/objects")

        try:
            data = cast(List, self._request_json(request))
        except:
            logger.exception("Error fetching data")
            raise

        return [ObjectDescriptor(**item) for item in data]

    def fetch_by_id(self, _id: int) -> Optional[ObjectDescriptor]:
        request = self._make_request("/api/objects/{}".format(_id))

        try:
            data = cast(Dict, self._request_json(request))
        except urllib.error.HTTPError as e:
            if e.code == 404:
                logger.warning("Unable to find object with id %s", _id)
                return None
            else:
                logger.exception("Error fetching data")
                raise
        except:
            logger.exception("Error fetching data")
            raise

        return ObjectDescriptor(**data)

    def fetch_children_of(self, _id: int) -> List[ObjectDescriptor]:
        request = self._make_request("/api/objects/{}/children".format(_id))
        try:
            data = cast(Dict, self._request_json(request))
        except urllib.error.HTTPError as e:
            if e.code == 404:
                logger.warning("Unable to find object with id %s", _id)
                return []
            else:
                logger.exception("Error fetching data")
                raise
        except:
            logger.exception("Error fetching data")
            raise

        return [ObjectDescriptor(**item) for item in data]

    def fetch_parents_of(self, _id: int) -> List[ObjectDescriptor]:
        request = self._make_request("/api/objects/{}/parents".format(_id))
        try:
            data = cast(Dict, self._request_json(request))
        except urllib.error.HTTPError as e:
            if e.code == 404:
                logger.warning("Unable to find object with id %s", _id)
                return []
            else:
                logger.exception("Error fetching data")
                raise
        except:
            logger.exception("Error fetching data")
            raise

        return [ObjectDescriptor(**item) for item in data]

    def fetch_by_group(
        self, group: str, limit: Optional[int] = None
    ) -> List[ObjectDescriptor]:
        if limit is not None:
            request = self._make_request(
                "/api/objects?group={}&limit={}".format(group, limit)
            )
        else:
            request = self._make_request("/api/objects?group={}".format(group))
        try:
            data = cast(List, self._request_json(request))
        except:
            logger.exception("Error fetching data")
            raise

        return [ObjectDescriptor(**item) for item in data]

    def fetch_history(self, top: Optional[int] = None) -> List[ObjectTypeHistory]:
        if top is not None:
            request = self._make_request("/api/history?top={}".format(top))
        else:
            request = self._make_request("/api/history")
        try:
            data = cast(List, self._request_json(request))
        except:
            logger.exception("Error fetching data")
            raise

        return [ObjectTypeHistory(**item) for item in data]

    def get_ids(self) -> Iterable[int]:
        yield id(self)
