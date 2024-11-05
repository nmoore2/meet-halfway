const placeCache = new Map<string, any>();
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

export async function getPlaceDetails(name: string, address: string) {
    const startTime = performance.now();
    const cacheKey = `${name}-${address}`;
    const cached = placeCache.get(cacheKey);

    if (cached && cached.timestamp > Date.now() - CACHE_DURATION) {
        console.log(`Cache hit for ${name}`);
        return cached.data;
    }

    try {
        const searchResult = await fetchPlaceSearch(name, address);

        if (!searchResult.place_id) {
            console.error(`No place_id found for ${name}`);
            return {};
        }

        const detailsResult = await fetchPlaceDetails(searchResult.place_id);

        // Process photos if they exist
        const photoUrls = detailsResult.photos?.slice(0, 5).map((photo: any) => {
            const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photo.photo_reference}&key=${process.env.GOOGLE_MAPS_API_KEY}`;
            console.log('Generated photo URL:', url);
            return url;
        }) || [];

        const result = {
            photos: photoUrls,
            geometry: searchResult.geometry,
            price_level: detailsResult.price_level,
            business_status: detailsResult.business_status,
            opening_hours: detailsResult.opening_hours
        };

        placeCache.set(cacheKey, {
            timestamp: Date.now(),
            data: result
        });

        console.log(`Processed ${name} with ${photoUrls.length} photos in ${performance.now() - startTime}ms`);
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
    detailsUrl.searchParams.append('fields', [
        'photos',
        'price_level',
        'geometry',
        'business_status',
        'opening_hours',
        'formatted_phone_number',
        'website'
    ].join(','));
    detailsUrl.searchParams.append('key', process.env.GOOGLE_MAPS_API_KEY!);

    console.log('Fetching place details for:', placeId);
    const response = await fetch(detailsUrl.toString());
    const data = await response.json();

    if (data.status !== 'OK') {
        console.error(`Place Details failed:`, data.status, data.error_message);
        return {};
    }

    // Log the photo data we received
    if (data.result?.photos) {
        console.log(`Found ${data.result.photos.length} photos`);
    }

    return data.result || {};
}