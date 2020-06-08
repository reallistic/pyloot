import logging
import time
from collections import defaultdict
from typing import Dict
from typing import Iterable
from typing import List
from typing import Optional
from typing import Tuple

from pyloot.backends.base import BaseBackend
from pyloot.types import ObjectDescriptor
from pyloot.types import ObjectTypeHistory


logger = logging.getLogger(__name__)


class InMemoryBackend(BaseBackend):
    def __init__(self, max_history: int = 300):
        self._data: Dict[int, ObjectDescriptor] = {}
        self._history: Dict[Tuple[str, str], List[int]] = defaultdict(list)
        self._sample_size: int = 0
        self._max_history: int = max_history

    def store(self, object_data: List[ObjectDescriptor]):
        cur_time = time.time()
        type_counts: Dict[Tuple[str, str], int] = defaultdict(int)
        to_delete = set(self._data.keys())
        for i, descr in enumerate(object_data):
            if descr.id in self._data:
                object_data[i] = descr._replace(seen=self._data[descr.id].seen)
                to_delete.remove(descr.id)
            else:
                object_data[i] = descr._replace(seen=cur_time)

            type_counts[(descr.type_module, descr.type_name)] += 1

            del descr

        for descr_tuple, count in type_counts.items():
            if descr_tuple not in self._history:
                self._history[descr_tuple] = [0] * self._sample_size
            self._history[descr_tuple].append(count)

            if len(self._history[descr_tuple]) > self._max_history:
                self._history[descr_tuple].pop(0)

        del type_counts

        if self._sample_size < self._max_history:
            self._sample_size += 1

        for _id in to_delete:
            del self._data[_id]

        del to_delete

        for descr in object_data:
            self._data[descr.id] = descr

        del object_data

    def fetch(self, limit: Optional[int] = None) -> List[ObjectDescriptor]:
        results = list(self._data.values())
        if limit is None or limit <= 0:
            return results
        return results[:limit]

    def fetch_by_id(self, _id: int) -> Optional[ObjectDescriptor]:
        return self._data.get(_id)

    def fetch_children_of(self, _id: int) -> List[ObjectDescriptor]:
        item = self.fetch_by_id(_id)
        if not item:
            logger.warning("Unable to find item with id %s", _id)
            return []

        items = [self._data.get(idx) for idx in item.child_ids]
        return [item for item in items if item]

    def fetch_parents_of(self, _id: int) -> List[ObjectDescriptor]:
        item = self.fetch_by_id(_id)
        if not item:
            logger.warning("Unable to find item with id %s", _id)
            return []

        items = [self._data.get(idx) for idx in item.parent_ids]
        return [item for item in items if item]

    def fetch_by_group(
        self, group: str, limit: Optional[int] = None
    ) -> List[ObjectDescriptor]:
        items = [item for item in self._data.values() if item.group == group]
        sorted_items = sorted(items, key=lambda item: item.seen or item.id)
        if limit is None or limit <= 0:
            return sorted_items
        return sorted_items[:limit]

    def fetch_history(self, top: Optional[int] = None) -> List[ObjectTypeHistory]:
        history = [
            self._calculate_history(descr_tuple[0], descr_tuple[1], counts)
            for descr_tuple, counts in self._history.items()
        ]
        sorted_history = sorted(history, reverse=True, key=lambda h: h.counts[-1])
        if top is None or top <= 0:
            return sorted_history
        return sorted_history[:top]

    def get_ids(self) -> Iterable[int]:
        yield id(self)
        yield id(self._data)
        yield id(self._history)
        yield id(self.__dict__)

        for descr_tuple, counts in self._history.items():
            yield id(descr_tuple)
            yield id(counts)

        for descr in self._data.values():
            yield id(descr)
            yield id(descr.parent_ids)
            yield id(descr.child_ids)
            yield id(descr.attrs)

    @classmethod
    def _calculate_history(
        cls, type_module: str, type_name: str, counts: List[int]
    ) -> ObjectTypeHistory:
        _min = min(counts)
        _max = max(counts)
        return ObjectTypeHistory(
            type_name=type_name,
            type_module=type_module,
            counts=counts,
            min=_min,
            max=_max,
        )
