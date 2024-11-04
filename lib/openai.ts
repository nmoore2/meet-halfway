import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

async function calculateMidpointAndRadius(location1: string, location2: string) {
    try {
        const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        const GOOGLE_MAPS_KEY = process.env.GOOGLE_MAPS_API_KEY;

        if (!MAPBOX_TOKEN || !GOOGLE_MAPS_KEY) {
            throw new Error('API tokens not found');
        }

        // First get rough midpoint to use as starting point
        const [loc1Res, loc2Res] = await Promise.all([
            fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(location1)}.json?limit=1&access_token=${MAPBOX_TOKEN}`)
                .then(res => res.json()),
            fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(location2)}.json?limit=1&access_token=${MAPBOX_TOKEN}`)
                .then(res => res.json())
        ]);

        const loc1Coords = loc1Res.features[0].center;
        const loc2Coords = loc2Res.features[0].center;

        // Initial geometric midpoint
        const initialMidpoint = {
            lng: (loc1Coords[0] + loc2Coords[0]) / 2,
            lat: (loc1Coords[1] + loc2Coords[1]) / 2
        };

        // Use Google Distance Matrix API to get drive times
        const distanceMatrixUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${location1}&destinations=${location2}&mode=driving&key=${GOOGLE_MAPS_KEY}`;

        const response = await fetch(distanceMatrixUrl);
        const data = await response.json();

        // Get the total drive time in seconds
        const totalDriveTime = data.rows[0].elements[0].duration.value;

        // Calculate time-based midpoint by adjusting geometric midpoint
        // We'll use a binary search approach to find a point with equal drive times
        let adjustedMidpoint = initialMidpoint;
        let iterations = 0;
        const MAX_ITERATIONS = 5;  // Limit iterations for performance

        while (iterations < MAX_ITERATIONS) {
            // Get drive times to current midpoint
            const midpointMatrix = await fetch(
                `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${location1}|${location2}&destinations=${adjustedMidpoint.lat},${adjustedMidpoint.lng}&mode=driving&key=${GOOGLE_MAPS_KEY}`
            ).then(res => res.json());

            const time1 = midpointMatrix.rows[0].elements[0].duration.value;
            const time2 = midpointMatrix.rows[1].elements[0].duration.value;

            // If times are within 2 minutes of each other, we're done
            if (Math.abs(time1 - time2) < 120) {
                break;
            }

            // Adjust midpoint based on time difference
            const timeDiff = time1 - time2;
            const adjustment = 0.0001 * Math.sign(timeDiff);  // Small adjustment factor

            adjustedMidpoint = {
                lat: adjustedMidpoint.lat + adjustment,
                lng: adjustedMidpoint.lng + adjustment * Math.cos(adjustedMidpoint.lat * Math.PI / 180)
            };

            iterations++;
        }

        // Calculate search radius based on drive time
        const searchRadius = Number((totalDriveTime / 60 / 16).toFixed(2));  // Convert seconds to minutes and divide by 16

        console.log('\n===========================================');
        console.log('🚗 TIME-BASED CALCULATIONS');
        console.log('===========================================');
        console.log('Total Drive Time:', Math.round(totalDriveTime / 60), 'minutes');
        console.log('Time-Based Midpoint:', adjustedMidpoint);
        console.log('Search Radius:', searchRadius, 'miles');
        console.log('===========================================\n');

        return { midpoint: adjustedMidpoint, searchRadius };
    } catch (error) {
        console.error('Error in calculateMidpointAndRadius:', error);
        throw error;
    }
}

export async function getRecommendedVenues(
    activityType: string,
    meetupType: string,
    priceRange: string,
    location1: string,
    location2: string
) {
    try {
        if (!location1 || !location2) {
            throw new Error('Both locations are required');
        }

        const { midpoint, searchRadius } = await calculateMidpointAndRadius(location1, location2);

        // Log the calculated coordinates and radius
        console.log('----------------------------------------');
        console.log('📍 Midpoint:', midpoint);
        console.log('🎯 Search Radius:', searchRadius, 'miles');
        console.log('----------------------------------------');

        const prompt = `Find 3 real venues that are near the calculated midpoint coordinates (${midpoint.lat}, ${midpoint.lng}) for a ${meetupType.toLowerCase()}. 

        SEARCH PARAMETERS:
        - Midpoint: ${midpoint.lat}, ${midpoint.lng}
        - Search Radius: ${searchRadius} miles from midpoint
        
        CRITICAL REQUIREMENTS (in order of importance):
        1. Geographic Location: Venue MUST be within ${searchRadius} miles of the midpoint coordinates (${midpoint.lat}, ${midpoint.lng})
        2. Travel Time Balance: Drive times from both locations MUST be within 5 minutes of each other
        3. Venue Type: Must be a ${activityType.toLowerCase()} establishment
        4. Currently Operating: Must be a real, currently operating business
        ${priceRange !== 'any' ? `5. Price Range: Must be ${priceRange}` : ''}

        For each venue suggestion:
        1. First verify the venue is within the ${searchRadius}-mile radius of (${midpoint.lat}, ${midpoint.lng})
        2. Then verify the drive times are balanced using Google Maps
        3. Only if both criteria are met, include the venue in this format:

        Name: [venue name]
        Address: [full address]
        Best For: [one specific use case that matches ${meetupType}]
        Why: [Describe the venue's atmosphere and why it works for ${meetupType} in 2-3 sentences]
        `;

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