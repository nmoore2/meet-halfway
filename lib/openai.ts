import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Add request caching
const responseCache = new Map<string, { timestamp: number; data: string }>();
const CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 hour

export async function getRecommendedVenues(
    activityType: string,
    meetupType: string,
    priceRange: string,
    location1: string,
    location2: string
) {
    try {
        // Add debug logging
        console.log('Received locations:', { location1, location2, activityType, meetupType, priceRange });

        if (!location1 || !location2) {
            throw new Error('Both locations are required');
        }

        const prompt = `Find real venues that are roughly halfway between ${location1} and ${location2} for a ${meetupType.toLowerCase()}. 
        Focus on ${activityType.toLowerCase()} venues that are actually located between these two points.

        Consider these factors:
        - Travel time should be similar from both starting locations (within 5-10 minutes difference)
        - Venue should match the ${activityType.toLowerCase()} category
        - Atmosphere should be suitable for a ${meetupType.toLowerCase()}
        ${priceRange !== 'any' ? `- Price range should be ${priceRange}` : ''}
        
        Format each suggestion EXACTLY as follows (do not use asterisks or other special characters):
        Name: [venue name]
        Address: [full address]
        Best For: [short description of ideal use case]
        Why: [2-3 sentences explaining why this spot is good for meeting halfway]

        Please provide 3-5 real, currently operating venues that best match these criteria.`;

        console.log('Sending prompt to OpenAI:', prompt);  // Debug log

        const completion = await openai.chat.completions.create({
            model: "gpt-4-turbo-preview",
            messages: [
                {
                    role: "system",
                    content: "You are an expert at recommending venues that are genuinely halfway between two locations. Focus on finding truly equidistant spots that make the journey fair for both parties. Use your geographical knowledge to suggest real venues that actually exist between the given locations."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.2,
            max_tokens: 1000
        });

        return completion.choices[0].message.content || '';
    } catch (error) {
        console.error('OpenAI API error:', error);
        throw error;
    }
}


function getPriceGuidance(priceRange: string): string {
    const priceGuides = {
        '$': 'ONLY suggest places with cocktails $8-12.',
        '$$': 'ONLY suggest places with cocktails $12-15.',
        '$$$': 'ONLY suggest places with cocktails $15-20.',
        'any': 'Include various price points.'
    };

    return priceGuides[priceRange as keyof typeof priceGuides] || priceGuides.any;
}