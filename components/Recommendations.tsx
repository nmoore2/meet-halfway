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
    why: string;
    bestFor: string;
    price: string;
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

    return (
        <div className="mt-8">
            <h2 className="text-2xl font-bold text-white mb-4">Recommended Meeting Spots</h2>
            <div className="space-y-4">
                {suggestions.map((suggestion, index) => (
                    <div key={index} className="p-4 bg-gray-800/50 rounded-lg flex gap-4">
                        <div className="flex-grow">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-white">{suggestion.name}</h3>
                                <span className="text-gray-400 font-mono">{suggestion.price}</span>
                            </div>
                            <p className="text-gray-400 mt-1">{suggestion.address}</p>
                            <div className="mt-3 text-gray-300 space-y-2">
                                <div className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>Why: {suggestion.why}</span>
                                </div>
                                <div className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>Best for: {suggestion.bestFor}</span>
                                </div>
                            </div>
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
