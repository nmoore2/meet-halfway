import React, { useState, useEffect } from 'react';

const PhotoCarousel = ({ photos }: { photos: string[] }) => {
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());

    // Preload images
    useEffect(() => {
        const preloadImages = () => {
            photos.forEach((src, index) => {
                const img = new Image();
                img.src = src;
                img.onload = () => {
                    setLoadedImages(prev => new Set(prev).add(index));
                    if (index === 0) setIsLoading(false);
                };
            });
        };

        if (photos.length) {
            preloadImages();
        }
    }, [photos]);

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
            {/* Loading state */}
            {isLoading && (
                <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
            )}

            {/* Image container with transition */}
            <div className="relative w-full h-full">
                {photos.map((photo, index) => (
                    <img
                        key={photo}
                        src={photo}
                        alt={`Venue photo ${index + 1}`}
                        className={`
                            absolute top-0 left-0 w-full h-full object-cover
                            transition-opacity duration-300
                            ${currentPhotoIndex === index ? 'opacity-100' : 'opacity-0'}
                            ${loadedImages.has(index) ? '' : 'hidden'}
                        `}
                    />
                ))}
            </div>

            {/* Navigation buttons */}
            {photos.length > 1 && (
                <>
                    <button
                        onClick={previousPhoto}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/75 rounded-full transition-colors backdrop-blur-sm"
                        aria-label="Previous photo"
                    >
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button
                        onClick={nextPhoto}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/75 rounded-full transition-colors backdrop-blur-sm"
                        aria-label="Next photo"
                    >
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </>
            )}
        </div>
    );
};

export default PhotoCarousel; 