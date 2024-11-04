'use client';

import { useEffect, useRef } from 'react';

interface StaticMapProps {
    venue: {
        name: string;
        location?: {
            lat: number;
            lng: number;
        };
    };
    locationA: string;
    locationB: string;
}

const StaticMap = ({ venue, locationA, locationB }: StaticMapProps) => {
    const imgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        const generateMap = async () => {
            if (!venue.location) return;

            const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
            if (!MAPBOX_TOKEN) return;

            try {
                // Geocode both locations
                const [locA, locB] = await Promise.all([
                    fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(locationA)}.json?limit=1&access_token=${MAPBOX_TOKEN}`)
                        .then(res => res.json()),
                    fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(locationB)}.json?limit=1&access_token=${MAPBOX_TOKEN}`)
                        .then(res => res.json())
                ]);

                const locationACoords = locA.features[0].center;
                const locationBCoords = locB.features[0].center;
                const venueCoords = [venue.location.lng, venue.location.lat];

                // Calculate midpoint
                const midpoint = {
                    lng: (locationACoords[0] + locationBCoords[0]) / 2,
                    lat: (locationACoords[1] + locationBCoords[1]) / 2
                };

                // Calculate search radius in kilometers (Mapbox uses km)
                const R = 3959; // Earth's radius in miles
                const lat1 = locationACoords[1] * Math.PI / 180;
                const lat2 = locationBCoords[1] * Math.PI / 180;
                const dLat = (locationBCoords[1] - locationACoords[1]) * Math.PI / 180;
                const dLon = (locationBCoords[0] - locationACoords[0]) * Math.PI / 180;

                const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(lat1) * Math.cos(lat2) *
                    Math.sin(dLon / 2) * Math.sin(dLon / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                const distance = R * c;
                const searchRadius = Math.round(distance / 8);

                // Create circle path for search radius (convert miles to km)
                const radiusKm = searchRadius * 1.60934; // Convert miles to kilometers
                const circlePoints = 64; // Number of points to create circle
                const circlePath = Array.from({ length: circlePoints + 1 }, (_, i) => {
                    const angle = (i / circlePoints) * 2 * Math.PI;
                    const lat = midpoint.lat + (radiusKm / 111.32) * Math.cos(angle);
                    const lng = midpoint.lng + (radiusKm / (111.32 * Math.cos(midpoint.lat * Math.PI / 180))) * Math.sin(angle);
                    return `${lng},${lat}`;
                }).join(',');

                // Create markers
                const markers = [
                    `pin-s-a+E34234(${locationACoords[0]},${locationACoords[1]})`,
                    `pin-s-b+2563EB(${locationBCoords[0]},${locationBCoords[1]})`,
                    `pin-s-star+10B981(${venueCoords[0]},${venueCoords[1]})`,
                    // Add midpoint marker
                    `pin-s-m+FFFF00(${midpoint.lng},${midpoint.lat})`
                ].join(',');

                // Add circle path
                const path = `path-1+4E4EFF-0.3(${circlePath})`;

                // Calculate bounds including the circle
                const coordinates = [
                    locationACoords,
                    locationBCoords,
                    venueCoords,
                    [midpoint.lng, midpoint.lat]
                ];

                // Calculate bounds that fit all points
                const bounds = coordinates.reduce((bounds, coord) => {
                    return [
                        Math.min(bounds[0], coord[0]), // west
                        Math.min(bounds[1], coord[1]), // south
                        Math.max(bounds[2] || bounds[0], coord[0]), // east
                        Math.max(bounds[3] || bounds[1], coord[1])  // north
                    ];
                }, [coordinates[0][0], coordinates[0][1], coordinates[0][0], coordinates[0][1]]);

                // Add padding to bounds (20%)
                const lngDiff = bounds[2] - bounds[0];
                const latDiff = bounds[3] - bounds[1];
                const padding = .2;

                const paddedBounds = [
                    bounds[0] - lngDiff * padding,
                    bounds[1] - latDiff * padding,
                    bounds[2] + lngDiff * padding,
                    bounds[3] + latDiff * padding
                ].join(',');

                // Generate map URL with the calculated bounds
                const mapUrl = `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static`
                    + `/${markers}`
                    + `/[${paddedBounds}]`
                    + `/300x400`
                    + `?padding=0`
                    + `&access_token=${MAPBOX_TOKEN}`;

                // Log the map URL
                console.log('----------------------------------------');
                console.log('🗺️ Map URL:', mapUrl);
                console.log('----------------------------------------');


                if (imgRef.current) {
                    imgRef.current.src = mapUrl;
                }

            } catch (error) {
                console.error('Error generating map:', error);
            }
        };

        generateMap();
    }, [venue, locationA, locationB]);

    return (
        <div className="h-[250px] rounded-lg overflow-hidden bg-gray-800">
            <img
                ref={imgRef}
                alt={`Map showing ${venue.name} location`}
                className="w-full h-full object-cover"
                style={{ objectPosition: 'center' }}
                loading="eager"
                onError={(e) => {
                    console.error('Map image failed to load');
                    if (e.currentTarget.parentElement) {
                        e.currentTarget.parentElement.innerHTML = `
                            <div class="h-[250px] rounded-lg bg-gray-800 flex items-center justify-center">
                                <span class="text-gray-400">Map unavailable</span>
                            </div>
                        `;
                    }
                }}
            />
        </div>
    );
};

export default StaticMap;