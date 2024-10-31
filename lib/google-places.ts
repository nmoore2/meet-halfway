const placeCache = new Map<string, any>();
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

export async function getPlaceDetails(name: string, address: string) {
    const startTime = performance.now();
    const cacheKey = `${name}-${address}`;
    const cached = placeCache.get(cacheKey);

    if (cached && cached.timestamp > Date.now() - CACHE_DURATION) {
        console.log(`Cache hit for ${name} (${performance.now() - startTime}ms)`);
        return cached.data;
    }

    try {
        const searchStartTime = performance.now();
        const searchResult = await fetchPlaceSearch(name, address);
        console.log(`Place Search for ${name}: ${performance.now() - searchStartTime}ms`);

        if (!searchResult.place_id) {
            console.error(`No place_id found for ${name}`);
            return {};
        }

        const detailsStartTime = performance.now();
        const detailsResult = await fetchPlaceDetails(searchResult.place_id);
        console.log(`Place Details for ${name}: ${performance.now() - detailsStartTime}ms`);

        const result = {
            photos: detailsResult.photos?.map((photo: any) =>
                `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photo.photo_reference}&key=${process.env.GOOGLE_MAPS_API_KEY}`
            ) || [],
            geometry: searchResult.geometry,
            price_level: detailsResult.price_level
        };

        placeCache.set(cacheKey, {
            timestamp: Date.now(),
            data: result
        });

        console.log(`Total time for ${name}: ${performance.now() - startTime}ms`);
        return result;
    } catch (error) {
        console.error(`Error fetching place details for ${name}:`, error);
        return {};
    }
}

async function fetchPlaceSearch(name: string, address: string) {
    const searchUrl = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
    searchUrl.searchParams.append('query', `${name} ${address}`);
    searchUrl.searchParams.append('key', process.env.GOOGLE_MAPS_API_KEY!);

    const response = await fetch(searchUrl.toString());
    const data = await response.json();

    if (data.status !== 'OK') {
        console.error(`Place Search failed for ${name}:`, data.status);
    }

    return data.results?.[0] || {};
}

async function fetchPlaceDetails(placeId: string) {
    const detailsUrl = new URL('https://maps.googleapis.com/maps/api/place/details/json');
    detailsUrl.searchParams.append('place_id', placeId);
    detailsUrl.searchParams.append('fields', 'photos,price_level');
    detailsUrl.searchParams.append('key', process.env.GOOGLE_MAPS_API_KEY!);

    const response = await fetch(detailsUrl.toString());
    const data = await response.json();

    if (data.status !== 'OK') {
        console.error(`Place Details failed for ${placeId}:`, data.status);
    }

    return data.result || {};
}