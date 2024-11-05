import OpenAI from 'openai';
import { calculateDrivingMidpoint } from './midpoint';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export async function getRecommendedVenues(
    activityType: string,
    meetupType: string,
    priceRange: string,
    location1: string,
    location2: string
) {
    console.log('🤖 Starting OpenAI request...');
    try {
        if (!location1 || !location2) {
            throw new Error('Both locations are required');
        }

        const midpoint = await calculateDrivingMidpoint(location1, location2);

        const prompt = `Find exactly 5 popular, currently operating ${activityType.toLowerCase()} venues near the EXACT coordinates (${midpoint.lat}, ${midpoint.lng}). This is halfway between ${location1} and ${location2}.

CRITICAL REQUIREMENTS:
1. Most Important: Venues MUST be within ${midpoint.searchRadius.toFixed(1)} miles of the exact coordinates provided
2. MUST be currently operating establishments
3. MUST be ${activityType.toLowerCase()} establishments
4. MUST be suitable for ${meetupType.toLowerCase()}
5. Price Range: ${priceRange !== 'any' ? `ONLY suggest venues matching this price level for the local area: ${priceRange}` : 'venues of any price range'}
6. MUST provide the exact street address for accurate location matching

PRICE LEVEL DEFINITIONS (Always relative to local area):
$ = Budget-friendly spots that are easy on the wallet for this area
$$ = Mid-range establishments with moderate prices typical for this location
$$$ = High-end venues that are among the pricier options in this area

Return EXACTLY 5 venues in this EXACT format:

1. **[Venue Name]**
   - Address: [full street address including number, street, city, state, zip]
   - Best for: [one short phrase about what makes this spot ideal]
   - Why: [2-3 sentences about the venue's atmosphere and what makes it special]

2. **[Venue Name]**
   [continue same format]`;

        const requestObject = {
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: "You are a local expert who understands that price levels are always relative to the local area. A budget-friendly ($) venue in Manhattan would be different from a budget-friendly venue in a small town. Always consider local context when assigning price levels."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0,
            max_tokens: 1000
        };

        // Make the logging more prominent
        console.log('----------------------------------------');
        console.log('🤖 ChatGPT Request:', JSON.stringify(requestObject, null, 2));
        console.log('----------------------------------------');

        const completion = await openai.chat.completions.create(requestObject);

        return completion.choices[0].message.content || '';
    } catch (error) {
        console.error('OpenAI API error:', error);
        throw error;
    }
}