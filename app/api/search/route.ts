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

        const suggestions = await findPlacesWithGoogle(searchData);

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
            stack: error.stack
        });

        return NextResponse.json({
            success: false,
            message: error.message || 'Failed to get recommendations',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
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

        const placesResponse = await fetch(placesUrl);
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

                const detailsResponse = await fetch(detailsUrl);
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
        const results = await Promise.all(
            detailedPlaces.map(async (place: any) => {
                try {
                    const chatResponse = await getChatGPTResponse(
                        getPromptForActivityType(place.name, activityType, meetupType)
                    );

                    // Extract rating from the first line
                    const rating = parseInt(chatResponse.bullets[0].match(/Rating: (\d+)/)?.[1] || '0');

                    // Remove the rating line from bullets
                    const bullets = chatResponse.bullets.filter(bullet => !bullet.startsWith('Rating:'));

                    return {
                        name: place.name,
                        address: place.vicinity,
                        price: ''.padStart(place.price_level || 1, '$'),
                        rating: rating,
                        bullets: bullets,
                        photos: place.photos
                    };
                } catch (chatError) {
                    console.error(`Chat error for ${place.name}:`, chatError);
                    return null;
                }
            })
        ).then(results =>
            results
                .filter(Boolean)
                // Sort by rating in descending order
                .sort((a, b) => (b?.rating || 0) - (a?.rating || 0))
        );

        if (results.length === 0) {
            throw new Error('No results could be processed completely');
        }

        return results;

    } catch (error: any) {
        console.error('Places API error:', {
            message: error.message,
            stack: error.stack
        });
        throw error;
    }
}

function getPromptForActivityType(placeName: string, activityType: string, meetupType: string) {
    return `As a local Denver expert, evaluate ${placeName} as a ${activityType} spot for a ${meetupType}. 
    First, rate this venue from 1-10 for this specific type of meetup, where 10 is perfect.
    Then provide exactly 3 bullet points about the venue.
    
    Focus your evaluation and bullet points on:
    • Atmosphere and ambiance
    • Unique features or specialties
    • Why it's specifically good (or not) for ${meetupType}
    
    Format your response exactly like this:
    Rating: [1-10]
    • [First bullet point]
    • [Second bullet point]
    • [Third bullet point]
    
    Keep each bullet under 80 characters.`;
}