import { NextResponse } from 'next/server';
import { getChatGPTResponse } from '../../../lib/openai';
import { getCoordinates } from '../../../lib/geocoding';

export async function POST(request: Request) {
    try {
        const searchData = await request.json();

        if (!searchData.locationA || !searchData.locationB) {
            return NextResponse.json({
                success: false,
                message: 'Missing location information'
            }, { status: 400 });
        }

        const suggestions = await findPlacesWithGoogle(searchData).catch(error => {
            console.error('Failed to find places:', error);
            throw new Error('Failed to connect to external services. Please try again.');
        });

        if (!suggestions || suggestions.length === 0) {
            return NextResponse.json({
                success: false,
                message: 'No suggestions found'
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            suggestions,
            message: 'Recommendations found'
        });
    } catch (error: any) {
        console.error('Search error:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });

        return NextResponse.json({
            success: false,
            message: error.message || 'Failed to get recommendations',
            error: process.env.NODE_ENV === 'development' ? {
                stack: error.stack,
                name: error.name
            } : undefined
        }, {
            status: error.name === 'ERR_CONNECTION_REFUSED' ? 503 : 500,
            headers: {
                'Retry-After': '5'
            }
        });
    }
}

async function fetchWithRetry(url: string, options: RequestInit, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, {
                ...options,
                signal: AbortSignal.timeout(5000) // 5 second timeout
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response;
        } catch (error) {
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
        }
    }
    throw new Error('Failed after retries');
}

async function findPlacesWithGoogle(searchData: any) {
    const { locationA, locationB, activityType, priceRange, meetupType } = searchData;

    try {
        // Get coordinates for both locations
        const [locA, locB] = await Promise.all([
            getCoordinates(locationA),
            getCoordinates(locationB)
        ]).catch(error => {
            throw new Error(`Failed to get coordinates: ${error.message}`);
        });

        if (!locA || !locB) {
            throw new Error('Could not find coordinates for one or both locations');
        }

        // Calculate midpoint
        const midpoint = {
            lat: (locA.lat + locB.lat) / 2,
            lng: (locA.lng + locB.lng) / 2
        };

        // Initial places search
        const placesUrl = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json');
        placesUrl.searchParams.append('location', `${midpoint.lat},${midpoint.lng}`);
        placesUrl.searchParams.append('radius', '5000');
        placesUrl.searchParams.append('type', activityType.toLowerCase() === 'coffee shop' ? 'cafe' : 'restaurant');
        placesUrl.searchParams.append('keyword', activityType);
        placesUrl.searchParams.append('key', process.env.GOOGLE_MAPS_API_KEY!);

        const placesResponse = await fetchWithRetry(placesUrl.toString(), {});
        if (!placesResponse.ok) {
            throw new Error(`Places API error: ${placesResponse.statusText}`);
        }

        const placesData = await placesResponse.json();

        if (!placesData.results || placesData.results.length === 0) {
            throw new Error('No places found in the area');
        }

        // Get detailed information for each place including photos
        const detailedPlaces = await Promise.all(
            placesData.results.slice(0, 3).map(async (place: any) => {
                const detailsUrl = new URL('https://maps.googleapis.com/maps/api/place/details/json');
                detailsUrl.searchParams.append('place_id', place.place_id);
                detailsUrl.searchParams.append('fields', 'name,vicinity,price_level,photos');
                detailsUrl.searchParams.append('key', process.env.GOOGLE_MAPS_API_KEY!);

                const detailsResponse = await fetchWithRetry(detailsUrl.toString(), {});
                if (!detailsResponse.ok) {
                    throw new Error(`Failed to get details for ${place.name}`);
                }

                const details = await detailsResponse.json();

                // Directly create photo URLs without metadata check
                const photoUrls = details.result.photos
                    ? details.result.photos
                        .slice(0, 6)
                        .map((photo: any) =>
                            `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photo.photo_reference}&key=${process.env.GOOGLE_MAPS_API_KEY}`
                        )
                    : [];

                console.log(`Photos for ${place.name}:`, photoUrls); // Debug log

                return {
                    ...place,
                    photos: photoUrls
                };
            })
        ).then(places => places.filter(Boolean));

        if (detailedPlaces.length === 0) {
            throw new Error('Failed to get detailed information for any places');
        }

        // Process places with chat responses
        const placeNames = detailedPlaces.map(place => place.name);

        // Get the ranked recommendations
        const chatResponse = await getChatGPTResponse(
            getPromptForActivityType(placeNames, activityType, meetupType)
        );

        // Parse the response to create a map of place names to their descriptions
        const placeDescriptions = new Map();
        let currentPlace = '';

        chatResponse.bullets.forEach(line => {
            if (line.match(/^\d+\./)) {
                // This is a place name line (e.g., "1. Little Owl Coffee")
                currentPlace = line.split('. ')[1];
            } else if (currentPlace && (line.startsWith('• Why:') || line.startsWith('• Best for:'))) {
                if (!placeDescriptions.has(currentPlace)) {
                    placeDescriptions.set(currentPlace, []);
                }
                placeDescriptions.get(currentPlace).push(line);
            }
        });

        // Map the descriptions back to the places
        return detailedPlaces.map(place => ({
            name: place.name,
            address: place.vicinity,
            price: ''.padStart(place.price_level || 1, '$'),
            bullets: placeDescriptions.get(place.name) || [],
            photos: place.photos
        }));

    } catch (error: any) {
        console.error('Places API error:', {
            message: error.message,
            stack: error.stack
        });
        throw error;
    }
}

function getPromptForActivityType(placeName: string[], activityType: string, meetupType: string) {
    return `As a local Denver expert, rank and evaluate these ${activityType} spots for a ${meetupType}:
    ${placeName.join(', ')}

    Rank them in order of best fit for a ${meetupType}, considering atmosphere, location, and overall experience.
    For each place, provide:
    • Why: Explain what makes it suitable (or not) for this type of meetup
    • Best for: Describe in one line the ideal scenario

    Format your response as a numbered list, like this:
    1. [Place Name]
    • Why: [Detailed explanation about atmosphere, location, and suitability]
    • Best for: [Brief, specific description of ideal use case]

    2. [Next Place]
    ...`;
}