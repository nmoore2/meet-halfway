'use client';

import { useState, useEffect } from 'react';

interface RecommendationsProps {
    results: {
        success: boolean;
        suggestions: Array<{
            name: string;
            address: string;
            bestFor: string;
            why: string;
            photos?: string[];
            price?: string;
        }>;
    };
    locationA: string;
    locationB: string;
    isLoading: boolean;
}

const PhotoCarousel = ({ photos }: { photos: string[] }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [failedPhotos, setFailedPhotos] = useState<Set<number>>(new Set());

    useEffect(() => {
        if (photos && photos.length > 0) {
            photos.forEach((photo, index) => {
                const img = new Image();
                img.src = photo;
                img.onerror = () => handleImageError(index);
            });
        }
    }, [photos]);

    if (!photos || photos.length === 0) {
        return (
            <div className="w-full h-full bg-gray-800 rounded-lg flex items-center justify-center">
                <span className="text-gray-400">No photos available</span>
            </div>
        );
    }

    const validPhotos = photos.filter((_, index) => !failedPhotos.has(index));

    if (validPhotos.length === 0) {
        return (
            <div className="w-full h-full bg-gray-800 rounded-lg flex items-center justify-center">
                <span className="text-gray-400">Unable to load photos</span>
            </div>
        );
    }

    const nextImage = () => {
        setCurrentIndex((prev) => (prev === validPhotos.length - 1 ? 0 : prev + 1));
    };

    const previousImage = () => {
        setCurrentIndex((prev) => (prev === 0 ? validPhotos.length - 1 : prev - 1));
    };

    const handleImageError = (index: number) => {
        setFailedPhotos(prev => new Set([...prev, index]));
        if (currentIndex === index && validPhotos.length > 1) {
            nextImage();
        }
    };

    return (
        <div className="relative h-full rounded-lg overflow-hidden bg-gray-800 group">
            <div className="absolute inset-0">
                {validPhotos.map((photo, index) => (
                    <img
                        key={photo}
                        src={photo}
                        alt={`Venue photo ${index + 1}`}
                        className={`absolute inset-0 w-full h-full object-cover ${index === currentIndex ? 'opacity-100' : 'opacity-0'
                            }`}
                        onLoad={() => {
                            if (index === currentIndex) setIsLoading(false);
                        }}
                        onError={() => handleImageError(index)}
                    />
                ))}
            </div>

            {validPhotos.length > 1 && (
                <>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            previousImage();
                        }}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors opacity-0 group-hover:opacity-100 z-10"
                        aria-label="Previous photo"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            nextImage();
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors opacity-0 group-hover:opacity-100 z-10"
                        aria-label="Next photo"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>

                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/50 text-white text-xs z-10">
                        {currentIndex + 1} / {validPhotos.length}
                    </div>
                </>
            )}

            {isLoading && (
                <div className="absolute inset-0 bg-gray-800 animate-pulse" />
            )}
        </div>
    );
};

export default function Recommendations({ results, locationA, locationB, isLoading }: RecommendationsProps) {
    if (isLoading) {
        return <div className="mt-8 text-center text-white">Loading recommendations...</div>;
    }

    return (
        <div className="space-y-4 mt-8">
            <h2 className="text-2xl font-bold text-white mb-4">Recommended Meeting Spots</h2>
            <div className="space-y-4">
                {results.suggestions.map((suggestion, index) => (
                    <div key={index} className="bg-[#1c1c1c] rounded-lg p-4">
                        <div className="flex flex-col md:flex-row gap-6">
                            <div className="flex-1">
                                <h3 className="text-xl font-semibold text-white mb-2">{suggestion.name}</h3>
                                <p className="text-gray-400 mb-2">
                                    <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                            suggestion.name + ' ' + suggestion.address
                                        )}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="hover:text-white transition-colors"
                                    >
                                        {suggestion.address}
                                    </a>
                                </p>
                                <p className="text-gray-300 mb-2">
                                    <strong>Best for:</strong> {suggestion.bestFor}
                                </p>
                                <p className="text-gray-300">{suggestion.why}</p>
                            </div>
                            <div className="w-full md:w-64 h-48">
                                <PhotoCarousel photos={suggestion.photos || []} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}