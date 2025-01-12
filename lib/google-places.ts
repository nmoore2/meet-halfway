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

async function getDriveTimes(venues: any[], location1: string, location2: string) {
    const BATCH_SIZE = 10;
    let allDriveTimes = {
        fromA: [],
        fromB: []
    };

    try {
        // Process venues in batches
        for (let i = 0; i < venues.length; i += BATCH_SIZE) {
            const batch = venues.slice(i, i + BATCH_SIZE);
            const destinations = batch.map(venue =>
                `${venue.geometry.location.lat},${venue.geometry.location.lng}`
            );

            const response = await fetch(
                `https://maps.googleapis.com/maps/api/distancematrix/json?` +
                `origins=${encodeURIComponent(location1)}|${encodeURIComponent(location2)}` +
                `&destinations=${destinations.join('|')}` +
                `&mode=driving` +
                `&key=${process.env.GOOGLE_MAPS_API_KEY}`
            );

            const data = await response.json();

            if (data.status === 'OK' && data.rows?.length >= 2) {
                // Extract drive times for location A
                const fromA = data.rows[0].elements.map(element => ({
                    duration: element.duration?.value ? Math.round(element.duration.value / 60) : null
                }));

                // Extract drive times for location B
                const fromB = data.rows[1].elements.map(element => ({
                    duration: element.duration?.value ? Math.round(element.duration.value / 60) : null
                }));

                allDriveTimes.fromA.push(...fromA);
                allDriveTimes.fromB.push(...fromB);
            } else {
                // If API call fails, add null values for this batch
                const nullTimes = batch.map(() => ({ duration: null }));
                allDriveTimes.fromA.push(...nullTimes);
                allDriveTimes.fromB.push(...nullTimes);
            }

            // Add delay between batches
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        return allDriveTimes;

    } catch (error) {
        console.error('Error fetching drive times:', error);
        // Return null drive times for all venues if there's an error
        return {
            fromA: venues.map(() => ({ duration: null })),
            fromB: venues.map(() => ({ duration: null }))
        };
    }
}

export async function searchNearbyVenues(params: SearchParams): Promise<any[]> {
    const type = mapActivityToGoogleType(params.activityType);
    const keywords = [
        ...getActivityKeywords(params.activityType),
        ...getVibeKeywords(params.activityType)
    ].join('|');

    const searchUrl = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json');
    searchUrl.searchParams.append('location', `${params.midpoint.lat},${params.midpoint.lng}`);
    searchUrl.searchParams.append('radius', String(params.radius * 1000)); // Convert km to meters
    searchUrl.searchParams.append('type', type);
    searchUrl.searchParams.append('keyword', keywords);
    if (params.priceRange !== 'any') {
        searchUrl.searchParams.append('minprice', params.priceRange);
        searchUrl.searchParams.append('maxprice', params.priceRange);
    }
    searchUrl.searchParams.append('key', process.env.GOOGLE_MAPS_API_KEY!);

    let allVenues: any[] = [];
    let pageToken: string | undefined;

    try {
        do {
            if (pageToken) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

            const url = pageToken
                ? `${searchUrl.toString()}&pagetoken=${pageToken}`
                : searchUrl.toString();

            const response = await fetch(url);
            const data = await response.json();

            if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
                console.error('Places API error:', { status: data.status, error_message: data.error_message });
                throw new Error(`Places API error: ${data.status}`);
            }

            // Filter venues
            const validVenues = (data.results || []).filter((venue: any) =>
                venue.business_status !== 'PERMANENTLY_CLOSED' &&
                venue.business_status !== 'CLOSED_TEMPORARILY' &&
                venue.rating >= 3.5 &&
                venue.user_ratings_total >= 10
            );

            allVenues = [...allVenues, ...validVenues];
            pageToken = data.next_page_token;

        } while (pageToken && allVenues.length < params.maxResults);

        // Sort by rating after collecting all venues
        allVenues.sort((a, b) => b.rating - a.rating);

        // Get drive times for all venues
        const driveTimes = await getDriveTimes(allVenues, params.location1, params.location2);

        return allVenues.map((venue, index) => ({
            ...venue,
            driveTimes: {
                fromLocationA: driveTimes.fromA[index]?.duration || null,
                fromLocationB: driveTimes.fromB[index]?.duration || null
            }
        }));

    } catch (error) {
        console.error('Error fetching venues:', error);
        throw error;
    }
}

function mapActivityToGoogleType(activityType: string): string {
    if (!activityType) {
        console.warn('No activity type provided, defaulting to establishment');
        return 'establishment';
    }

    const typeMap: { [key: string]: string } = {
        'bar': 'bar',
        'cocktails': 'bar',
        'coffee shop': 'cafe',
        'restaurant': 'restaurant',
        'park': 'park'
    };

    const mappedType = typeMap[activityType.toLowerCase()];
    console.log('Activity type:', activityType, '-> Mapped to:', mappedType);
    return mappedType || 'establishment';
}

function getActivityKeywords(activityType: string): string[] {
    if (!activityType) {
        console.warn('No activity type provided for keywords');
        return [];
    }

    switch (activityType.toLowerCase()) {
        case 'cocktails':
            return ['romantic', 'trendy', 'cocktail'];
        case 'coffee shop':
            return ['coffee', 'cafe', 'cozy'];
        case 'restaurant':
            return ['restaurant', 'dining', 'romantic'];
        case 'park':
            return ['park', 'scenic', 'peaceful'];
        default:
            return [activityType];
    }
}

function getVibeKeywords(vibeType: string): string[] {
    if (!vibeType) {
        console.warn('No vibe type provided for keywords');
        return [];
    }

    switch (vibeType.toLowerCase()) {
        case 'first date':
            return ['first date', 'romantic', 'intimate'];
        case 'casual':
            return ['casual', 'relaxed', 'laid-back'];
        case 'fancy':
            return ['upscale', 'elegant', 'fine'];
        default:
            return [];
    }
}