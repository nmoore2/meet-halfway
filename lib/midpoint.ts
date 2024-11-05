interface Midpoint {
    lat: number;
    lng: number;
    searchRadius: number;
    totalDistance: number;
    googleMapsUrl: string;
    mapboxUrl: string;
}

export async function calculateDrivingMidpoint(location1: string, location2: string): Promise<Midpoint> {
    const GOOGLE_MAPS_KEY = process.env.GOOGLE_MAPS_API_KEY;
    if (!GOOGLE_MAPS_KEY) throw new Error('Google Maps API key not found');

    // Get the route between the two locations
    const directionsResponse = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(location1)}&destination=${encodeURIComponent(location2)}&key=${GOOGLE_MAPS_KEY}`
    ).then(res => res.json());

    if (!directionsResponse.routes?.[0]?.legs?.[0]) {
        throw new Error('Could not find route between locations');
    }

    const route = directionsResponse.routes[0].legs[0];
    const totalDistance = route.distance.value; // in meters
    const steps = route.steps;

    // Find the step that contains the midpoint
    let distanceSoFar = 0;
    const halfDistance = totalDistance / 2;

    for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const stepDistance = step.distance.value;

        if (distanceSoFar + stepDistance >= halfDistance) {
            // Calculate how far into this step the midpoint should be
            const remainingDistance = halfDistance - distanceSoFar;
            const fraction = remainingDistance / stepDistance;

            // Calculate coordinates first
            const lat = step.start_location.lat + (step.end_location.lat - step.start_location.lat) * fraction;
            const lng = step.start_location.lng + (step.end_location.lng - step.start_location.lng) * fraction;
            const searchRadius = (totalDistance / 1609.34) * 0.15;
            const totalDistanceMiles = totalDistance / 1609.34;

            const radiusMeters = searchRadius * 1609.34;
            const mapboxUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/` +
                `overlay=circle:${lng},${lat},${radiusMeters}:stroke-color+FF0000,stroke-width+2,stroke-opacity+0.5/` +
                `pin-s-m+FF0000(${lng},${lat})/` +
                `${lng},${lat},13/500x300` +
                `?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`;

            const midpoint = {
                lat,
                lng,
                searchRadius,
                totalDistance: totalDistanceMiles,
                googleMapsUrl: `https://www.google.com/maps/dir/${encodeURIComponent(location1)}/${lat},${lng}/${encodeURIComponent(location2)}`,
                mapboxUrl: mapboxUrl
            };

            console.log('\n===========================================');
            console.log('🚗 ROUTE-BASED CALCULATIONS');
            console.log('===========================================');
            console.log('Total Distance:', midpoint.totalDistance.toFixed(2), 'miles');
            console.log('Time-Based Midpoint:', midpoint);
            console.log('Search Radius:', midpoint.searchRadius.toFixed(2), 'miles');
            console.log('Google Maps URL:', midpoint.googleMapsUrl);
            console.log('Mapbox URL:', midpoint.mapboxUrl);
            console.log('===========================================\n');

            return midpoint;
        }
        distanceSoFar += stepDistance;
    }

    throw new Error('Could not calculate midpoint');
} 