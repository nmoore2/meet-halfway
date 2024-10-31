import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

interface ChatResponse {
    bullets: string[];
}

export async function getChatGPTResponse(prompt: string): Promise<ChatResponse> {
    try {
        console.log('\n🤖 ChatGPT Request:', {
            prompt,
            timestamp: new Date().toISOString()
        });

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are a helpful local expert providing structured recommendations for meeting spots. Always respond with a rating and 3 categorized bullet points."
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

        console.log('\n✨ ChatGPT Response:', {
            content,
            timestamp: new Date().toISOString(),
            tokens: response.usage
        });

        // Split into lines and filter empty lines
        const lines = content.split('\n').filter(line => line.trim());

        // Process the bullets to extract categories and descriptions
        const bullets = lines.map(line => {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('•')) {
                const [category, description] = trimmedLine.substring(1).split(':').map(s => s.trim());
                return `• ${category}: ${description}`;
            }
            return trimmedLine;
        });

        return {
            bullets: bullets.length ? bullets : ['No specific recommendations available']
        };
    } catch (error) {
        console.error('\n❌ ChatGPT Error:', {
            error,
            prompt,
            timestamp: new Date().toISOString()
        });
        return {
            bullets: ['Unable to generate recommendations at this time']
        };
    }
}

function getPromptForActivityType(placeName: string[], activityType: string, meetupType: string) {
    return `As a local Denver expert, rank and evaluate these ${activityType} spots for a ${meetupType}:
    ${placeName.join(', ')}

    Rank them in order of best fit for a ${meetupType}, considering atmosphere, location, and overall experience.
    For each place, provide:
    • Why: Explain what makes it suitable (or not) for this type of meetup
    • Best for: Describe in one line the ideal scenario

    Format your response as a numbered list, like this:
    1. [Place Name]
    • Why: [Detailed explanation about atmosphere, location, and suitability]
    • Best for: [Brief, specific description of ideal use case]

    2. [Next Place]
    ...`;
} 