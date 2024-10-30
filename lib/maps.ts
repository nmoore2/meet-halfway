interface Location {
    lat: number;
    lng: number;
}

// Load Google Maps script
export function loadGoogleMaps(): Promise<void> {
    if (typeof window === 'undefined') return Promise.resolve();

    if (window.google) {
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Google Maps'));
        document.head.appendChild(script);
    });
}

export async function geocodeAddress(address: string): Promise<Location> {
    if (!address || address.trim() === '') {
        throw new Error('Please enter a valid address');
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
        throw new Error(`Geocoding failed for address: ${address}`);
    }

    const location = data.results[0].geometry.location;
    return {
        lat: location.lat,
        lng: location.lng
    };
}

export function calculateMidpoint(pointA: Location, pointB: Location): Location {
    return {
        lat: (pointA.lat + pointB.lat) / 2,
        lng: (pointA.lng + pointB.lng) / 2
    };
}

export async function getPlacesNearby(
    location: Location,
    type: string,
    radius: number = 1000
): Promise<any[]> {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.lat},${location.lng}&radius=${radius}&type=${type === 'any' ? '' : type}&key=${process.env.GOOGLE_MAPS_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        throw new Error('Places search failed');
    }

    return data.results || [];
}

// Export types for use in other files
export type { Location };