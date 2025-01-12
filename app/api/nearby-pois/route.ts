import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const radius = searchParams.get('radius');
    const types = searchParams.get('types');

    if (!lat || !lng || !radius) {
        return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json');
    url.searchParams.append('location', `${lat},${lng}`);
    url.searchParams.append('radius', radius);
    if (types) url.searchParams.append('type', types);
    url.searchParams.append('key', process.env.GOOGLE_MAPS_API_KEY!);

    try {
        const response = await fetch(url.toString());
        const data = await response.json();

        if (data.status !== 'OK') {
            console.error('Places API error:', data.status);
            return NextResponse.json({ error: data.status }, { status: 500 });
        }

        return NextResponse.json(data.results);
    } catch (error) {
        console.error('Error fetching nearby POIs:', error);
        return NextResponse.json({ error: 'Failed to fetch POIs' }, { status: 500 });
    }
} 