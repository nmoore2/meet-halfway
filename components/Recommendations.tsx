'use client';

import { useState } from 'react';
import PhotoCarousel from './PhotoCarousel';
import LoadingState from './LoadingState';
import StaticMap from './StaticMap';
import ClusterAnalysisMap from './ClusterAnalysisMap';

interface Venue {
    name: string;
    address: string;
    rating: number;
    user_ratings_total: number;
    price_level?: number;
    photos?: string[];
    location?: {
        lat: number;
        lng: number;
    };
    driveTimes?: {
        fromLocationA: number | null;
        fromLocationB: number | null;
    };
}

interface RecommendationsProps {
    venues: Venue[];
    isLoading: boolean;
    location1?: string;
    location2?: string;
    midpoint?: {
        lat: number;
        lng: number;
        searchRadius: number;
    };
}

const getPriceDisplay = (price_level?: number) => {
    const level = price_level ?? 1;
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

export default function Recommendations({ venues, isLoading, location1, location2, midpoint }: RecommendationsProps) {
    console.log('Recommendations props:', { venues, isLoading, location1, location2 });

    if (isLoading) {
        return <LoadingState />;
    }

    if (!venues?.length) {
        console.log('No venues to display');
        return null;
    }

    console.log('Rendering map with:', {
        locationA: location1,
        locationB: location2,
        venuesCount: venues.length,
        firstVenue: venues[0]
    });

    return (
        <div className="mt-8">
            <div className="mb-8 h-[400px] rounded-lg overflow-hidden">
                <ClusterAnalysisMap
                    locationA={location1 || ''}
                    locationB={location2 || ''}
                    suggestions={venues}
                    midpoint={midpoint}
                />
            </div>

            <div className="space-y-6">
                {venues.map((venue, index) => (
                    <div
                        key={venue.place_id || index}
                        className="bg-[#1A1A1A] rounded-xl p-6 hover:bg-[#222222] transition-colors duration-200 border border-[#333333]"
                    >
                        <div className="flex flex-col lg:flex-row gap-6">
                            {/* Venue Info Section */}
                            <div className="lg:w-1/2">
                                <div className="flex items-center gap-2 mb-4">
                                    <h3 className="text-xl font-semibold text-white">{venue.name}</h3>
                                    {/* Google Maps Link */}
                                    <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                            venue.name + ' ' + venue.vicinity
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
                                    {venue.price_level !== undefined && getPriceDisplay(venue.price_level)}
                                </div>

                                {/* Rating */}
                                <div className="flex items-center gap-2 mb-4 text-sm text-gray-400">
                                    <span className="flex items-center">
                                        {venue.rating} ⭐
                                    </span>
                                    <span className="text-gray-600">•</span>
                                    <span>{venue.user_ratings_total.toLocaleString()} reviews</span>
                                </div>

                                {/* Address */}
                                <div className="text-gray-300 mb-4">
                                    {venue.vicinity}
                                </div>

                                {/* Drive Times */}
                                {venue.driveTimes && (
                                    <div className="flex items-center text-sm text-gray-400 mt-4">
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 17h14M7 9h10l2 4M5 13l2-4" />
                                        </svg>
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                            <span>From {location1?.split(',')[0]}: {venue.driveTimes.fromLocationA} min</span>
                                            <span className="hidden sm:inline text-gray-600 mx-2">•</span>
                                            <span>From {location2?.split(',')[0]}: {venue.driveTimes.fromLocationB} min</span>
                                        </div>
                                    </div>
                                )}

                                {/* Scores */}
                                {venue.scores && (
                                    <div className="mt-4 text-sm text-gray-400">
                                        <div>Match Score: {Math.round(venue.scores.final * 100)}%</div>
                                    </div>
                                )}
                            </div>

                            {/* Media Section */}
                            <div className="flex flex-col sm:flex-row gap-6 lg:w-1/2">
                                <div className="sm:w-3/5">
                                    <PhotoCarousel photos={venue.photos || []} />
                                </div>
                                <div className="sm:w-2/5">
                                    <StaticMap
                                        venue={venue}
                                        locationA={location1 || ''}
                                        locationB={location2 || ''}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}