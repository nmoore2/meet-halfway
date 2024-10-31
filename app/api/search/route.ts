import { NextResponse } from 'next/server';

const getPromptForActivityType = (activityType: string, locationA: string, locationB: string) => {
    const prompts = {
        'Park': `You are a local Denver parks expert. I need recommendations for parks between ${locationA} and ${locationB}.
      Please suggest 3 specific parks that are great for meeting up. For each suggestion, explain why it's a good meeting spot,
      including details about accessibility, amenities, and unique features.`,

        'Coffee Shop': `You are a local Denver coffee expert. I need recommendations for coffee shops between ${locationA} and ${locationB}.
      Please suggest 3 specific coffee shops that are great for meetings. For each suggestion, include details about their coffee quality,
      atmosphere, and why it's good for meetings.`,

        'Restaurant': `You are a local Denver food expert. I need recommendations for restaurants between ${locationA} and ${locationB}.
      Please suggest 3 specific restaurants that are great for meetings. For each suggestion, include details about their cuisine,
      atmosphere, and why it's good for meetings.`
    };

    return `${prompts[activityType] || prompts['Park']}
    Format your response as JSON like this:
    {
      "suggestions": [
        {
          "name": "Place Name",
          "address": "Full Address",
          "reasoning": "Why this place is good for meetings"
        }
      ]
    }`;
};

export async function POST(req: Request) {
    try {
        const searchData = await req.json();
        console.log('Search data received:', searchData);

        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OpenAI API key is not configured');
        }

        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [{
                    role: "user",
                    content: getPromptForActivityType(searchData.activityType, searchData.locationA, searchData.locationB)
                }],
                temperature: 0.7
            })
        });

        if (!openaiResponse.ok) {
            const error = await openaiResponse.json();
            console.error('OpenAI API error:', error);
            throw new Error('Failed to get recommendations');
        }

        const completion = await openaiResponse.json();
        const suggestions = JSON.parse(completion.choices[0].message.content);

        return NextResponse.json({
            success: true,
            ...suggestions,
            message: 'Recommendations found'
        });

    } catch (error: any) {
        console.error('API route error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Failed to process search'
        }, { status: 500 });
    }
}