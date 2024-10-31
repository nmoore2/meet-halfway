import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export async function getChatGPTResponse(prompt: string) {
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{
                role: "user",
                content: prompt
            }],
            temperature: 0.7,
            max_tokens: 1000
        });

        return completion.choices[0].message.content;
    } catch (error) {
        console.error('ChatGPT API error:', error);
        throw error;
    }
}

export async function getRecommendedVenues(activityType: string, meetupType: string, priceRange: string) {
    try {
        const prompt = `As a Denver expert, recommend and RANK the top 3 ${activityType.toLowerCase()} venues between Cherry Creek and Sloan's Lake that would be best for a ${meetupType.toLowerCase()}.

        Return EXACTLY 3 venues in this EXACT format (including the numbers and bullet points):

        1.
        • Name: [Venue Name]
        • Address: [Exact Denver Address]
        • Best for: [One line description]
        • Why: [2-3 sentences about atmosphere and suitability]

        2.
        • Name: [Venue Name]
        • Address: [Exact Denver Address]
        • Best for: [One line description]
        • Why: [2-3 sentences about atmosphere and suitability]

        3.
        • Name: [Venue Name]
        • Address: [Exact Denver Address]
        • Best for: [One line description]
        • Why: [2-3 sentences about atmosphere and suitability]`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4-turbo-preview",
            messages: [{
                role: "user",
                content: prompt
            }],
            temperature: 0.7,
            max_tokens: 1000
        });

        console.log('ChatGPT Response:', completion.choices[0].message.content);
        return completion.choices[0].message.content || '';
    } catch (error) {
        console.error('ChatGPT API error:', error);
        throw error;
    }
} 