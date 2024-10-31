interface Coordinates {
    lat: number;
    lng: number;
}

export async function getCoordinates(address: string): Promise<Coordinates> {
    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    url.searchParams.append('address', address);
    url.searchParams.append('key', process.env.GOOGLE_MAPS_API_KEY!);

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.status !== 'OK') {
            throw new Error(`Geocoding failed: ${data.status}`);
        }

        const location = data.results[0].geometry.location;
        return {
            lat: location.lat,
            lng: location.lng
        };
    } catch (error) {
        console.error('Geocoding error:', error);
        throw error;
    }
} 