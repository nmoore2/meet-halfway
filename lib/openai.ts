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
        console.log('Received locations:', { location1, location2, activityType, meetupType, priceRange });

        if (!location1 || !location2) {
            throw new Error('Both locations are required');
        }

        const prompt = `Find 3 real venues that are genuinely halfway between ${location1} and ${location2} for a ${meetupType.toLowerCase()}. 

        CRITICAL REQUIREMENTS:
        1. Travel times MUST be balanced (within 5-10 minutes difference maximum)
        2. Venue MUST be a ${activityType.toLowerCase()} establishment
        3. Location MUST be physically situated between the two points
        4. Venue MUST be currently operating and real
        ${priceRange !== 'any' ? `5. Price range MUST be ${priceRange}` : ''}

        For each venue, provide EXACTLY this format:
        Name: [venue name]
        Address: [full address]
        Best For: [one specific use case that matches ${meetupType}]
        Why: [Explain why this is a fair meeting point, mentioning the balanced travel times first, then describe the venue's atmosphere and why it works for ${meetupType}]
        
        Focus on venues where neither party has to travel significantly longer than the other. The goal is to make the meeting as equitable as possible for both parties.`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4-turbo-preview",
            messages: [
                {
                    role: "system",
                    content: "You are a local expert focused on finding truly equidistant meeting spots. Your primary goal is to ensure fair travel times for both parties. You have extensive knowledge of local venues and their exact locations. You NEVER suggest venues that would require one party to travel significantly longer than the other."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.1, // Reduced for more consistent results
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