import { NextResponse } from 'next/server';
import { getRecommendedVenues } from '../../../lib/openai';
import { getPlaceDetails } from '../../../lib/google-places';
import { getDriveTimes } from '../../../lib/maps';
import { parseVenues } from '../../../lib/parser';

export async function POST(request: Request) {
    const startTime = performance.now();

    try {
        const data = await request.json();

        // Validate required fields
        if (!data.location1 || !data.location2) {
            return NextResponse.json({
                error: 'Please enter both locations to find meeting spots.',
                suggestions: []
            }, { status: 400 });
        }

        console.log('Starting venue recommendations...');
        const openAIResponse = await getRecommendedVenues(
            data.activityType,
            data.meetupType,
            data.priceRange,
            data.location1,
            data.location2
        );

        // Add logging to debug the response
        console.log('OpenAI Response:', openAIResponse);

        // Parse the OpenAI response
        const venues = parseVenues(openAIResponse);

        // Add logging to debug the parsed venues
        console.log('Parsed Venues:', venues);

        if (!venues || venues.length === 0) {
            console.log('No venues found after parsing');
            return NextResponse.json({
                error: "We couldn't find any spots matching your search. Please try again.",
                suggestions: []
            }, { status: 400 });
        }

        // Process all venues in parallel
        console.log('Starting place details and drive times fetch...');
        const placesStartTime = performance.now();

        // Get place details and drive times in parallel
        const [enrichedVenues, drivesFromA, drivesFromB] = await Promise.all([
            Promise.all(
                venues.map(async (venue) => {
                    try {
                        const placeDetails = await getPlaceDetails(venue.name, venue.address);
                        return {
                            ...venue,
                            photos: placeDetails.photos || [],
                            location: placeDetails.geometry?.location || null,
                            price_level: placeDetails.price_level
                        };
                    } catch (error) {
                        console.error(`Error enriching venue ${venue.name}:`, error);
                        return venue;
                    }
                })
            ),
            getDriveTimes(data.location1, venues.map(v => v.address)),
            getDriveTimes(data.location2, venues.map(v => v.address))
        ]);

        // Combine all the data
        const finalVenues = enrichedVenues.map((venue, index) => ({
            ...venue,
            driveTimes: {
                fromA: drivesFromA[index],
                fromB: drivesFromB[index]
            }
        }));

        console.log(`Place details and drive times fetch time: ${performance.now() - placesStartTime}ms`);
        console.log(`Total request time: ${performance.now() - startTime}ms`);

        return NextResponse.json({
            success: true,
            suggestions: finalVenues
        });

    } catch (error) {
        console.error('Search API error:', error);
        return NextResponse.json({
            error: "Something went wrong while finding meeting spots. Please try again.",
            suggestions: []
        }, { status: 500 });
    }
}