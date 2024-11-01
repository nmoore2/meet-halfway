'use client';

import { useState, useEffect } from 'react';
import PhotoCarousel from './PhotoCarousel';
import LoadingState from './LoadingState';
import StaticMap from './StaticMap';

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
    } | null;
    locationA?: string;
    locationB?: string;
    isLoading: boolean;
    meetupType?: string;
}

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
    // Extract city name from full address
    const getCityName = (location: string) => {
        // Add null check
        if (!location) return '';

        // Split by comma and get first part (city/area name)
        const parts = location.split(',');
        return parts[0].trim();
    };

    if (!driveTimes) return null;

    const locationAName = getCityName(locationA);
    const locationBName = getCityName(locationB);

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
            <span>From {locationAName}: {driveTimes.fromA}</span>
            <span className="mx-2 text-gray-600">•</span>
            <span>From {locationBName}: {driveTimes.fromB}</span>
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

const formatDriveTime = (driveTimes: DriveTime, locationA: string, locationB: string) => {
    const cityA = locationA?.split(',')[0] || 'Location A';
    const cityB = locationB?.split(',')[0] || 'Location B';

    return (
        <div className="flex items-center text-sm text-gray-400 gap-4">
            <span>From {cityA}: {driveTimes.fromA}</span>
            <span className="mx-2 text-gray-600">•</span>
            <span>From {cityB}: {driveTimes.fromB}</span>
        </div>
    );
};

export default function Recommendations({ results, locationA, locationB, isLoading, meetupType = 'meetup' }: RecommendationsProps) {
    if (isLoading) {
        return (
            <div className="mt-12 space-y-12">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-[#1A1A1A] rounded-xl p-6 border border-[#333333] animate-pulse">
                        <div className="flex flex-col lg:flex-row gap-6">
                            <div className="lg:w-1/2">
                                <div className="h-8 w-2/3 bg-[#2A2A2A] rounded mb-4"></div>
                                <div className="h-4 w-1/3 bg-[#2A2A2A] rounded mb-4"></div>
                                <div className="space-y-2">
                                    <div className="h-4 w-full bg-[#2A2A2A] rounded"></div>
                                    <div className="h-4 w-full bg-[#2A2A2A] rounded"></div>
                                    <div className="h-4 w-3/4 bg-[#2A2A2A] rounded"></div>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-6 lg:w-1/2">
                                <div className="sm:w-3/5 h-[250px] bg-[#2A2A2A] rounded-lg"></div>
                                <div className="sm:w-2/5 h-[250px] bg-[#2A2A2A] rounded-lg"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // Handle error state
    if (results?.error) {
        return (
            <div className="mt-8 p-6 bg-[#1A1A1A] rounded-xl border border-[#333333]">
                <div className="flex items-center gap-3 text-[#FF3B30]">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-lg">{results.error}</span>
                </div>
            </div>
        );
    }

    // Only show results if we have them
    if (!results?.suggestions?.length) {
        return null;
    }

    return (
        <div className="mt-12">
            {results?.suggestions && results.suggestions.length > 0 ? (
                <>
                    <h2 className="text-2xl font-bold mb-8">
                        Here Are the Best Spots to Meet for a {meetupType}
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

                                        {suggestion.driveTimes && (
                                            <div className="mt-2">
                                                {formatDriveTime(suggestion.driveTimes, locationA, locationB)}
                                            </div>
                                        )}
                                    </div>

                                    {/* Media container */}
                                    <div className="flex flex-col sm:flex-row gap-6 lg:w-1/2">
                                        {/* Photo carousel */}
                                        <div className="sm:w-3/5 flex-shrink-0">
                                            <PhotoCarousel photos={suggestion.photos || []} />
                                        </div>

                                        {/* Map container - increased right padding */}
                                        <div className="sm:w-2/5 flex-shrink-0 pr-6">
                                            <StaticMap
                                                venue={suggestion}
                                                locationA={locationA || ''}
                                                locationB={locationB || ''}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            ) : null}
        </div>
    );
}  