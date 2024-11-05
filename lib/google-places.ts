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

async function fetchDriveTimes(
    origins: string[],
    destinations: string[],
) {
    const url = new URL('https://maps.googleapis.com/maps/api/distancematrix/json');
    url.searchParams.append('origins', origins.join('|'));
    url.searchParams.append('destinations', destinations.join('|'));
    url.searchParams.append('mode', 'driving');
    url.searchParams.append('key', process.env.GOOGLE_MAPS_API_KEY!);

    console.log('🚗 Fetching drive times for:', {
        origins,
        destinations: destinations.map(d => d.split(',').slice(0, 2).join(',')) // Log shortened coords
    });

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== 'OK') {
        console.error('Distance Matrix API error:', data.status, data.error_message);
        return null;
    }

    return data.rows.map((row: any) =>
        row.elements.map((element: any) => ({
            duration: element.duration?.text || 'Unknown',
            distance: element.distance?.text || 'Unknown'
        }))
    );
}

export async function searchNearbyVenues(
    midpoint: { lat: number; lng: number },
    searchRadius: number,
    activityType: string,
    priceRange: string,
    location1: string,
    location2: string
) {
    const expandedRadius = searchRadius * 2;

    const searchUrl = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json');

    searchUrl.searchParams.append('location', `${midpoint.lat},${midpoint.lng}`);
    searchUrl.searchParams.append('radius', `${expandedRadius * 1609.34}`); // Convert miles to meters, doubled
    searchUrl.searchParams.append('type', mapActivityToGoogleType(activityType));
    searchUrl.searchParams.append('keyword', activityType);
    searchUrl.searchParams.append('key', process.env.GOOGLE_MAPS_API_KEY!);

    if (priceRange && priceRange !== 'any') {
        searchUrl.searchParams.append('minprice', '0');
        searchUrl.searchParams.append('maxprice', priceRange.length.toString());
    }

    console.log('\n🔍 Google Places Search Parameters:');
    console.log('Location:', `${midpoint.lat},${midpoint.lng}`);
    console.log('Radius:', `${expandedRadius} miles (${(expandedRadius * 1609.34).toFixed(0)} meters)`);
    console.log('Type:', mapActivityToGoogleType(activityType));
    console.log('Price Range:', priceRange);
    console.log('Minimum Rating: 4.4');
    console.log('Search URL:', searchUrl.toString());

    const allVenues = [];
    let pageToken = null;

    do {
        if (pageToken) {
            searchUrl.searchParams.set('pagetoken', pageToken);
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        const response = await fetch(searchUrl.toString());
        const data = await response.json();

        if (data.status !== 'OK') {
            console.error('Places API error:', data.status, data.error_message);
            break;
        }

        // Filter for open venues with high ratings
        const validVenues = data.results.filter((venue: any) =>
            venue.business_status !== 'PERMANENTLY_CLOSED' &&
            venue.business_status !== 'CLOSED_TEMPORARILY' &&
            venue.rating >= 4.4 &&
            venue.user_ratings_total >= 100  // Ensure sufficient number of ratings
        );

        console.log(`\nPage Results:`);
        console.log(`Total venues found: ${data.results.length}`);
        console.log(`Valid venues (open & highly rated): ${validVenues.length}`);

        // Log filtered venues for debugging
        validVenues.forEach((venue: any) => {
            console.log(`- ${venue.name}: ${venue.rating}⭐ (${venue.user_ratings_total} reviews)`);
        });

        allVenues.push(...validVenues);
        pageToken = data.next_page_token;

    } while (pageToken && allVenues.length < 30);

    console.log(`\n📍 Final Results:`);
    console.log(`Total highly-rated venues found: ${allVenues.length}`);

    // Sort by rating (highest first)
    const sortedVenues = allVenues
        .sort((a: any, b: any) => b.rating - a.rating)
        .slice(0, 30);

    // Fetch drive times for all venues
    const venueCoords = sortedVenues.map(venue =>
        `${venue.geometry.location.lat},${venue.geometry.location.lng}`
    );

    const driveTimes = await fetchDriveTimes(
        [location1, location2],
        venueCoords
    );

    // Add drive times to venue objects
    return sortedVenues.map((venue, index) => ({
        ...venue,
        driveTimes: driveTimes ? {
            fromA: driveTimes[0][index].duration,
            fromB: driveTimes[1][index].duration
        } : null
    }));
}

function mapActivityToGoogleType(activityType: string): string {
    switch (activityType.toLowerCase()) {
        case 'cocktails':
            return 'bar';
        case 'coffee shop':
            return 'cafe';
        case 'restaurant':
            return 'restaurant';
        case 'park':
            return 'park';
        default:
            return 'establishment';
    }
}