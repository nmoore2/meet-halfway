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
            <div className="w-full h-[250px] bg-gray-800 rounded-lg flex items-center justify-center">
                <span className="text-gray-400">No photos available</span>
            </div>
        );
    }

    const nextPhoto = () => {
        setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
    };

    const previousPhoto = () => {
        setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
    };

    return (
        <div className="relative h-[250px] rounded-lg overflow-hidden">
            <img
                src={photos[currentPhotoIndex]}
                alt={`Venue photo ${currentPhotoIndex + 1}`}
                className="w-full h-full object-cover"
            />
            {photos.length > 1 && (
                <>
                    <button
                        onClick={previousPhoto}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-1 bg-gray-600 hover:bg-gray-500 rounded-full transition-colors"
                        aria-label="Previous photo"
                    >
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button
                        onClick={nextPhoto}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-gray-600 hover:bg-gray-500 rounded-full transition-colors"
                        aria-label="Next photo"
                    >
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                    <div className="absolute bottom-2 right-2 bg-gray-600 px-2 py-1 rounded text-xs text-white">
                        {currentPhotoIndex + 1} / {photos.length}
                    </div>
                </>
            )}
        </div>
    );
};

// [Keep getPriceDisplay exactly as is]
const getPriceDisplay = (price_level?: number) => {
    // Changed to show one dollar sign by default
    const level = price_level ?? 1;  // Use nullish coalescing to default to 1

    const dollars = ''.padStart(level, '$');
    const greyDollars = ''.padStart(4 - level, '$');

    return (
        <span className="text-sm ml-2 relative group cursor-help">
            <span className="text-[#0071e3]">{dollars}</span>
            <span className="text-[#86868b]">{greyDollars}</span>

            <div className="
                absolute bottom-full left-1/2 -translate-x-1/2 mb-2
                invisible group-hover:visible opacity-0 group-hover:opacity-100
                transition-opacity duration-200
                bg-black/75 backdrop-blur-sm
                px-2 py-1
                rounded text-xs text-white
                whitespace-nowrap
                pointer-events-none
            ">
                Price level from Google
            </div>
        </span>
    );
};

const DriveTimeDisplay = ({ driveTimes, locationA, locationB }: {
    driveTimes?: DriveTime;
    locationA: string;
    locationB: string;
}) => {
    if (!driveTimes) return null;

    return (
        <div className="text-sm text-gray-400 flex items-center">
            <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M5 17h14M7 9h10l2 4M5 13l2-4"
                />
            </svg>
            <span>Sloan's Lake: 8m</span>
            <span className="mx-2 text-gray-600">•</span>
            <span>Cherry Creek: 18m</span>
        </div>
    );
};

// [Keep getStaticMapUrl exactly as is]
const getStaticMapUrl = (locationA: string, locationB: string, venue: { location?: { lat: number; lng: number } }) => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    const markers = [
        `color:0x38BDF8|label:A|${locationA}`,
        `color:0x38BDF8|label:B|${locationB}`,
    ];

    if (venue.location) {
        markers.push(`color:0x38BDF8|icon:https://maps.google.com/mapfiles/kml/paddle/star.png|${venue.location.lat},${venue.location.lng}`);
    }

    // Night mode styles from the example
    const styles = [
        { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
        { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
        { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] }
    ]; // Simplified version of the styles for Static Maps API

    return `https://maps.googleapis.com/maps/api/staticmap?`
        + `size=300x300`
        + `&zoom=11`
        + `&markers=${markers.join('&markers=')}`
        + `&key=${apiKey}`
        + `&style=${encodeURIComponent(JSON.stringify(styles))}`
        + `&scale=2`;
};

// [Keep VenueMap exactly as is]
const VenueMap = ({ locationA, locationB, venue }: {
    locationA: string;
    locationB: string;
    venue: { location?: { lat: number; lng: number } }
}) => {
    const mapUrl = getStaticMapUrl(locationA, locationB, venue);

    return (
        <div className="w-full h-full rounded-lg overflow-hidden">
            <img
                src={mapUrl}
                alt="Map showing venue location"
                className="w-full h-full object-cover rounded-lg"
            />
        </div>
    );
};

export default function Recommendations({ results, locationA, locationB, isLoading }: RecommendationsProps) {
    if (isLoading) {
        return (
            <div className="space-y-8 mt-8">
                <h2 className="text-2xl font-bold mb-4 text-white">
                    Finding the Perfect Spots...
                </h2>
                <div className="space-y-12">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="bg-[#1A1A1A] rounded-xl p-6 border border-[#333333] animate-pulse"
                        >
                            <div className="flex flex-col lg:flex-row gap-6">
                                {/* Text content skeleton */}
                                <div className="lg:w-1/2">
                                    <div className="h-7 bg-gray-700 rounded w-3/4 mb-3"></div>
                                    <div className="h-4 bg-gray-700 rounded w-1/4 mb-4"></div>
                                    <div className="space-y-2">
                                        <div className="h-4 bg-gray-700 rounded w-full"></div>
                                        <div className="h-4 bg-gray-700 rounded w-5/6"></div>
                                        <div className="h-4 bg-gray-700 rounded w-4/6"></div>
                                    </div>
                                    <div className="h-4 bg-gray-700 rounded w-2/4 mt-4"></div>
                                </div>

                                {/* Media skeleton */}
                                <div className="flex flex-col sm:flex-row gap-6 lg:w-1/2">
                                    {/* Photo carousel skeleton */}
                                    <div className="sm:w-3/5 h-[250px] bg-gray-700 rounded-lg flex-shrink-0"></div>
                                    {/* Map skeleton */}
                                    <div className="sm:w-2/5 h-[250px] bg-gray-700 rounded-lg flex-shrink-0"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 mt-8 text-white">
            <h2 className="text-2xl font-bold mb-4 text-white">
                Recommended Meeting Spots
            </h2>
            <div className="space-y-12">
                {results.suggestions.map((suggestion, index) => (
                    <div
                        key={index}
                        className="bg-[#1A1A1A] rounded-xl p-6 hover:bg-[#222222] transition-colors duration-200 border border-[#333333] overflow-hidden"
                    >
                        <div className="flex flex-col lg:flex-row gap-6">
                            {/* Text content */}
                            <div className="lg:w-1/2 min-w-[300px]">
                                <div className="flex items-center gap-2 mb-4">
                                    <h3 className="text-xl font-semibold text-white">{suggestion.name}</h3>
                                    <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                            suggestion.name + ' ' + suggestion.address
                                        )}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-gray-400 hover:text-sky-400 transition-colors"
                                        title="Open in Google Maps"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </a>
                                    {suggestion.price_level !== undefined && getPriceDisplay(suggestion.price_level)}
                                </div>

                                {/* Description section */}
                                <div className="text-gray-300 mb-4">
                                    <div className="text-[#0071e3] font-medium mb-2">Best for: {suggestion.bestFor}</div>
                                    <div>
                                        <span className="font-medium">Why: </span>
                                        {suggestion.why}
                                    </div>
                                </div>

                                <div className="text-sm text-gray-400 flex items-center">
                                    <svg
                                        className="w-5 h-5 mr-2"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={1.5}
                                            d="M5 17h14M7 9h10l2 4M5 13l2-4"
                                        />
                                    </svg>
                                    <span>Sloan's Lake: 8m</span>
                                    <span className="mx-2 text-gray-600">•</span>
                                    <span>Cherry Creek: 18m</span>
                                </div>
                            </div>

                            {/* Media container */}
                            <div className="flex flex-col sm:flex-row gap-6 lg:w-1/2">
                                {/* Photo carousel */}
                                <div className="sm:w-3/5 flex-shrink-0">
                                    <PhotoCarousel photos={suggestion.photos || []} />
                                </div>

                                {/* Map container - increased right padding */}
                                <div className="sm:w-2/5 flex-shrink-0 pr-6">
                                    <div className="h-[250px] rounded-lg overflow-hidden">
                                        <VenueMap
                                            locationA={locationA}
                                            locationB={locationB}
                                            venue={suggestion}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}