import { Midpoint } from './midpoint';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

interface VenueSearchParams {
    midpoint: Midpoint;
    activityType: string;
    meetupType: string;
    priceRange: string;
}

interface Venue {
    name: string;
    location: {
        lat: number;
        lng: number;
    };
    address: string;
    rating?: number;
    priceLevel?: number;
    photos?: string[];
    description: string;
    driveTimes?: {
        from1: number;
        from2: number;
    };
}

export async function findVenues({ midpoint, activityType, meetupType, priceRange }: VenueSearchParams): Promise<Venue[]> {
    const GOOGLE_MAPS_KEY = process.env.GOOGLE_MAPS_API_KEY;

    // Convert price range to Google's format (1-4)
    const googlePriceLevel = {
        'any': '',
        '$': '1',
        '$$': '1,2',
        '$$$': '2,3',
        '$$$$': '3,4'
    }[priceRange] || '';

    // Convert activity type to Google's place types
    const placeType = {
        'Cocktails': 'bar',
        'Coffee': 'cafe',
        'Restaurant': 'restaurant',
        // Add more mappings as needed
    }[activityType] || 'establishment';

    // Get places from Google
    const radius = Math.min(midpoint.searchRadius * 1609.34, 50000); // Convert miles to meters, max 50km
    const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?` +
        `location=${midpoint.lat},${midpoint.lng}&` +
        `radius=${radius}&` +
        `type=${placeType}` +
        (googlePriceLevel ? `&minprice=${googlePriceLevel.split(',')[0]}&maxprice=${googlePriceLevel.split(',')[1] || googlePriceLevel.split(',')[0]}` : '') +
        `&key=${GOOGLE_MAPS_KEY}`;

    const placesResponse = await fetch(placesUrl).then(res => res.json());

    if (!placesResponse.results?.length) {
        throw new Error('No venues found in this area');
    }

    // Get details for top 5 places
    const detailedPlaces = await Promise.all(
        placesResponse.results.slice(0, 5).map(async place => {
            const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?` +
                `place_id=${place.place_id}&` +
                `fields=name,rating,reviews,price_level,formatted_address,editorial_summary,photos,opening_hours` +
                `&key=${GOOGLE_MAPS_KEY}`;

            const details = await fetch(detailsUrl).then(res => res.json());
            return { place, details: details.result };
        })
    );

    // Generate descriptions using AI
    const descriptions = await generateDescriptions(detailedPlaces, meetupType);

    // Combine the data
    return detailedPlaces.map((place, index) => ({
        name: place.place.name,
        location: place.place.geometry.location,
        address: place.details.formatted_address,
        rating: place.place.rating,
        priceLevel: place.place.price_level,
        photos: place.details.photos?.map(photo =>
            `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photo.photo_reference}&key=${GOOGLE_MAPS_KEY}`
        ),
        description: descriptions[index]
    }));
}

async function generateDescriptions(places: any[], meetupType: string): Promise<string[]> {
    // Create a single prompt for all venues to reduce API calls
    const prompt = `For each of these venues, write a brief, natural description explaining why it would be good for a ${meetupType}. 
    Focus on the atmosphere and experience based on the provided data. Keep each description to 2-3 sentences.

    Venues:
    ${places.map(p => `
    ${p.place.name}:
    - Rating: ${p.place.rating}
    - Price Level: ${p.place.price_level}
    - Reviews: ${p.details.reviews?.slice(0, 2).map(r => r.text).join(' | ')}
    - Editorial Summary: ${p.details.editorial_summary?.overview || 'Not available'}
    `).join('\n')}`;

    const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
            {
                role: "system",
                content: "You are an expert at describing venues in a natural, helpful way. Focus on why each venue would be good for the specified type of meetup."
            },
            {
                role: "user",
                content: prompt
            }
        ],
        temperature: 0.7
    });

    // Split the response into separate descriptions
    return completion.choices[0].message.content
        .split('\n\n')
        .filter(desc => desc.trim())
        .map(desc => desc.replace(/^[^:]+:\s*/, '').trim());
}