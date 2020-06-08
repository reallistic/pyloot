from typing import Dict
from typing import List
from typing import NamedTuple
from typing import Optional


class ObjectDescriptor(NamedTuple):
    repr: str
    type_name: str
    type_module: str
    obj_name: str
    id: int
    attrs: Dict[str, str]
    parent_ids: List[int]
    child_ids: List[int]
    seen: Optional[float] = None

    @property
    def group(self):
        return "{}.{}".format(self.type_module, self.type_name)


class ObjectTypeHistory(NamedTuple):
    type_name: str
    type_module: str
    counts: List[int]
    min: int
    max: int
