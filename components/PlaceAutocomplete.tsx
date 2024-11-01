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
    const [hasSelectedPlace, setHasSelectedPlace] = useState(false);
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
            onChange(address);
            setHasSelectedPlace(true);
        });

        return () => {
            google.maps.event.clearInstanceListeners(autocomplete);
        };
    }, [isLoaded, onChange]);

    useEffect(() => {
        setInputValue(value);
    }, [value]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        const pacContainer = document.getElementsByClassName('pac-container');
        const isDropdownVisible = pacContainer.length > 0;

        if (e.key === 'Enter') {
            if (isDropdownVisible) {
                // If dropdown is visible, prevent form submission and let Google handle the selection
                e.preventDefault();
                e.stopPropagation();
                setHasSelectedPlace(false);
            } else if (!hasSelectedPlace) {
                // If no dropdown and no place selected yet, prevent form submission
                e.preventDefault();
                e.stopPropagation();
            }
            // If hasSelectedPlace is true and no dropdown, let the form submission happen naturally
        }

        // Reset hasSelectedPlace when user starts typing again
        if (e.key.length === 1) { // Only for character keys
            setHasSelectedPlace(false);
        }
    };

    return (
        <div className="relative">
            <Script
                id="google-maps"
                src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
                onLoad={() => setIsLoaded(true)}
            />
            <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => {
                    setInputValue(e.target.value);
                    onChange(e.target.value);
                    setHasSelectedPlace(false);
                }}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled || !isLoaded}
                className="w-full p-3 bg-[#2A2A2A] text-white rounded-lg border border-[#333333] focus:outline-none focus:border-[#444444]"
            />
            {!isLoaded && (
                <div className="absolute inset-y-0 right-3 flex items-center">
                    <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                </div>
            )}
        </div>
    );
}
