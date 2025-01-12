'use client';

import { useState } from 'react';
import SearchForm from '../components/SearchForm';
import Recommendations from '../components/Recommendations';
import { Venue } from '../types';

export default function Home() {
    const [isLoading, setIsLoading] = useState(false);
    const [venues, setVenues] = useState<Venue[]>([]);
    const [midpoint, setMidpoint] = useState<any>(null);
    const [currentSearch, setCurrentSearch] = useState({
        locationA: '',
        locationB: '',
        meetupType: ''
    });

    const handleSearch = async (searchData: any) => {
        setIsLoading(true);
        setVenues([]);

        try {
            setCurrentSearch({
                locationA: searchData.location1,
                locationB: searchData.location2,
                meetupType: searchData.meetupType
            });

            const response = await fetch('/api/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(searchData),
            });

            const data = await response.json();
            console.log('Search response data:', data);

            if (!response.ok) {
                console.error('Search failed:', data);
                return;
            }

            if (data.suggestions) {
                setVenues(data.suggestions);
                setMidpoint(data.midpoint);
            }

        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    console.log('Current state:', { venues, isLoading, currentSearch });

    return (
        <main className="min-h-screen bg-black text-white p-8">
            <div className="max-w-5xl mx-auto">
                <h1 className="text-4xl font-bold text-center mb-8">Meet Halfway</h1>
                <SearchForm onSearch={handleSearch} isLoading={isLoading} />
                <Recommendations
                    venues={venues}
                    isLoading={isLoading}
                    location1={currentSearch.locationA}
                    location2={currentSearch.locationB}
                    midpoint={midpoint}
                />
            </div>
        </main>
    );
} 