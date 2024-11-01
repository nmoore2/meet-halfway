import { useState, useEffect } from 'react';

interface LoadingStateProps {
    vibe?: string;
}

export default function LoadingState({ vibe = 'meetup' }: LoadingStateProps) {
    const [currentMessage, setCurrentMessage] = useState(0);

    const messages = [
        {
            title: `Finding the perfect spots for a ${vibe?.toLowerCase() || 'meetup'}...`,
            id: 0
        },
        {
            title: 'Calculating drive times...',
            id: 1
        },
        {
            title: 'Checking venue details...',
            id: 2
        },
        {
            title: 'Almost done...',
            id: 3
        }
    ];

    useEffect(() => {
        const timer1 = setTimeout(() => setCurrentMessage(1), 5000);
        const timer2 = setTimeout(() => setCurrentMessage(2), 10000);
        const timer3 = setTimeout(() => setCurrentMessage(3), 15000);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
        };
    }, []);

    return (
        <>
            <div className="min-h-[200px] flex flex-col items-center justify-center p-8">
                <div className="relative h-20 w-full max-w-2xl text-center">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`
                                absolute top-0 left-0 w-full
                                transition-opacity duration-700 ease-in-out
                                ${currentMessage === message.id ? 'opacity-100' : 'opacity-0'}
                            `}
                        >
                            <h2 className="text-2xl font-semibold whitespace-normal">
                                {message.title}
                            </h2>
                        </div>
                    ))}
                </div>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mt-4" />
            </div>

            <div className="mt-12 space-y-12">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-[#1A1A1A] rounded-xl p-6 border border-[#333333] animate-pulse">
                        <div className="flex flex-col lg:flex-row gap-6">
                            <div className="lg:w-1/2">
                                <div className="h-8 w-2/3 bg-[#2A2A2A] rounded mb-4"></div>
                                <div className="h-4 w-1/3 bg-[#2A2A2A] rounded mb-4"></div>
                                <div className="space-y-2">
                                    <div className="h-4 w-full bg-[#2A2A2A] rounded"></div>
                                    <div className="h-4 w-full bg-[#2A2A2A] rounded"></div>
                                    <div className="h-4 w-3/4 bg-[#2A2A2A] rounded"></div>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-6 lg:w-1/2">
                                <div className="sm:w-3/5 h-[250px] bg-[#2A2A2A] rounded-lg"></div>
                                <div className="sm:w-2/5 h-[250px] bg-[#2A2A2A] rounded-lg"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
} 