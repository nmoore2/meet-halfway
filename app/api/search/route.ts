import { NextResponse } from 'next/server';
import { getRecommendedVenues } from '../../../lib/openai';
import { getPlaceDetails } from '../../../lib/google-places';
import { getDriveTimes } from '../../../lib/maps';

export async function POST(request: Request) {
    const startTime = performance.now();

    try {
        const searchData = await request.json();
        const { activityType, meetupType, priceRange, locationA, locationB } = searchData;

        console.log('Starting venue recommendations...');
        const chatResponse = await getRecommendedVenues(activityType, meetupType, priceRange);
        console.log(`OpenAI response time: ${performance.now() - startTime}ms`);

        const venues = Array.isArray(chatResponse) ? chatResponse : parseVenueRecommendations(chatResponse);

        if (!venues || venues.length === 0) {
            throw new Error('No valid venues found');
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
            getDriveTimes(locationA, venues.map(v => v.address)),
            getDriveTimes(locationB, venues.map(v => v.address))
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

    } catch (error: any) {
        console.error('Search API error:', error);
        return NextResponse.json({
            success: false,
            message: error.message || 'Failed to find meeting spots'
        }, { status: 500 });
    }
}

function parseVenueRecommendations(text: string) {
    try {
        const venues = [];
        const venueRegex = /(\d+)\.\s*•\s*Name:\s*([^•]+)•\s*Address:\s*([^•]+)•\s*Best for:\s*([^•]+)•\s*Why:\s*([^•\n]+)/g;

        let match;
        while ((match = venueRegex.exec(text)) !== null) {
            venues.push({
                name: match[2].trim(),
                address: match[3].trim(),
                bestFor: match[4].trim(),
                why: match[5].trim()
            });
        }

        return venues;
    } catch (error) {
        console.error('Error parsing venue recommendations:', error);
        return [];
    }
}