'use client';

import { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps } from '../lib/maps';

interface Location {
    lat: number;
    lng: number;
}

interface Place {
    geometry: {
        location: {
            lat: number;
            lng: number;
        };
    };
    name: string;
    vicinity: string;
}

interface MapProps {
    locationA: Location;
    locationB: Location;
    midpoint: Location;
    places: Place[];
}

export default function Map({ locationA, locationB, midpoint, places }: MapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const [isReady, setIsReady] = useState(false);

    // Validate coordinates
    const isValidCoords = (loc: Location) => {
        return loc && typeof loc.lat === 'number' && typeof loc.lng === 'number';
    };

    if (!isValidCoords(locationA) || !isValidCoords(locationB) || !isValidCoords(midpoint)) {
        console.error('Invalid coordinates:', { locationA, locationB, midpoint });
        return <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
            Loading map...
        </div>;
    }

    useEffect(() => {
        loadGoogleMaps()
            .then(() => setIsReady(true))
            .catch(error => console.error('Failed to load Google Maps:', error));
    }, []);

    useEffect(() => {
        if (!isReady || !mapRef.current) return;

        const map = new google.maps.Map(mapRef.current, {
            zoom: 12,
            center: midpoint,
        });

        // Add markers
        new google.maps.Marker({
            position: locationA,
            map,
            label: 'A'
        });

        new google.maps.Marker({
            position: locationB,
            map,
            label: 'B'
        });

        new google.maps.Marker({
            position: midpoint,
            map,
            icon: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
        });

        // Add place markers
        places.forEach(place => {
            new google.maps.Marker({
                position: place.geometry.location,
                map,
                title: place.name,
                icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
            });
        });

        // Fit bounds
        const bounds = new google.maps.LatLngBounds();
        bounds.extend(locationA);
        bounds.extend(locationB);
        bounds.extend(midpoint);
        map.fitBounds(bounds);
    }, [locationA, locationB, midpoint, places, isReady]);

    return (
        <div
            ref={mapRef}
            style={{ width: '100%', height: '400px' }}
            className="rounded-lg shadow-lg"
        />
    );
} 