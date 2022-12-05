PyLoot
===========

PyLoot is a memory leak detector based on [Dozer](https://github.com/mgedmin/dozer) and [vprof](https://github.com/nvdv/vprof) with added support for servers with multiple workers/processes.


This project is in active development and may contain bugs or otherwise work in ways not expected or intended.

# Installation
```shell script
$ pip install pyloot
```

# Basic API Usage
```python
from pyloot import PyLoot
loot = PyLoot()


"""
Collect objects still in `gc.get_objects` after a call to `gc.collect`.
"""
loot.collect_objects()

"""
Collecting data in a background thread every 30 seconds.

If gevent is detected, gevent.threadpool.spawn is used.
Otherwise, threading.Thread is used.
"""
loot.start()

"""
Stop running the collector background thread.

NOTE: This does not do a "final" collection.
To ensure objects were collected in a short lived execution, call collect_objects().

:param blocking: When true, wait until the thread has died
"""
loot.stop()

"""
Return a WSGI compatible application serving the PyLoot remote backend and
and the website.
:return: ::class::`PyLootServer`
"""
loot.get_wsgi()
```


# Running embedded within a server
**Starlette/FastApi/ASGI**

_see note below about bypassing the [multiprocessing check](#bypass-the-multiprocessing-check)_

```python
from pyloot import PyLoot
from fastapi import FastAPI
from starlette.applications import Starlette
from starlette.middleware.wsgi import WSGIMiddleware

app = FastAPI()  # or Starlette()

pyloot = PyLoot()
app.on_event("startup")(pyloot.start)
app.mount("/_pyloot", WSGIMiddleware(pyloot.get_wsgi()))
```


**Flask/WSGI**
```python
from pyloot import PyLoot
from flask import Flask
from werkzeug.middleware.dispatcher import DispatcherMiddleware

app = Flask(__name__)

pyloot = PyLoot()
app.on_before_first_request(pyloot.start)

app = DispatcherMiddleware(app, {
    '/_pyloot': pyloot.get_wsgi()
})
```

# Running in remote mode (multi-process servers)
```python
# Embedded code
from pyloot import PyLoot
...
pyloot = PyLoot(host="127.0.0.1", port=8000)
...
```
```shell script
# Start the remote server
$ pyloot --help
usage: pyloot [-h HOST] [-p PORT] [--help]

optional arguments:
-h HOST, --host HOST  Host to listen on. (Default: 0.0.0.0)
-p PORT, --port PORT  Port to listen on. (Default: 8000)
--help                show this help message and exit
```

# Bypass the multiprocessing check
If pyloot detects it is running in a multiprocessing environment with an inmemory backend
it will refuse to serve the webpages/requests.

This environment is common for gunicorn servers running with multiple workers.
If you run pyloot embedded in a gunicorn server with multiple workers, statistics will be collected in each individual worker and a random worker will be selected when returning statistics.
When using multiple workers, pyloot will give the most accurate information using the http backend.
For dev servers or servers with really low traffic (e.g. <1 request per second), you can also reduce the workers to 1.
Pyloot cannot detect how many workers are running so the bypass is still needed when only 1 worker is used.

The WSGIMiddleware of starlette sets `environ["wsgi.multiprocess"]=True` regardless of the server.
This can be bypassed with a wrapper **use with caution**:

```python
pyloot = PyLoot()

def pyloot_wrapper(wsgi_environ, start_response):
    pyloot_environ = wsgi_environ.copy()
    pyloot_environ["wsgi.multiprocess"] = False
    wsgi = pyloot.get_wsgi()
    return wsgi(pyloot_environ, start_response)

app.mount("/_pyloot", WSGIMiddleware(pyloot_wrapper))
```

# Disabling gzip encoding
By default, the pyloot server will gzip encode the response metadata.
If pyloot is running behind a middleware that gzip encodes data, encoding can happen twice.
This will result in the following error being shown in the UI:

```text
Error parsing the response data. Check the server logs. If everything looks ok, you make need to disable gzip in pyloot. For more info see the README.
```

To disable gzip encoding do the following:

```python
from pyloot import PyLoot
from pyloot import PyLootServer

pyloot = PyLoot(server=PyLootServer(disable_response_gzip=True))
```


If a remote server is used, it must be configured directly on the server like so:

```python
from pyloot import PyLoot
from pyloot import PyLootServer
from pyloot import HTTPRemoteBackend

backend = HTTPRemoteBackend(host="127.0.0.1", port=8000)
pyloot = PyLoot(server=PyLootServer(backend=backend, disable_response_gzip=True))
```

# Screenshots
### View history of object counts by object group:
![history screenshot](https://raw.githubusercontent.com/reallistic/pyloot/master/docs/history.png)

### Modify history page size
![history screenshot](https://raw.githubusercontent.com/reallistic/pyloot/master/docs/history-pageLimit.png)

### Search history page
![history screenshot](https://raw.githubusercontent.com/reallistic/pyloot/master/docs/history-search.png)

### View objects by group
![objects by group](https://raw.githubusercontent.com/reallistic/pyloot/master/docs/objects-by-group.png)

### Modify objects fetch size
![objects by group](https://raw.githubusercontent.com/reallistic/pyloot/master/docs/objects-fetchLimit.png)

### Modify objects page size
![objects by group](https://raw.githubusercontent.com/reallistic/pyloot/master/docs/objects-pageLimit.png)

### View an object, its attributes, __repr__, children, and parents
![view and object](https://raw.githubusercontent.com/reallistic/pyloot/master/docs/object.png)
