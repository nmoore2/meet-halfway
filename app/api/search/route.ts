import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Helper function to get coordinates from an address
async function getCoordinates(address: string) {
    const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.GOOGLE_MAPS_API_KEY}`
    );
    const data = await response.json();

    if (!data.results?.[0]?.geometry?.location) {
        throw new Error(`Could not find coordinates for address: ${address}`);
    }

    return data.results[0].geometry.location;
}

const getPromptForActivityType = (placeName: string, activityType: string, meetupType: string) => {
    return `You are a local Denver expert. For ${placeName}, a ${activityType.toLowerCase()}, 
    provide exactly 3 brief bullet points about why it would be perfect for a ${meetupType.toLowerCase()}.
    Each bullet point should be specific and under 15 words.
    
    Format as JSON:
    {
        "bullets": [
            "Intimate atmosphere with soft lighting and cozy leather booths",
            "Award-winning wine list with expert sommelier recommendations",
            "Quiet enough for conversation with gentle background music"
        ]
    }`;
};

async function getChatGPTResponse(prompt: string) {
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
            max_tokens: 200
        });

        const content = completion.choices[0].message.content;
        console.log('Raw ChatGPT response:', content);
        return JSON.parse(content || '{"bullets": []}');
    } catch (error) {
        console.error('ChatGPT error:', error);
        return { bullets: [] };
    }
}

async function findPlacesWithGoogle(searchData: any) {
    const { locationA, locationB, activityType, priceRange, meetupType } = searchData;
    console.log('Finding places with params:', { locationA, locationB, activityType, priceRange });

    try {
        // Get coordinates for both locations
        console.log('Getting coordinates for locations...');
        const [locA, locB] = await Promise.all([
            getCoordinates(locationA).then(coords => {
                console.log('Location A coords:', coords);
                return coords;
            }),
            getCoordinates(locationB).then(coords => {
                console.log('Location B coords:', coords);
                return coords;
            })
        ]);

        // Calculate midpoint
        const midpoint = {
            lat: (locA.lat + locB.lat) / 2,
            lng: (locA.lng + locB.lng) / 2
        };
        console.log('Calculated midpoint:', midpoint);

        // Use the correct place type for cafes
        const placeType = activityType === 'Coffee Shop' ? 'cafe' :
            activityType.toLowerCase().replace(' ', '_');

        console.log('Using place type:', placeType);

        // Build the Places API URL
        const placesUrl = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json');
        placesUrl.searchParams.append('location', `${midpoint.lat},${midpoint.lng}`);
        placesUrl.searchParams.append('radius', '5000'); // 5km radius
        placesUrl.searchParams.append('type', placeType);
        placesUrl.searchParams.append('keyword', activityType); // Add keyword for better matching
        if (priceRange !== 'any') {
            const priceLevel = priceRange === '$' ? '1' :
                priceRange === '$$' ? '2' :
                    priceRange === '$$$' ? '3' : '4';
            placesUrl.searchParams.append('minprice', priceLevel);
            placesUrl.searchParams.append('maxprice', priceLevel);
        }
        placesUrl.searchParams.append('key', process.env.GOOGLE_MAPS_API_KEY!);

        console.log('Places API URL (without key):', placesUrl.toString().replace(process.env.GOOGLE_MAPS_API_KEY!, 'REDACTED'));

        const placesResponse = await fetch(placesUrl);
        const places = await placesResponse.json();

        console.log('Places API response status:', placesResponse.status);
        console.log('Places API response:', places);

        const processPlaces = async (places: any[]) => {
            const results = [];

            for (const place of places.slice(0, 3)) {
                console.log('Getting AI description for:', place.name);

                const chatResponse = await getChatGPTResponse(
                    getPromptForActivityType(place.name, searchData.activityType, searchData.meetupType)
                );

                results.push({
                    name: place.name,
                    address: place.vicinity,
                    price: ''.padStart(place.price_level || 1, '$'),
                    bullets: chatResponse.bullets
                });
            }

            return results;
        };

        if (!places.results || places.results.length === 0) {
            console.log('No places found - expanding search radius...');

            // Try again with a larger radius
            placesUrl.searchParams.set('radius', '10000'); // 10km radius
            const retryResponse = await fetch(placesUrl);
            const retryPlaces = await retryResponse.json();

            if (!retryPlaces.results || retryPlaces.results.length === 0) {
                throw new Error('No places found in the selected area');
            }
            return processPlaces(retryPlaces.results);
        }

        return processPlaces(places.results);

    } catch (error) {
        console.error('Google Places API error:', error);
        throw error;
    }
}

export async function POST(req: Request) {
    try {
        const searchData = await req.json();
        console.log('Search data received:', searchData);

        const places = await findPlacesWithGoogle(searchData);
        const resolvedPlaces = await Promise.all(places);

        const response = {
            success: true,
            suggestions: resolvedPlaces,
            message: 'Recommendations found'
        };

        console.log('Sending response:', response);
        return NextResponse.json(response);

    } catch (error: any) {
        console.error('API route error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Failed to process search'
        }, { status: 500 });
    }
}