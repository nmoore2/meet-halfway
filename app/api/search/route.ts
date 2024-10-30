import { NextResponse } from 'next/server';

const getPromptForActivityType = (activityType: string, locationA: string, locationB: string) => {
    const prompts = {
        'Coffee Shop': `You are a local Denver coffee expert. I need recommendations for coffee shops between ${locationA} and ${locationB}.
      Please suggest 3 specific coffee shops that are great for meetings. Focus only on coffee shops, not bars or restaurants.
      For each suggestion, include details about their coffee quality, atmosphere, and why it's good for meetings.`,

        'Restaurant': `You are a local Denver food expert. I need recommendations for restaurants between ${locationA} and ${locationB}.
      Please suggest 3 specific restaurants that are great for meetings. Include a mix of cuisines and price points.
      For each suggestion, include details about their food quality, atmosphere, and why it's good for meetings.`,

        'Cocktail Bar': `You are a local Denver cocktail expert. I need recommendations for cocktail bars between ${locationA} and ${locationB}.
      Please suggest 3 specific cocktail bars that are great for meetings. Focus on places known for their craft cocktails and atmosphere.
      For each suggestion, include details about their drinks, ambiance, and why it's good for meetings.`,
    };

    return `${prompts[activityType] || prompts['Restaurant']}
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

        const prompt = getPromptForActivityType(
            searchData.activityType,
            searchData.locationA,
            searchData.locationB
        );

        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [{ role: "user", content: prompt }],
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
            message: `${searchData.activityType} recommendations found`
        });

    } catch (error: any) {
        console.error('API route error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Failed to process search'
        }, { status: 500 });
    }
}