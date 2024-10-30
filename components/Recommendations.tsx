'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';

const Map = dynamic(() => import('./Map'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-64 bg-[#2c2c2c] rounded-lg animate-pulse" />
    )
});

interface Location {
    lat: number;
    lng: number;
}

interface Suggestion {
    name: string;
    address: string;
    reasoning: string;
}

interface RecommendationsProps {
    suggestions?: Suggestion[];
    locationA: string;
    locationB: string;
    isLoading: boolean;
}

export default function Recommendations({ suggestions = [], locationA, locationB, isLoading }: RecommendationsProps) {
    const getStaticMapUrl = (address: string) => {
        const markers = [
            `markers=color:red%7Clabel:A%7C${encodeURIComponent(locationA)}`,
            `markers=color:red%7Clabel:B%7C${encodeURIComponent(locationB)}`,
            `markers=color:green%7C${encodeURIComponent(address)}`
        ].join('&');

        return `https://maps.googleapis.com/maps/api/staticmap?size=200x200&zoom=12&${markers}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
    };

    if (isLoading) {
        return (
            <div className="mt-8">
                <h2 className="text-2xl font-bold text-white mb-4">Finding places...</h2>
                <div className="animate-pulse space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="p-4 bg-gray-800/50 rounded-lg">
                            <div className="h-6 bg-gray-700 rounded w-3/4"></div>
                            <div className="h-4 bg-gray-700 rounded w-1/2 mt-2"></div>
                            <div className="h-16 bg-gray-700 rounded w-full mt-4"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!suggestions || suggestions.length === 0) {
        return (
            <div className="mt-8">
                <h2 className="text-2xl font-bold text-white mb-4">No recommendations found</h2>
                <p className="text-gray-400">Try adjusting your search criteria</p>
            </div>
        );
    }

    return (
        <div className="mt-8">
            <h2 className="text-2xl font-bold text-white mb-4">Recommended Meeting Spots</h2>
            <div className="space-y-4">
                {suggestions.map((suggestion, index) => (
                    <div key={index} className="p-4 bg-gray-800/50 rounded-lg flex gap-4">
                        <div className="flex-grow">
                            <h3 className="text-xl font-bold text-white">{suggestion.name}</h3>
                            <p className="text-gray-400 mt-1">{suggestion.address}</p>
                            <p className="text-gray-300 mt-3 italic">{suggestion.reasoning}</p>
                        </div>
                        <div className="flex-shrink-0">
                            <div className="w-[200px] h-[200px] rounded-lg overflow-hidden">
                                <img
                                    src={getStaticMapUrl(suggestion.address)}
                                    alt={`Map showing ${suggestion.name} location`}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
