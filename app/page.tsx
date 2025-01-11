'use client';

import { useState } from 'react';
import SearchForm from '../components/SearchForm';
import Recommendations from '../components/Recommendations';
import { Toast } from '../components/Toast';
import LoadingState from '../components/LoadingState';
import ClusterResults from '../components/ClusterResults';
import { ClusterService } from '../services/ClusterService';

interface SearchResult {
    success: boolean;
    suggestions?: any[];
    clusters?: any[];
    midpoint?: {
        lat: number;
        lng: number;
        searchRadius: number;
        routePolyline?: string;
    };
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
        meetupType?: string;
    } | null>(null);
    const [results, setResults] = useState(null);

    const handleSearch = async (searchData: any) => {
        try {
            setIsLoading(true);
            setSearchResult(null);

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

            if (!response.ok) {
                setSearchResult({
                    success: false,
                    error: data.error || "We couldn't find any spots matching your criteria. Try adjusting your search or selecting different locations.",
                    suggestions: []
                });
                return;
            }

            if (data.suggestions?.length > 0) {
                setSearchResult({
                    success: true,
                    suggestions: data.suggestions,
                    clusters: data.clusters,
                    midpoint: data.midpoint
                });

                setToastMessage('Found some great meeting spots!');
                setShowToast(true);
                setTimeout(() => setShowToast(false), 3000);
            } else {
                setSearchResult({
                    success: false,
                    error: "We couldn't find any spots matching your criteria. Try adjusting your search or selecting different locations.",
                    suggestions: []
                });
            }

            setResults(data);

        } catch (error) {
            console.error('Search error:', error);
            setSearchResult({
                success: false,
                error: "We couldn't find any spots matching your criteria. Try adjusting your search or selecting different locations.",
                suggestions: []
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="max-w-[1440px] py-16 sm:py-24 mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                <h1 className="text-4xl font-bold text-center mb-8">Meet Halfway</h1>
                {showToast && <Toast message={toastMessage} />}
                <SearchForm onSubmit={handleSearch} isLoading={isLoading} results={results} />
                {isLoading && <LoadingState vibe={currentSearch?.meetupType} />}
                {searchResult?.clusters && searchResult.clusters.length > 0 && (
                    <ClusterResults
                        clusters={searchResult.clusters}
                        midpoint={searchResult.midpoint}
                        locationA={currentSearch?.locationA}
                        locationB={currentSearch?.locationB}
                    />
                )}
                <Recommendations
                    results={searchResult}
                    locationA={currentSearch?.locationA}
                    locationB={currentSearch?.locationB}
                    isLoading={isLoading}
                    meetupType={currentSearch?.meetupType}
                />
            </div>
        </main>
    );
} 