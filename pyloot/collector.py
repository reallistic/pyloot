import cgi
import gc
import logging
import sys
from collections import defaultdict
from types import FrameType
from typing import Any
from typing import Dict
from typing import Iterable
from typing import List
from typing import Optional
from typing import Set

from pyloot.types import ObjectDescriptor

logger = logging.getLogger(__name__)

METHOD_TYPES = [
    type(tuple.__le__),  # 'wrapper_descriptor'
    type([1].__le__),  # 'method-wrapper'
    type(sys.getcheckinterval),  # 'builtin_function_or_method'
    type(cgi.FieldStorage.getfirst),  # 'instancemethod'
    type(logger.addFilter),  # 'bound instancemethod'
]


def _type_name(obj: object) -> str:
    return type(obj).__name__


def _safe_repr(obj: object) -> str:
    try:
        return repr(obj)
    except Exception as e:
        return "(__repr_error__:{}:{})".format(_type_name(e), _type_name(obj))


def _safe_getattr(obj: object, k: str, default: Any = Exception):
    try:
        from zope.interface.ro import C3

        if isinstance(obj, C3) or issubclass(obj, C3):  # type: ignore
            if k.startswith("ORIG_"):
                return "__ignored_zope_interface_C3_{}__".format(k)
    except (ImportError, TypeError):
        pass

    try:
        return getattr(obj, k)
    except Exception as e:
        if default is Exception:
            return "__getattr_error__:{}".format(_type_name(e))
        else:
            return default


def _get_pretty_name(obj: object) -> str:
    obj_type = type(obj)
    type_name = "%s.%s" % (obj_type.__module__, obj_type.__name__)
    pretty_type = type_name.replace("__builtin__.", "")
    pretty_type = pretty_type.replace("builtins.", "")

    name = _safe_getattr(obj, "__name__", default=None)
    if name is not None:
        pretty_type = "%s %r" % (pretty_type, name)
    return pretty_type


def _safe_get_attrs(obj: object) -> Dict[str, str]:
    try:
        keys = dir(obj)
    except Exception as e:
        return {"__dir_error__": "{}:{}".format(_type_name(e), str(e))}
    kv_pairs = [(k, _safe_getattr(obj, k)) for k in keys]
    return {k: _safe_repr(v) for k, v in kv_pairs if type(v) not in METHOD_TYPES}


def _should_include_object(ref: object, ignore_set: Set[int]) -> bool:
    thisfile = sys._getframe().f_code.co_filename
    # Exclude all frames that are from this module.
    if isinstance(ref, FrameType) and ref.f_code.co_filename == thisfile:
        return False

    # Exclude all functions and classes from this module or reftree.
    mod = str(getattr(ref, "__module__", ""))
    if "pyloot" in mod or mod == "__main__":
        return False  # pragma: nocover -- avoid bug in coverage due to Python's peephole optimizer

    if id(ref) in ignore_set:
        return False

    return True


def get_child_ids(obj: object) -> List[int]:
    """
    Return children of the provided object using gc.get_referents

    :param obj: The object
    :return: List of object ids
    """
    return [id(child) for child in gc.get_referents(obj)]


def get_data(obj: object) -> ObjectDescriptor:
    """
    Return a Object descriptor for the given object

    :param obj: The object
    :return:
    """
    obj_type = type(obj)
    return ObjectDescriptor(
        type_name=str(obj_type.__name__),
        type_module=str(obj_type.__module__),
        obj_name=_get_pretty_name(obj),
        id=id(obj),
        attrs=_safe_get_attrs(obj),
        parent_ids=[],
        child_ids=get_child_ids(obj),
        repr=_safe_repr(obj),
    )


def get_object_descriptors(
    ignored: Optional[Iterable[int]] = None,
) -> List[ObjectDescriptor]:
    """
    Return list of ::class::`ObjectDescriptor` instances for all objects in memory
    after a call to gc.collect.
    """

    if ignored:
        ignore_set = set(ignored)
    else:
        ignore_set = set()

    ignore_set.add(id(ignore_set))

    del ignored

    gc.collect()

    objs: List[object] = gc.get_objects()

    objs = [obj for obj in objs if _should_include_object(obj, ignore_set)]
    ignore_set.add(id(objs))
    results = [get_data(obj) for obj in objs]
    del objs
    del ignore_set
    child_to_parent: Dict[int, Set[int]] = defaultdict(set)

    for descr in results:
        for child_id in descr.child_ids:
            child_to_parent[child_id].add(descr.id)

    for descr in results:
        if descr.id in child_to_parent:
            descr.parent_ids.extend(child_to_parent[descr.id])

    del child_to_parent

    return results
