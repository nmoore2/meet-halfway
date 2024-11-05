import { NextResponse } from 'next/server';
import { calculateDrivingMidpoint } from '../../../lib/midpoint';

export async function POST(request: Request) {
    try {
        const data = await request.json();

        // Validate required fields
        if (!data.location1 || !data.location2) {
            return NextResponse.json({
                error: 'Please enter both locations.',
                suggestions: []
            }, { status: 400 });
        }

        console.log('\n🔍 Testing midpoint calculation...');
        console.log('Location 1:', data.location1);
        console.log('Location 2:', data.location2);

        // Calculate midpoint
        const midpoint = await calculateDrivingMidpoint(data.location1, data.location2);

        console.log('\n📍 Driving Midpoint Results:');
        console.log('Latitude:', midpoint.lat);
        console.log('Longitude:', midpoint.lng);
        console.log('Search Radius:', midpoint.searchRadius, 'miles');
        console.log('Total Distance:', midpoint.totalDistance, 'miles');
        console.log('===========================================\n');

        // Return just the midpoint for testing
        return NextResponse.json({ midpoint });

    } catch (error) {
        console.error('Search error:', error);
        return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }
}