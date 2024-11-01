import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Add request caching
const responseCache = new Map<string, { timestamp: number; data: string }>();
const CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 hour

export async function getRecommendedVenues(activityType: string, meetupType: string, priceRange: string) {
    try {
        // More specific price guidance with strict ranges
        let priceGuidance = '';
        switch (priceRange) {
            case '$':
                priceGuidance = `STRICT REQUIREMENT: Only recommend budget-friendly venues where cocktails cost $8-12.
                - Must have happy hour deals or regular prices in this range
                - Exclude any upscale or premium venues
                - Focus on casual neighborhood bars and affordable spots
                Example venues: dive bars, casual pubs, neighborhood taverns`;
                break;
            case '$$':
                priceGuidance = `STRICT REQUIREMENT: Only recommend mid-range venues where cocktails cost $12-15.
                - Standard craft cocktail bars
                - Regular menu prices should be in this range
                - No premium or luxury venues`;
                break;
            case '$$$':
                priceGuidance = `STRICT REQUIREMENT: Only recommend upscale venues where cocktails cost $15-20.
                - Higher-end cocktail lounges
                - Upscale bars and restaurants
                - Premium ingredients and presentation`;
                break;
            case '$$$$':
                priceGuidance = `STRICT REQUIREMENT: Only recommend luxury venues where cocktails cost $20+.
                - Exclusive cocktail bars (like Lady Jane)
                - High-end speakeasies
                - Premium spirits and elaborate presentations
                - Fine dining restaurant bars`;
                break;
            default:
                priceGuidance = 'Include a mix of price points';
        }

        const prompt = `As a Denver cocktail expert, recommend EXACTLY 3 venues between Cherry Creek and Sloan's Lake for a ${meetupType}.

${priceGuidance}

CRITICAL: Price range is the TOP priority. Do NOT recommend venues outside the specified price range, even if they're great for other reasons.

Return recommendations in this format:
1.
• Name: [Venue Name]
• Address: [Exact Denver Address]
• Best for: [One line description]
• Why: [2 sentences about atmosphere and experience, mentioning price point]`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4-turbo-preview",
            messages: [
                {
                    role: "system",
                    content: "You are a Denver expert specializing in recommending venues that STRICTLY match the specified price range. Never suggest venues outside the requested price bracket."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.5, // Lower temperature for more consistent price adherence
            max_tokens: 1000
        });

        return completion.choices[0].message.content || '';
    } catch (error) {
        console.error('ChatGPT API error:', error);
        throw error;
    }
}


function getPriceGuidance(priceRange: string): string {
    const priceGuides = {
        '$': 'ONLY suggest places with cocktails $8-12.',
        '$$': 'ONLY suggest places with cocktails $12-15.',
        '$$$': 'ONLY suggest places with cocktails $15-20.',
        '$$$$': 'ONLY suggest places with cocktails $20+.',
        'any': 'Include various price points.'
    };

    return priceGuides[priceRange as keyof typeof priceGuides] || priceGuides.any;
}