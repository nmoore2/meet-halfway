import React, { useState, useEffect, useRef } from 'react';

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
    const getStaticMapUrl = async () => {
        if (!venue.location) return null;

        const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        if (!MAPBOX_ACCESS_TOKEN) return null;

        try {
            const geocodeUrl = (address: string) =>
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_ACCESS_TOKEN}`;

            const [locA, locB] = await Promise.all([
                fetch(geocodeUrl(locationA)).then(res => res.json()),
                fetch(geocodeUrl(locationB)).then(res => res.json())
            ]);

            if (!locA.features?.[0] || !locB.features?.[0]) {
                throw new Error('Failed to geocode locations');
            }

            const locationACoords = locA.features[0].center;
            const locationBCoords = locB.features[0].center;
            const venueCoords = [venue.location.lng, venue.location.lat];

            const centerLng = (locationACoords[0] + locationBCoords[0] + venueCoords[0]) / 3;
            const centerLat = (locationACoords[1] + locationBCoords[1] + venueCoords[1]) / 3;

            const markers = [
                `pin-s-a+0071e3(${locationACoords[0]},${locationACoords[1]})`,
                `pin-s-b+0071e3(${locationBCoords[0]},${locationBCoords[1]})`,
                `pin-s-star+4CAF50(${venueCoords[0]},${venueCoords[1]})`
            ].join(',');

            return `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/${markers}/${centerLng},${centerLat},7.5/600x300@2x?access_token=${MAPBOX_ACCESS_TOKEN}`;

        } catch (error) {
            console.error('Error generating map URL:', error);
            return null;
        }
    };

    useEffect(() => {
        const loadMap = async () => {
            const url = await getStaticMapUrl();
            if (url && imgRef.current) {
                imgRef.current.src = url;
            }
        };
        loadMap();
    }, [venue, locationA, locationB]);

    const imgRef = useRef<HTMLImageElement>(null);

    return (
        <div className="h-[250px] rounded-lg overflow-hidden bg-gray-800">
            <img
                ref={imgRef}
                alt={`Map showing ${venue.name} location`}
                className="w-full h-full object-cover"
                style={{ objectPosition: 'center' }}
                loading="lazy"
                onError={(e) => {
                    console.error('Map image failed to load. URL:', e.currentTarget.src);
                    e.currentTarget.parentElement!.innerHTML = `
                        <div class="h-[250px] rounded-lg bg-gray-800 flex items-center justify-center">
                            <span class="text-gray-400">Map unavailable</span>
                        </div>
                    `;
                }}
            />
        </div>
    );
};

export default StaticMap; 