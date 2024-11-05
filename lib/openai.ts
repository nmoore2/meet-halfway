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

        const prompt = `Find exactly 5 popular, currently operating ${activityType.toLowerCase()} venues that are AS CLOSE AS POSSIBLE to the midpoint coordinates (${midpoint.lat}, ${midpoint.lng}). This is halfway between ${location1} and ${location2}.

STRICT LOCATION REQUIREMENTS:
1. MOST CRITICAL: Venues MUST be within ${(midpoint.searchRadius / 2).toFixed(1)} miles of the EXACT midpoint coordinates provided
2. Prioritize venues that would result in similar drive times from both locations
3. DO NOT suggest venues that are significantly closer to one location than the other
4. Avoid venues that would create unbalanced travel times

OTHER REQUIREMENTS:
5. MUST be currently operating establishments
6. MUST be ${activityType.toLowerCase()} establishments
7. MUST be suitable for ${meetupType.toLowerCase()}
8. Price Range: ${priceRange !== 'any' ? `ONLY suggest venues matching this price level for the local area: ${priceRange}` : 'venues of any price range'}
9. MUST provide the exact street address for accurate location matching

PRICE LEVEL DEFINITIONS (Always relative to local area):
$ = Budget-friendly spots that are easy on the wallet for this area
$$ = Mid-range establishments with moderate prices typical for this location
$$$ = High-end venues that are among the pricier options in this area

Return EXACTLY 5 venues in this EXACT format:

1. **[Venue Name]**
   - Address: [full street address including number, street, city, state, zip]
   - Best for: [one short phrase about what makes this spot ideal]
   - Why: [2-3 sentences about the venue's atmosphere and what makes it special]
   - Price Level: [$ or $$ or $$$, based on local context]

2. **[Venue Name]**
   [continue same format]`;

        const requestObject = {
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: "You are a local expert focused on finding venues that create fair, balanced meeting points. Your top priority is suggesting venues very close to the exact midpoint coordinates to ensure similar travel times for all parties. Never suggest venues that would create unbalanced travel times."
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