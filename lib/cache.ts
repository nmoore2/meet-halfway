interface CacheEntry {
    data: any;
    timestamp: number;
}

class RequestCache {
    private cache: Map<string, CacheEntry> = new Map();
    private TTL = 1000 * 60 * 60; // 1 hour cache

    createKey(location1: string, location2: string, activityType: string, meetupType: string, priceRange: string): string {
        return `${location1}|${location2}|${activityType}|${meetupType}|${priceRange}`;
    }

    get(key: string) {
        const entry = this.cache.get(key);
        if (!entry) return null;

        if (Date.now() - entry.timestamp > this.TTL) {
            this.cache.delete(key);
            return null;
        }

        return entry.data;
    }

    set(key: string, data: any) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }
}

export const requestCache = new RequestCache(); 