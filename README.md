PyLoot
===========

PyLoot is a memory leak detector based on [Dozer](https://github.com/mgedmin/dozer) and [vprof](https://github.com/nvdv/vprof) with added support for process based server workloads.


This project is in active development and may contain bugs or otherwise work in ways not expected or intended.

# Installation
```shell script
$ pip install pyloot
```

# Usage
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
Return a WSGI compatible application serving the PyLoot remote backend and
and the website.
:return: ::class::`PyLootServer`
"""
loot.get_wsgi()
```


# Running embedded
**Starlette/FastApi/ASGI**
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
pyloot = PyLoot(host="127.0.0.1", port=8030)
...
```
```shell script
# Start the remote server
$ pyloot --help
usage: pyloot [-h HOST] [-p PORT] [--help]

optional arguments:
-h HOST, --host HOST  Host to listen on. (Default: 0.0.0.0)
-p PORT, --port PORT  Port to listen on. (Default: 8030)
--help                show this help message and exit
```

# Bypass the multiprocessing check
If pyloot detects it is running in a multiprocessing environment with an inmemory backend
it will refuse to serve the webpages/requests.

The WSGIMiddleware of starlette sets `environ["wsgi.multiprocess"]=True` regardless of the server.
This can by bypassed with a wrapper **use with caution**:

```python
pyloot = PyLoot()

def pyloot_wrapper(wsgi_environ, start_response):
    pyloot_environ = wsgi_environ.copy()
    pyloot_environ["wsgi.multiprocess"] = False
    wsgi = pyloot.get_wsgi()
    return wsgi(pyloot_environ, start_response)

app.mount("/_pyloot", WSGIMiddleware(pyloot_wrapper))
```

# Screenshots
### View history of object counts by object group:
![history screenshot](https://raw.githubusercontent.com/reallistic/pyloot/master/docs/historypage.png)

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
