import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

interface ChatResponse {
    bullets: string[];
}

export async function getChatGPTResponse(prompt: string): Promise<ChatResponse> {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are a helpful local expert providing recommendations for meeting spots. Always respond with a rating followed by 3 bullet points."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 200
        });

        const content = response.choices[0]?.message?.content || '';

        // Split into lines and filter empty lines
        const lines = content.split('\n').filter(line => line.trim());

        // First line should be rating, rest are bullets
        const bullets = lines.map(line => line.trim());

        return {
            bullets: bullets.length ? bullets : ['No specific recommendations available']
        };
    } catch (error) {
        console.error('OpenAI API error:', error);
        return {
            bullets: ['Unable to generate recommendations at this time']
        };
    }
} 