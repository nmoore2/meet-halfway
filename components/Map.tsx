'use client';

import { useEffect, useRef } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

interface MapProps {
    suggestion: {
        name: string;
        address: string;
        location?: {
            lat: number;
            lng: number;
        };
    };
    locationA: string;
    locationB: string;
    mapId: string;
}

const Map = ({ suggestion, locationA, locationB, mapId }: MapProps) => {
    const mapRef = useRef<google.maps.Map | null>(null);

    useEffect(() => {
        if (!suggestion.location) return;

        const loader = new Loader({
            apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
            version: "weekly",
            libraries: ["places", "geometry"]
        });

        const initMap = async () => {
            try {
                // Wait for the Google Maps API to load
                await loader.load();

                // Get coordinates for locationA and locationB
                const geocoder = new google.maps.Geocoder();

                const [locA, locB] = await Promise.all([
                    new Promise<google.maps.LatLng>((resolve, reject) => {
                        geocoder.geocode({ address: locationA }, (results, status) => {
                            if (status === 'OK' && results?.[0]) {
                                resolve(results[0].geometry.location);
                            } else {
                                reject(new Error(`Failed to geocode location A: ${status}`));
                            }
                        });
                    }),
                    new Promise<google.maps.LatLng>((resolve, reject) => {
                        geocoder.geocode({ address: locationB }, (results, status) => {
                            if (status === 'OK' && results?.[0]) {
                                resolve(results[0].geometry.location);
                            } else {
                                reject(new Error(`Failed to geocode location B: ${status}`));
                            }
                        });
                    })
                ]);

                // Create bounds to fit all markers
                const bounds = new google.maps.LatLngBounds();
                bounds.extend(locA);
                bounds.extend(locB);
                bounds.extend(suggestion.location);

                // Initialize map
                const map = new google.maps.Map(document.getElementById(`map-${mapId}`)!, {
                    mapTypeId: 'roadmap',
                    mapTypeControl: false,
                    streetViewControl: false,
                    fullscreenControl: false,
                });

                // Add markers
                new google.maps.Marker({
                    position: locA,
                    map,
                    label: 'A',
                    title: 'Location A'
                });

                new google.maps.Marker({
                    position: locB,
                    map,
                    label: 'B',
                    title: 'Location B'
                });

                new google.maps.Marker({
                    position: suggestion.location,
                    map,
                    icon: {
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 8,
                        fillColor: '#4CAF50',
                        fillOpacity: 1,
                        strokeWeight: 2,
                        strokeColor: '#FFFFFF',
                    },
                    title: suggestion.name
                });

                // Fit map to show all markers with padding
                map.fitBounds(bounds);

                // Add some padding to the bounds
                const padding = {
                    top: 50,
                    right: 50,
                    bottom: 50,
                    left: 50
                };
                map.fitBounds(bounds, padding);

                mapRef.current = map;
            } catch (error) {
                console.error('Error initializing map:', error);
            }
        };

        initMap();
    }, [suggestion, locationA, locationB, mapId]);

    return (
        <div
            id={`map-${mapId}`}
            className="w-full h-full rounded-lg"
            style={{ minHeight: "200px" }} // Add minimum height
        />
    );
};

export default Map; 