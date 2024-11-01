// New Toast component
export const Toast = ({ message }: { message: string }) => {
    return (
        <div className="fixed top-6 right-6 z-50 animate-fade-in">
            <div className="bg-emerald-500/90 text-white rounded-lg px-4 py-3 shadow-lg">
                <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-medium">{message}</span>
                </div>
            </div>
        </div>
    );
};