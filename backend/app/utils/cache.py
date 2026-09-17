import os
import redis
import json
import hashlib
from functools import wraps
from fastapi import Request

# Initialize Redis
redis_client = None
try:
    redis_url = os.getenv("REDIS_URL")
    if redis_url:
        redis_client = redis.from_url(redis_url, decode_responses=True)
        redis_client.ping()
        print("✅ Redis connected")
    else:
        print("⚠️ REDIS_URL not found, using in-memory fallback")
        redis_client = None
except Exception as e:
    print(f"⚠️ Redis connection failed: {e}")
    redis_client = None

# In-memory fallback
memory_cache = {}

def get_cache_key(prefix: str, params: dict) -> str:
    """Generate consistent cache key"""
    sorted_params = json.dumps(params, sort_keys=True)
    hash_key = hashlib.md5(sorted_params.encode()).hexdigest()
    return f"{prefix}:{hash_key}"

def cache_response(ttl: int = 300):
    """
    Cache API responses
    ttl: Time-to-live in seconds (default 5 minutes)
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract params for cache key
            cache_key = None
            for arg in args:
                if isinstance(arg, Request):
                    cache_key = get_cache_key(
                        func.__name__,
                        dict(arg.query_params)
                    )
                    break
            if not cache_key:
                cache_key = get_cache_key(func.__name__, kwargs)
            
            # Try Redis
            if redis_client:
                try:
                    cached = redis_client.get(cache_key)
                    if cached:
                        return json.loads(cached)
                except:
                    pass
            
            # Try memory cache
            import time
            if cache_key in memory_cache:
                cached_data, cached_time = memory_cache[cache_key]
                if time.time() - cached_time < ttl:
                    return cached_data
            
            # Execute function
            result = await func(*args, **kwargs)
            
            # Cache in Redis
            if redis_client:
                try:
                    redis_client.setex(cache_key, ttl, json.dumps(result))
                except:
                    pass
            
            # Cache in memory
            import time
            memory_cache[cache_key] = (result, time.time())
            
            return result
        return wrapper
    return decorator

def clear_cache(pattern: str = "*"):
    """Clear cache"""
    if redis_client:
        keys = redis_client.keys(pattern)
        if keys:
            redis_client.delete(*keys)
    keys_to_delete = [k for k in memory_cache.keys() if pattern == "*" or pattern in k]
    for k in keys_to_delete:
        del memory_cache[k]

def get_cache_stats():
    """Get cache statistics"""
    stats = {
        "redis_connected": bool(redis_client),
        "memory_cache_size": len(memory_cache)
    }
    if redis_client:
        try:
            info = redis_client.info()
            stats["redis_keys"] = info.get("db0", {}).get("keys", 0)
        except:
            pass
    return stats