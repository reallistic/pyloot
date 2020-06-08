from typing import NamedTuple

from pyloot import InMemoryBackend
from pyloot import PyLoot


class Foo(NamedTuple):
    a: int
    b: int


MEM_LK_SIM = []


def test_collection():
    f = Foo(1, 2)
    MEM_LK_SIM.append(f)
    pyloot = PyLoot()
    pyloot.collect_objects()
    backend: InMemoryBackend = pyloot._backend
    assert isinstance(backend, InMemoryBackend)
    objs = backend.fetch()
    assert len(objs) > 0
    obj = backend.fetch_by_id(id(f))
    assert obj
    objs = backend.fetch_by_group("test_collection.Foo")
    assert len(objs) == 1
