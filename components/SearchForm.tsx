import { useState, useEffect } from 'react';
import PlaceAutocomplete from './PlaceAutocomplete';

interface SearchFormProps {
    onSubmit: (searchData: {
        locationA: string;
        locationB: string;
        activityType: string;
        locationType: string;
        vibe: string;
    }) => void;
    isLoading?: boolean;
}

export default function SearchForm({ onSubmit, isLoading }: SearchFormProps) {
    const [formData, setFormData] = useState({
        locationA: "Sloan's Lake, Denver, CO",
        locationB: 'Cherry Creek, Denver, CO',
        activityType: 'Cocktails',
        locationType: 'Any Location Type',
        vibe: 'First Date',
        priceRange: 'any'
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            console.log('Form submitted with data:', formData);
            await onSubmit(formData);
        } catch (error: any) {
            console.error('Form submission error:', {
                message: error.message,
                stack: error.stack,
                data: error
            });
        }
    };

    const selectClass = `
        w-full p-3 rounded-lg
        bg-[#2c2c2c] border border-[#404040]
        text-gray-200 
        focus:border-[#bb86fc] focus:ring-1 focus:ring-[#bb86fc]
        disabled:opacity-50 disabled:cursor-not-allowed
        appearance-none cursor-pointer
        transition-all duration-200
    `;

    const activityTypes = [
        { value: 'Coffee Shop', label: 'Coffee Shop' },
        { value: 'Restaurant', label: 'Restaurant' },
        { value: 'Bar', label: 'Bar' },
        { value: 'Cocktails', label: 'Cocktails' },
        { value: 'Park', label: 'Park' },
        { value: 'Museum', label: 'Museum' }
    ];

    // Get price range options based on activity type
    const getPriceRangeOptions = () => {
        if (formData.activityType === 'Coffee Shop') {
            return [
                { value: 'any', label: 'Any Price' },
                { value: '$', label: '$' },
                { value: '$$', label: '$$' }
            ];
        }

        return [
            { value: 'any', label: 'Any Price' },
            { value: '$', label: '$' },
            { value: '$$', label: '$$' },
            { value: '$$$', label: '$$$' },
            { value: '$$$$', label: '$$$$' }
        ];
    };

    // Reset price range if switching to/from coffee shop and current selection is invalid
    useEffect(() => {
        if (formData.activityType === 'Coffee Shop' &&
            (formData.priceRange === '$$$' || formData.priceRange === '$$$$')) {
            setFormData(prev => ({ ...prev, priceRange: 'any' }));
        }
    }, [formData.activityType]);

    const vibes = [
        { value: 'First Date', label: 'First Date' },
        { value: 'Date', label: 'Date' },
        { value: 'Business', label: 'Business' },
        { value: 'Hangout', label: 'Hangout' }
    ];

    // First, create a custom styles object for the Google Places Autocomplete
    const customStyles = {
        input: {
            width: '100%',
            padding: '0.75rem',
            backgroundColor: '#2A2A2A',
            color: 'white',
            borderRadius: '0.5rem',
            border: '1px solid #333333',
        },
        autocompleteContainer: {
            // Container that holds the entire autocomplete component
            width: '100%',
        },
        autocompleteItem: {
            // Individual suggestion items
            backgroundColor: '#1A1A1A',
            color: '#FFFFFF',
            padding: '10px',
            cursor: 'pointer',
            borderBottom: '1px solid #333333',
        },
        autocompleteItemActive: {
            // Highlighted/selected item
            backgroundColor: '#2A2A2A',
        },
        suggestionsList: {
            // The list container
            backgroundColor: '#1A1A1A',
            border: '1px solid #333333',
            borderRadius: '0.5rem',
            marginTop: '0.5rem',
            padding: 0,
            listStyle: 'none',
        }
    };

    const handleSelect = (address: string) => {
        // Update the input value
        setFormData(prev => ({ ...prev, locationA: address }));

        // Any additional logic you need when an address is selected
        // For example, storing in state or form data
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 relative">
            {/* Location inputs - side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 relative z-20">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        First Location
                    </label>
                    {/* First location input */}
                    <div className="max-w-full">
                        <PlaceAutocomplete
                            value={formData.locationA}
                            onChange={(value) => setFormData(prev => ({ ...prev, locationA: value }))}
                            placeholder="Enter first location"
                            disabled={isLoading}
                            styles={customStyles}
                            onSelect={handleSelect}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Second Location
                    </label>
                    {/* Second location input */}
                    <div className="max-w-full">
                        <PlaceAutocomplete
                            value={formData.locationB}
                            onChange={(value) => setFormData(prev => ({ ...prev, locationB: value }))}
                            placeholder="Enter second location"
                            disabled={isLoading}
                            styles={customStyles}
                        />
                    </div>
                </div>
            </div>

            {/* Filters in one row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-8">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Location Type
                    </label>
                    <div className="relative">
                        <select
                            className="
                                w-full p-3 pr-10 
                                bg-[#2A2A2A] text-white 
                                rounded-lg border border-[#333333] 
                                appearance-none 
                                cursor-pointer
                                focus:outline-none focus:border-[#444444]
                            "
                        >
                            <option>Cocktails</option>
                            {/* other options */}
                        </select>
                        {/* Dropdown arrow */}
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Vibe
                    </label>
                    <div className="relative">
                        <select
                            className="
                                w-full p-3 pr-10 
                                bg-[#2A2A2A] text-white 
                                rounded-lg border border-[#333333] 
                                appearance-none 
                                cursor-pointer
                                focus:outline-none focus:border-[#444444]
                            "
                        >
                            <option>First Date</option>
                            {/* other options */}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Price Range
                    </label>
                    <div className="relative">
                        <select
                            className="
                                w-full p-3 pr-10 
                                bg-[#2A2A2A] text-white 
                                rounded-lg border border-[#333333] 
                                appearance-none 
                                cursor-pointer
                                focus:outline-none focus:border-[#444444]
                            "
                        >
                            <option>Any Price</option>
                            {/* other options */}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Full width submit button */}
            <button
                type="submit"
                className="w-full p-3 rounded-lg font-medium bg-[#0071e3] hover:bg-[#0077ED] text-white"
            >
                Find Places
            </button>

            {/* Loading spinner - position it behind the inputs */}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
            )}
        </form>
    );
}
