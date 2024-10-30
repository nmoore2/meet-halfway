'use client';

import { useState } from 'react';
import SearchForm from '../components/SearchForm';
import Recommendations from '../components/Recommendations';

interface SearchResult {
    success: boolean;
    suggestions?: any[];
    error?: string;
}

export default function Home() {
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
    const [currentSearch, setCurrentSearch] = useState<{
        locationA: string;
        locationB: string;
    } | null>(null);

    const handleSearch = async (searchData: any) => {
        try {
            setError(null);
            setSuccess(null);
            setIsLoading(true);
            setCurrentSearch({
                locationA: searchData.locationA,
                locationB: searchData.locationB
            });

            const response = await fetch('/api/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(searchData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Something went wrong');
            }

            setSearchResult(data);
            setSuccess('Found some great meeting spots!');
        } catch (error: any) {
            console.error('Search error:', error);
            setError(error.message || 'An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold text-center mb-8">Meet Halfway</h1>

                {error && (
                    <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
                        {success}
                    </div>
                )}

                <SearchForm onSubmit={handleSearch} isLoading={isLoading} />

                {searchResult && currentSearch && (
                    <Recommendations
                        suggestions={searchResult.suggestions}
                        locationA={currentSearch.locationA}
                        locationB={currentSearch.locationB}
                        isLoading={isLoading}
                    />
                )}
            </div>
        </main>
    );
} 