'use client';

import { useState, useEffect } from 'react';

interface DriveTime {
    fromA: string;
    fromB: string;
}

interface RecommendationsProps {
    results: {
        success: boolean;
        suggestions: Array<{
            name: string;
            address: string;
            bestFor: string;
            why: string;
            photos?: string[];
            price_level?: number;
            location?: {
                lat: number;
                lng: number;
            };
            driveTimes?: DriveTime;
        }>;
    };
    locationA: string;
    locationB: string;
    isLoading: boolean;
}

// [Keep PhotoCarousel component exactly as is]
const PhotoCarousel = ({ photos }: { photos: string[] }) => {
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

    if (!photos.length) {
        return (
            <div className="w-full h-full bg-gray-800 rounded-lg flex items-center justify-center">
                <span className="text-gray-400">No photos available</span>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full">
            <img
                src={photos[currentPhotoIndex]}
                alt={`Venue photo ${currentPhotoIndex + 1}`}
                className="w-full h-full object-cover rounded-lg"
            />
            {photos.length > 1 && (
                <div className="absolute bottom-2 right-2 bg-black/50 px-2 py-1 rounded text-xs text-white">
                    {currentPhotoIndex + 1} / {photos.length}
                </div>
            )}
        </div>
    );
};

// [Keep getPriceDisplay exactly as is]
const getPriceDisplay = (price_level?: number) => {
    // ... [Keep existing getPriceDisplay implementation]
};

const DriveTimeDisplay = ({ driveTimes, locationA, locationB }: {
    driveTimes?: DriveTime;
    locationA: string;
    locationB: string;
}) => {
    if (!driveTimes) return null;

    return (
        <div className="mt-3 text-sm text-gray-400">
            <span>{driveTimes.fromA} from {locationA}</span>
            <span className="mx-2 text-gray-600">•</span>
            <span>{driveTimes.fromB} from {locationB}</span>
        </div>
    );
};

// [Keep getStaticMapUrl exactly as is]
const getStaticMapUrl = (locationA: string, locationB: string, venue: { location?: { lat: number; lng: number } }) => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    const markers = [
        `color:blue|label:A|${locationA}`,
        `color:red|label:B|${locationB}`,
    ];

    if (venue.location) {
        markers.push(`color:green|label:V|${venue.location.lat},${venue.location.lng}`);
    }

    return `https://maps.googleapis.com/maps/api/staticmap?size=400x300&zoom=11&markers=${markers.join('&markers=')}&key=${apiKey}`;
};

// [Keep VenueMap exactly as is]
const VenueMap = ({ locationA, locationB, venue }: {
    locationA: string;
    locationB: string;
    venue: { location?: { lat: number; lng: number } }
}) => {
    const mapUrl = getStaticMapUrl(locationA, locationB, venue);

    return (
        <div className="w-full h-48 rounded-lg overflow-hidden">
            <img
                src={mapUrl}
                alt="Map showing venue location"
                className="w-full h-full object-cover"
            />
        </div>
    );
};

export default function Recommendations({ results, locationA, locationB, isLoading }: RecommendationsProps) {
    if (isLoading) {
        return (
            <div className="mt-8 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
                    <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
                        Loading...
                    </span>
                </div>
                <div className="mt-2 text-white">Finding the perfect spots...</div>
            </div>
        );
    }

    return (
        <div className="space-y-4 mt-8">
            <h2 className="text-2xl font-bold text-white mb-4">Recommended Meeting Spots</h2>
            <div className="space-y-4">
                {results.suggestions.map((suggestion, index) => (
                    <div key={index} className="bg-[#1c1c1c] rounded-lg p-4 hover:bg-[#252525] transition-colors duration-200">
                        <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-semibold text-white">{suggestion.name}</h3>
                            {suggestion.price_level !== undefined && getPriceDisplay(suggestion.price_level)}
                        </div>
                        <p className="text-gray-400 mb-2">
                            <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                    suggestion.name + ' ' + suggestion.address
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-white transition-colors flex items-center gap-1"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {suggestion.address}
                            </a>
                        </p>
                        <p className="text-gray-300 mb-2">
                            <strong>Best for:</strong> {suggestion.bestFor}
                        </p>
                        <p className="text-gray-300 mb-3">{suggestion.why}</p>
                        <DriveTimeDisplay
                            driveTimes={suggestion.driveTimes}
                            locationA={locationA}
                            locationB={locationB}
                        />
                        <div className="flex gap-4 mt-4">
                            <div className="w-64 h-48">
                                <PhotoCarousel photos={suggestion.photos || []} />
                            </div>
                            <div className="w-48 h-48">
                                <VenueMap
                                    locationA={locationA}
                                    locationB={locationB}
                                    venue={suggestion}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}