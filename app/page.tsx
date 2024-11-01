'use client';

import { useState } from 'react';
import SearchForm from '../components/SearchForm';
import Recommendations from '../components/Recommendations';
import { Toast } from '../components/Toast';

interface SearchResult {
    success: boolean;
    suggestions?: any[];
    error?: string;
}

export default function Home() {
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
    const [currentSearch, setCurrentSearch] = useState<{
        locationA: string;
        locationB: string;
    } | null>(null);

    const handleSearch = async (searchData: any) => {
        try {
            setIsLoading(true);
            setCurrentSearch({
                locationA: searchData.locationA,
                locationB: searchData.locationB
            });

            console.log('Sending search request with data:', searchData);

            const response = await fetch('/api/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(searchData),
            });

            const data = await response.json();
            console.log('Received response:', data);

            if (!response.ok) {
                throw new Error(data.message || 'Failed to get recommendations');
            }

            if (!data.success) {
                throw new Error(data.message || 'No recommendations found');
            }

            setSearchResult(data);
            setToastMessage('Found some great meeting spots!');
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        } catch (error: any) {
            console.error('Search error:', {
                message: error.message,
                stack: error.stack
            });
            setToastMessage(error.message || 'An error occurred while searching');
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
            setSearchResult(null);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="max-w-[1440px] py-16 sm:py-24 mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                <h1 className="text-4xl font-bold text-center mb-8">Meet Halfway</h1>
                {showToast && <Toast message={toastMessage} />}
                <SearchForm onSubmit={handleSearch} isLoading={isLoading} />
                {searchResult && currentSearch && (
                    <Recommendations
                        results={searchResult}
                        locationA={currentSearch.locationA}
                        locationB={currentSearch.locationB}
                        isLoading={isLoading}
                    />
                )}
            </div>
        </main>
    );
} 