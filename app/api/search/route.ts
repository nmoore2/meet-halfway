import { NextResponse } from 'next/server';

// Helper function to get coordinates from an address
async function getCoordinates(address: string) {
    const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.GOOGLE_MAPS_API_KEY}`
    );
    const data = await response.json();

    if (!data.results?.[0]?.geometry?.location) {
        throw new Error(`Could not find coordinates for address: ${address}`);
    }

    return data.results[0].geometry.location;
}

async function findPlacesWithGoogle(searchData: any) {
    const { locationA, locationB, activityType, priceRange } = searchData;
    const priceLevel = priceRange.length; // Convert $ to 1, $$ to 2, etc.

    try {
        // Get coordinates for both locations
        const [locA, locB] = await Promise.all([
            getCoordinates(locationA),
            getCoordinates(locationB)
        ]);

        // Calculate midpoint
        const midpoint = {
            lat: (locA.lat + locB.lat) / 2,
            lng: (locA.lng + locB.lng) / 2
        };

        // Search for places near midpoint
        const placesResponse = await fetch(
            `https://maps.googleapis.com/maps/api/place/nearbysearch/json?` +
            `location=${midpoint.lat},${midpoint.lng}&` +
            `radius=5000&` +
            `type=${activityType.toLowerCase().replace(' ', '_')}&` +
            `minprice=${priceLevel}&` +
            `maxprice=${priceLevel}&` +
            `key=${process.env.GOOGLE_MAPS_API_KEY}`
        );

        const places = await placesResponse.json();

        if (!places.results) {
            throw new Error('No places found');
        }

        // Return top 3 results
        return places.results.slice(0, 3).map(place => ({
            name: place.name,
            address: place.vicinity,
            price: ''.padStart(place.price_level || 1, '$'),
            placeId: place.place_id
        }));
    } catch (error) {
        console.error('Google Places API error:', error);
        throw error;
    }
}

// Original prompt function stays the same
const getPromptForActivityType = (activityType: string, locationA: string, locationB: string) => {
    const prompts = {
        'Coffee Shop': `You are a local Denver coffee expert. I need recommendations for coffee shops between ${locationA} and ${locationB}.
      Please suggest 3 specific coffee shops that are great for meetings. For each suggestion, format it like this:

      [Number]. [Name]
      • Why: Brief explanation of the atmosphere and what makes it special
      • Best for: Short description of ideal use case (e.g., casual meetings, work sessions)
      • Price: Include price level ($ to $$$$)
      • Address: Full address`,
        // ... other activity types ...
    };

    return `${prompts[activityType] || prompts['Park']}
    Format your response as JSON like this:
    {
      "suggestions": [
        {
          "name": "Place Name",
          "why": "Brief explanation",
          "bestFor": "Ideal use case",
          "price": "$ to $$$$",
          "address": "Full Address"
        }
      ]
    }`;
};

export async function POST(req: Request) {
    try {
        const searchData = await req.json();
        console.log('API Route - Search data received:', searchData);

        let suggestions;
        let prompt;

        // Only use Google Places API if a specific price range is selected
        if (searchData.priceRange !== 'any' && searchData.activityType !== 'Park') {
            try {
                console.log('Using Google Places API path');
                const places = await findPlacesWithGoogle(searchData);
                console.log('Places found:', places);

                if (!places || places.length === 0) {
                    throw new Error('No places found in the selected area');
                }

                // Create a more dynamic prompt without hardcoding array indices
                prompt = `Create a JSON response describing these places between ${searchData.locationA} and ${searchData.locationB}.
                    Use only these exact places:
                    ${places.map(p => `${p.name}: ${p.address} (${p.price})`).join('\n')}

                    The response must be valid JSON in this format:
                    {
                      "suggestions": [
                        {
                          "name": "(use exact name from list)",
                          "why": "Brief explanation of what makes it special",
                          "bestFor": "Short description of ideal use case",
                          "price": "(use exact price from list)",
                          "address": "(use exact address from list)"
                        }
                      ]
                    }

                    Include all places in the suggestions array. Do not add any places not listed above.
                    Do not include any text outside the JSON structure.`;

            } catch (error: any) {
                console.error('Google Places API error:', error);
                return NextResponse.json({
                    success: false,
                    error: 'Failed to find places in the selected area'
                }, { status: 500 });
            }
        } else {
            console.log('Using ChatGPT-only path');
            prompt = getPromptForActivityType(
                searchData.activityType,
                searchData.locationA,
                searchData.locationB
            );
        }

        console.log('Sending prompt to OpenAI:', prompt);

        try {
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
                        content: prompt
                    }],
                    temperature: 0.7
                })
            });

            if (!openaiResponse.ok) {
                const errorData = await openaiResponse.json();
                console.error('OpenAI API error:', errorData);
                throw new Error('OpenAI API request failed');
            }

            const completion = await openaiResponse.json();
            console.log('OpenAI response received:', completion);

            const content = completion.choices[0].message.content;
            suggestions = JSON.parse(content);

            return NextResponse.json({
                success: true,
                suggestions: suggestions.suggestions,
                message: 'Recommendations found'
            });

        } catch (error: any) {
            console.error('OpenAI or parsing error:', error);
            return NextResponse.json({
                success: false,
                error: 'Failed to generate recommendations'
            }, { status: 500 });
        }

    } catch (error: any) {
        console.error('API route error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Failed to process search'
        }, { status: 500 });
    }
}