import { NextResponse } from 'next/server';
import { searchNearbyVenues } from '../../../lib/google-places';
import { calculateDrivingMidpoint } from '../../../lib/midpoint';

export async function POST(request: Request) {
    const startTime = performance.now();

    try {
        const data = await request.json();
        console.log('Search request:', data);

        const midpoint = await calculateDrivingMidpoint(data.location1, data.location2);
        console.log('Calculated midpoint:', midpoint);

        // Get venues from Google Places with drive times
        const venues = await searchNearbyVenues(
            midpoint,
            midpoint.searchRadius,
            data.activityType,
            data.priceRange,
            data.location1,
            data.location2
        );

        console.log(`Found ${venues.length} venues from Google Places`);

        // Log each venue's details for review
        venues.forEach((venue: any, index: number) => {
            console.log(`\nVenue ${index + 1}: ${venue.name}`);
            console.log(`Address: ${venue.vicinity}`);
            console.log(`Rating: ${venue.rating} (${venue.user_ratings_total} reviews)`);
            console.log(`Price Level: ${venue.price_level ? '$'.repeat(venue.price_level) : 'Not specified'}`);
            console.log(`Location: ${venue.geometry.location.lat}, ${venue.geometry.location.lng}`);
            console.log(`Business Status: ${venue.business_status}`);
        });

        return NextResponse.json({
            success: true,
            suggestions: venues.map((venue: any) => ({
                name: venue.name,
                address: venue.vicinity,
                rating: venue.rating,
                user_ratings_total: venue.user_ratings_total,
                price_level: venue.price_level ? '$'.repeat(venue.price_level) : null,
                location: venue.geometry.location,
                business_status: venue.business_status,
                place_id: venue.place_id,
                types: venue.types,
                driveTimes: venue.driveTimes
            })),
            midpoint: midpoint
        });

    } catch (error) {
        console.error('Search API error:', error);
        return NextResponse.json({
            error: "Something went wrong while finding meeting spots. Please try again.",
            suggestions: []
        }, { status: 500 });
    }
}