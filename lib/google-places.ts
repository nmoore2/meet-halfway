import { DENVER_DISTRICTS } from './districts';

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
    console.log('\n📡 Making Google Places API request...');

    // When artsy & eclectic is selected, prioritize RiNo
    let searchLocation = params.midpoint;
    if (params.preferences?.neighborhoodVibe <= 0.5) {  // Artsy & Eclectic selected
        const rinoDistrict = DENVER_DISTRICTS.find(d => d.name.includes('RiNo'));
        if (rinoDistrict) {
            searchLocation = rinoDistrict.center;
            console.log('🎨 Prioritizing RiNo district for artsy venues');
        }
    }

    const searchUrl = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json');
    searchUrl.searchParams.append('location', `${searchLocation.lat},${searchLocation.lng}`);
    // Reduce radius to stay within district
    searchUrl.searchParams.append('radius', '1000');  // 1km radius to match RiNo district size
    searchUrl.searchParams.append('key', process.env.GOOGLE_MAPS_API_KEY!);

    // Get base type from activity
    const baseType = mapActivityToGoogleType(params.activityType);
    searchUrl.searchParams.append('type', baseType);

    // Add keywords based on preferences
    const keywords = [];

    // Venue Style keywords (0 = Casual, 1 = Refined)
    if (params.preferences?.venueStyle <= 0.5) {
        keywords.push('casual', 'creative', 'funky');
        console.log('Adding casual keywords');
    } else {
        keywords.push('upscale', 'refined', 'elegant');
        console.log('Adding refined keywords');
    }

    // Neighborhood keywords (0 = Artsy, 1 = Polished)
    if (params.preferences?.neighborhoodVibe <= 0.5) {
        keywords.push('artsy', 'indie', 'craft');
        console.log('Adding artsy keywords');
    } else {
        keywords.push('upscale', 'polished', 'established');
        console.log('Adding polished keywords');
    }

    // Location Priority (0 = Equal Distance, 1 = Entertainment)
    if (params.preferences?.locationPriority >= 0.5) {
        keywords.push('entertainment', 'nightlife', 'district');
        console.log('Adding entertainment keywords');
    }

    // Add base type keywords
    if (params.activityType.toLowerCase() === 'cocktails') {
        keywords.push('cocktail', 'bar', 'lounge');
    }

    console.log('🎯 Raw slider values:', {
        venueStyle: params.preferences?.venueStyle,
        neighborhoodVibe: params.preferences?.neighborhoodVibe,
        locationPriority: params.preferences?.locationPriority
    });

    console.log('🎯 Using preferences:', {
        venueStyle: params.preferences?.venueStyle <= 0.5 ? 'Casual & Creative' : 'Refined & Elegant',
        neighborhoodVibe: params.preferences?.neighborhoodVibe <= 0.5 ? 'Artsy & Eclectic' : 'Polished & Established',
        locationPriority: params.preferences?.locationPriority >= 0.5 ? 'Entertainment Districts' : 'Equal Distance'
    });

    searchUrl.searchParams.append('keyword', keywords.join('|'));

    console.log('🔍 Search criteria:', {
        type: baseType,
        keywords: keywords.join(', '),
        location: `${params.midpoint.lat}, ${params.midpoint.lng}`,
        radius: '5000m'
    });

    // Add relevant venue types based on the vibe we want
    const types = ['bar'];  // Base type for cocktails
    if (params.preferences?.neighborhoodVibe <= 0.5) {  // Artsy & Eclectic
        types.push('art_gallery', 'museum', 'night_club');
    }

    searchUrl.searchParams.append('type', types.join('|'));

    try {
        const response = await fetch(searchUrl.toString());
        if (!response.ok) {
            console.error('❌ Places API error:', response.status);
            return [];
        }

        const data = await response.json();
        console.log(`📊 Results: ${data.results?.length || 0} total venues found`);

        // Less restrictive filtering
        const filteredVenues = data.results?.filter((venue: any) =>
            venue.rating >= 3.5 &&
            venue.user_ratings_total >= 15
        ) || [];

        console.log(`✨ Filtered to ${filteredVenues.length} venues meeting criteria\n`);
        return filteredVenues;

    } catch (error) {
        console.error('❌ Error searching venues:', error);
        return [];
    }
}

function matchesNeighborhoodPreference(venue: any, neighborhoodVibe: number): number {
    const artsyKeywords = ['art', 'gallery', 'indie', 'craft', 'brewery', 'creative', 'studio'];
    const polishedKeywords = ['upscale', 'fine', 'lounge', 'cocktail'];

    const venueText = [
        venue.name,
        venue.vicinity,
        ...(venue.types || [])
    ].join(' ').toLowerCase();

    const artsyMatches = artsyKeywords.filter(k => venueText.includes(k)).length;
    const polishedMatches = polishedKeywords.filter(k => venueText.includes(k)).length;

    return neighborhoodVibe < 0.5 ?
        artsyMatches / artsyKeywords.length :
        polishedMatches / polishedKeywords.length;
}

function mapActivityToGoogleType(activityType: string): string {
    const typeMap: { [key: string]: string } = {
        'cocktails': 'bar',
        'coffee': 'cafe',
        'restaurant': 'restaurant',
        'park': 'park'
    };

    const type = typeMap[activityType?.toLowerCase()];
    console.log(`Mapped activity ${activityType} to type ${type || 'establishment'}`);
    return type || 'establishment';
}

function getActivityKeywords(activityType: string): string[] {
    switch (activityType?.toLowerCase()) {
        case 'cocktails':
            return ['bar'];  // Simplified keywords
        case 'coffee':
            return ['cafe'];
        case 'restaurant':
            return ['restaurant'];
        default:
            return [];
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