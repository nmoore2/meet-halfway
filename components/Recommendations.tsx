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
    photos?: string[];
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

// Add this near the top of the file, before the PhotoCarousel component
const getProxyPhotoUrl = (originalUrl: string) => {
    return `/api/place-photo?url=${encodeURIComponent(originalUrl)}`;
};

// First, create a PhotoCarousel component
const PhotoCarousel = ({ photos }: { photos: string[] }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    console.log('PhotoCarousel received photos:', photos); // Debug log

    if (!photos || photos.length === 0) {
        console.log('No photos available'); // Debug log
        return null;
    }

    return (
        <div className="relative h-full rounded-lg overflow-hidden bg-gray-800">
            <img
                key={photos[currentIndex]}
                src={photos[currentIndex]} // Remove getProxyPhotoUrl for now
                alt="Venue photo"
                className="w-full h-full object-cover"
                onLoad={() => setIsLoading(false)}
                onError={(e) => console.error('Image failed to load:', e)} // Add error handling
            />

            {photos.length > 1 && (
                <>
                    {/* Navigation Arrows */}
                    <div className="absolute inset-0 flex items-center justify-between p-2">
                        <button
                            onClick={() => setCurrentIndex(prev => prev === 0 ? photos.length - 1 : prev - 1)}
                            className="p-1.5 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <button
                            onClick={() => setCurrentIndex(prev => prev === photos.length - 1 ? 0 : prev + 1)}
                            className="p-1.5 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>

                    {/* Photo Counter */}
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/50 text-white text-xs">
                        {currentIndex + 1} / {photos.length}
                    </div>
                </>
            )}
        </div>
    );
};

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
                    <div key={index} className="bg-gray-800/50 rounded-lg relative min-h-[180px] p-4">
                        {/* Left side content */}
                        <div className="w-[45%]">
                            {/* Header */}
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-bold text-white">{suggestion.name}</h3>
                                    <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${suggestion.name} ${suggestion.address}`)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-gray-400 mt-1 hover:text-blue-400 transition-colors duration-200 flex items-center gap-1"
                                    >
                                        <span>{suggestion.address}</span>
                                        <svg
                                            className="w-4 h-4"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                            />
                                        </svg>
                                    </a>
                                </div>
                                <span className="text-gray-400">{suggestion.price}</span>
                            </div>

                            {/* Updated bullet points display */}
                            <div className="mt-4 space-y-3">
                                {suggestion.bullets?.map((bullet, i) => {
                                    if (bullet.startsWith('Rating:')) {
                                        return null; // Skip displaying the rating
                                    }
                                    // Check if the bullet starts with a bullet point and remove it
                                    const cleanBullet = bullet.startsWith('•') ? bullet.substring(1).trim() : bullet;

                                    // Now split on the first colon
                                    const colonIndex = cleanBullet.indexOf(':');
                                    if (colonIndex === -1) return null;

                                    const category = cleanBullet.substring(0, colonIndex).trim();
                                    const description = cleanBullet.substring(colonIndex + 1).trim();

                                    return (
                                        <div key={i} className="flex items-start">
                                            <span className="text-gray-300 mr-2">•</span>
                                            <div>
                                                <span className="text-gray-300 font-semibold">{category}: </span>
                                                <span className="text-gray-300">{description || 'undefined'}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Right side container for photos and map */}
                        <div className="absolute top-4 right-4 bottom-4 w-[50%] flex gap-4">
                            {/* Photos */}
                            {suggestion.photos && suggestion.photos.length > 0 && (
                                <div className="flex-1">
                                    <PhotoCarousel photos={suggestion.photos} />
                                </div>
                            )}

                            {/* Map */}
                            <div className="flex-1">
                                <img
                                    src={getStaticMapUrl(suggestion.address)}
                                    alt={`Map showing ${suggestion.name} location`}
                                    className="w-full h-full object-cover rounded-lg"
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
