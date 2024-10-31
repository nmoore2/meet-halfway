import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
        return new NextResponse('Photo URL required', { status: 400 });
    }

    try {
        const response = await fetch(url);

        if (!response.ok) {
            console.error('Photo fetch failed:', response.status);
            throw new Error(`Failed to fetch photo: ${response.status}`);
        }

        const imageBuffer = await response.arrayBuffer();

        return new NextResponse(imageBuffer, {
            headers: {
                'Content-Type': 'image/jpeg',
                'Cache-Control': 'public, max-age=3600'
            }
        });
    } catch (error) {
        console.error('Error fetching photo:', error);
        return new NextResponse('Error fetching photo', { status: 500 });
    }
} 