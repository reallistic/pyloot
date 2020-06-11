from pyloot import collector
from pyloot import InMemoryBackend


def test_store_blank_slate():
    backend = InMemoryBackend()
    test_obj = dict(a=1)
    obj_descr = collector.get_data(test_obj)
    backend.store([obj_descr])

    descrs = backend.fetch()
    assert len(descrs) == 1
    assert descrs[0].seen
    old_seen = descrs[0].seen

    history = backend.fetch_history()
    assert len(history) == 1
    assert history[0].counts == [1]

    # duplicate obj should not increase data or count
    backend.store([obj_descr])

    descrs = backend.fetch()
    assert len(descrs) == 1
    assert descrs[0].seen == old_seen

    history = backend.fetch_history()
    assert len(history) == 1
    assert history[0].counts == [1, 1]

    test_obj2 = dict(a=1)
    obj_descr2 = collector.get_data(test_obj2)

    # new obj should increase data and count
    backend.store([obj_descr, obj_descr2])

    descrs = backend.fetch()
    assert len(descrs) == 2
    assert descrs[0].seen == old_seen
    assert descrs[1].seen

    history = backend.fetch_history()
    assert len(history) == 1
    assert history[0].counts == [1, 1, 2]
