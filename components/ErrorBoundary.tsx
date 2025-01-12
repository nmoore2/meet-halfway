interface ErrorFallbackProps {
    error: Error;
    resetErrorBoundary: () => void;
}

export function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
    return (
        <div className="p-4 bg-[#FF3B30]/10 rounded-lg">
            <p className="text-[#FF3B30] mb-2">Something went wrong:</p>
            <pre className="text-sm mb-4">{error.message}</pre>
            <button
                onClick={resetErrorBoundary}
                className="px-4 py-2 bg-[#FF3B30] text-white rounded-lg"
            >
                Try again
            </button>
        </div>
    );
} 