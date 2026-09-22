"""Bounded process-local cache; no remote connections at import time."""
import copy
import fnmatch
import hashlib
import json
import time
from collections import OrderedDict
from threading import RLock

_entries = OrderedDict()
_lock = RLock()
MAX_ENTRIES = 256

def get_cache_key(prefix, params):
    digest = hashlib.sha256(json.dumps(params, sort_keys=True).encode()).hexdigest()
    return f'atlas:{prefix}:{digest}'

def get_cached(key):
    with _lock:
        entry = _entries.get(key)
        if entry is None:
            return None
        expires, value = entry
        if expires <= time.monotonic():
            del _entries[key]
            return None
        _entries.move_to_end(key)
        return copy.deepcopy(value)

def put_cached(key, value, ttl):
    if ttl <= 0 or len(json.dumps(value).encode('utf-8')) > 128_000:
        return
    with _lock:
        _entries[key] = (time.monotonic() + ttl, copy.deepcopy(value))
        _entries.move_to_end(key)
        while len(_entries) > MAX_ENTRIES:
            _entries.popitem(last=False)

def clear_cache(pattern='*'):
    with _lock:
        keys = [k for k in _entries if fnmatch.fnmatchcase(k, pattern)]
        for key in keys:
            del _entries[key]
        return len(keys)

def get_cache_stats():
    with _lock:
        for key in list(_entries):
            get_cached(key)
        return {'backend': 'memory', 'scope': 'process', 'memory_cache_size': len(_entries), 'max_entries': MAX_ENTRIES}
