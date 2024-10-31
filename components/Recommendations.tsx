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
    price: string;
    why: string;
    bestFor: string;
    firstDateAppeal?: string;
    conversationStarters?: string;
    bullets: string[];
}

interface RecommendationsProps {
    results: {
        success: boolean;
        suggestions: Suggestion[];
    };
    locationA: string;
    locationB: string;
    isLoading: boolean;
}

export default function Recommendations({ results, locationA, locationB, isLoading }: RecommendationsProps) {
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

    if (!results?.suggestions || results.suggestions.length === 0) {
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
                {results.suggestions.map((suggestion, index) => (
                    <div key={index} className="p-4 bg-gray-800/50 rounded-lg flex gap-4">
                        <div className="flex-grow">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-xl font-bold text-white">{suggestion.name}</h3>
                                <span className="text-gray-400">{suggestion.price}</span>
                            </div>
                            <p className="text-gray-400 mb-3">{suggestion.address}</p>
                            <ul className="space-y-2 text-gray-300">
                                {suggestion.bullets?.map((bullet, i) => (
                                    <li key={i} className="flex items-start">
                                        <span className="mr-2">•</span>
                                        <span>{bullet}</span>
                                    </li>
                                ))}
                            </ul>
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
