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
${priceRange !== 'any' ? `5. Price Range: ${priceRange}` : ''}

Return EXACTLY 5 venues in this EXACT format:

1. **[Venue Name]**
   - Address: [full street address, city, state, zip]
   - Description: [2-3 sentence description]

2. **[Venue Name]**
   - Address: [full street address, city, state, zip]
   - Description: [2-3 sentence description]

[continue exact format for remaining venues]`;

        const requestObject = {
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: "You are a local expert focused on finding truly equidistant meeting spots. Your primary goal is to ensure perfectly balanced travel times for both parties. You have extensive knowledge of local geography and always verify locations using maps before suggesting them."
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