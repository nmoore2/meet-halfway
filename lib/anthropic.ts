import Anthropic from '@anthropic-ai/sdk';
import { calculateDrivingMidpoint } from './midpoint';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
});

export async function getRecommendedVenues(
    activityType: string,
    meetupType: string,
    priceRange: string,
    location1: string,
    location2: string
) {
    console.log('🤖 Starting Claude request...');
    try {
        // Calculate the driving midpoint first
        const midpoint = await calculateDrivingMidpoint(location1, location2);

        // Get nearby venues using the midpoint
        const nearbyVenues = await getNearbyVenues(midpoint, activityType, priceRange);

        if (!nearbyVenues || nearbyVenues.length === 0) {
            throw new Error('No venues found in the midpoint area');
        }

        const prompt = `From these actual venues near (${midpoint.lat}, ${midpoint.lng}), select the 5 best for a ${meetupType.toLowerCase()}. 
        These venues are confirmed to be within ${midpoint.searchRadius} miles of the driving route midpoint between ${location1} and ${location2}.

        Venues to choose from:
        ${nearbyVenues.map((v, i) => `
        ${i + 1}. ${v.name}
        - Address: ${v.address}
        - Rating: ${v.rating}/5
        ${v.priceLevel ? `- Price Level: ${'$'.repeat(v.priceLevel)}` : ''}
        `).join('\n')}

        For each selected venue, provide:
        1. Why it's perfect for a ${meetupType.toLowerCase()}
        2. 2-3 specific things that make it special
        
        Return in this EXACT format:

        1. **[Venue Name]**
           - Address: [exact address as provided]
           - Description: [2-3 sentence description]

        [continue for remaining venues]`;

        console.log('----------------------------------------');
        console.log('🤖 Claude Request:', prompt);
        console.log('----------------------------------------');

        const message = await anthropic.messages.create({
            model: 'claude-3-opus-20240229',
            max_tokens: 1000,
            temperature: 0,
            system: "You are a local expert focused on finding truly equidistant meeting spots. Your primary goal is to ensure perfectly balanced travel times for both parties.",
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ]
        });

        const response = message.content[0].text;
        console.log('----------------------------------------');
        console.log('🤖 Claude Response:', response);
        console.log('----------------------------------------');

        return response;
    } catch (error) {
        console.error('Claude API error:', error);
        throw error;
    }
}

async function getNearbyVenues(midpoint: any, activityType: string, priceRange: string) {
    const GOOGLE_MAPS_KEY = process.env.GOOGLE_MAPS_API_KEY;

    const placeType = {
        'Bar': 'bar',
        'Cocktails': 'bar',
        'Coffee Shop': 'cafe',
        'Restaurant': 'restaurant',
        'Park': 'park'
    }[activityType] || 'establishment';

    // Convert radius to meters for Google Places API
    const radius = Math.min(midpoint.searchRadius * 1609.34, 50000); // Convert miles to meters, max 50km

    const nearbyUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?` +
        `location=${midpoint.lat},${midpoint.lng}&` +
        `radius=${radius}&` +
        `type=${placeType}&` +
        `key=${GOOGLE_MAPS_KEY}`;

    console.log('🔍 Searching for venues within', midpoint.searchRadius, 'miles');

    const response = await fetch(nearbyUrl).then(res => res.json());

    if (!response.results || response.results.length === 0) {
        console.log('No venues found in search area');
        return [];
    }

    console.log(`Found ${response.results.length} venues before filtering`);

    return response.results
        .filter(place => {
            if (priceRange === 'any') return true;
            const priceLevelMap = { 'Budget': 1, 'Moderate': 2, 'Upscale': 3, 'Luxury': 4 };
            return place.price_level === priceLevelMap[priceRange];
        })
        .map(place => ({
            name: place.name,
            address: place.vicinity,
            rating: place.rating,
            priceLevel: place.price_level,
            placeId: place.place_id
        }));
} 