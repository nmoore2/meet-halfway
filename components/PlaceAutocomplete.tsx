'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

interface PlaceAutocompleteProps {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    disabled?: boolean;
}

export default function PlaceAutocomplete({ value, onChange, placeholder, disabled }: PlaceAutocompleteProps) {
    const [inputValue, setInputValue] = useState(value || '');
    const [isLoaded, setIsLoaded] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isLoaded || !inputRef.current) return;

        const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
            componentRestrictions: { country: 'us' },
            fields: ['formatted_address', 'geometry', 'name'],
            types: ['geocode', 'establishment']
        });

        autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            const address = place.formatted_address || place.name || '';
            setInputValue(address);
            setTimeout(() => {
                onChange(address);
            }, 0);
        });

        return () => {
            google.maps.event.clearInstanceListeners(autocomplete);
        };
    }, [isLoaded, onChange]);

    useEffect(() => {
        setInputValue(value);
    }, [value]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
        }
    };

    return (
        <div className="relative">
            <Script
                id="google-maps"
                src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
                onLoad={() => setIsLoaded(true)}
            />
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => {
                        setIsFocused(false);
                        onChange(inputValue);
                    }}
                    placeholder={placeholder}
                    disabled={disabled || !isLoaded}
                    className={`
                        w-full p-3 rounded-lg
                        bg-[#2c2c2c] 
                        border border-[#404040]
                        text-gray-200 placeholder-gray-500
                        focus:outline-none focus:border-[#bb86fc] focus:ring-1 focus:ring-[#bb86fc]
                        disabled:opacity-50 disabled:cursor-not-allowed
                        transition-all duration-200
                        ${isFocused ? 'shadow-lg' : ''}
                    `}
                />
                {!isLoaded && (
                    <div className="absolute inset-y-0 right-3 flex items-center">
                        <svg
                            className="animate-spin h-5 w-5 text-gray-400"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                        </svg>
                    </div>
                )}
            </div>

            {/* Google Places Autocomplete dropdown will inherit dark theme from Google's API */}
            <style jsx global>{`
                .pac-container {
                    background-color: #2c2c2c;
                    border: 1px solid #404040;
                    border-top: none;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                    border-radius: 0 0 0.5rem 0.5rem;
                    margin-top: 2px;
                }
                .pac-item {
                    padding: 0.5rem 1rem;
                    color: #e5e5e5;
                    border-top: 1px solid #404040;
                }
                .pac-item:hover {
                    background-color: #3c3c3c;
                }
                .pac-item-query {
                    color: #bb86fc;
                }
                .pac-matched {
                    color: #03dac6;
                }
                .pac-icon {
                    filter: invert(1);
                }
            `}</style>
        </div>
    );
}
