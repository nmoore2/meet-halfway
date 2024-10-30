let isLoading = false;
let isLoaded = false;

export function loadGoogleMaps(): Promise<void> {
    // If already loaded, return immediately
    if (window.google?.maps?.places) {
        return Promise.resolve();
    }

    // If currently loading, wait for it
    if (isLoading) {
        return new Promise((resolve) => {
            const checkLoaded = setInterval(() => {
                if (window.google?.maps?.places) {
                    clearInterval(checkLoaded);
                    resolve();
                }
            }, 100);
        });
    }

    // Start loading
    isLoading = true;

    return new Promise((resolve, reject) => {
        // Check for existing script
        const existingScript = document.getElementById('google-maps-script');
        if (existingScript) {
            document.body.removeChild(existingScript);
        }

        const script = document.createElement('script');
        script.id = 'google-maps-script';
        script.type = 'text/javascript';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;

        script.onload = () => {
            isLoading = false;
            isLoaded = true;
            resolve();
        };

        script.onerror = (error) => {
            isLoading = false;
            reject(error);
        };

        document.body.appendChild(script);
    });
}

// Add this to the global window type
declare global {
    interface Window {
        initGoogleMaps: () => void;
    }
}
