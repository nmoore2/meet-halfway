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

            const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
            if (!API_KEY) {
                console.error('Google Maps API key not found');
                return;
            }

            // Create markers
            const markers = [
                `markers=color:red|label:A|${venue.location.lat},${venue.location.lng}`,
            ].join('&');

            // Generate static map URL
            const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?`
                + `center=${venue.location.lat},${venue.location.lng}`
                + `&zoom=14`
                + `&size=600x300`
                + `&scale=2`
                + `&maptype=roadmap`
                + `&${markers}`
                + `&style=feature:all|element:labels|visibility:on`
                + `&style=feature:all|element:geometry|color:0x242f3e`
                + `&style=feature:water|element:geometry|color:0x17263c`
                + `&key=${API_KEY}`;

            if (imgRef.current) {
                imgRef.current.src = mapUrl;
            }
        };

        generateMap();
    }, [venue]);

    return (
        <div className="h-[250px] rounded-lg overflow-hidden bg-gray-800">
            <img
                ref={imgRef}
                alt={`Map showing ${venue.name} location`}
                className="w-full h-full object-cover"
                style={{ objectPosition: 'center' }}
                loading="lazy"
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