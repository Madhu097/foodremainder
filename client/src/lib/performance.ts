// Preload critical resources
export const preloadCriticalResources = () => {
    // Preload logo if not already preloaded
    const existingPreload = document.querySelector('link[rel="preload"][href="/logo.png"]');
    if (!existingPreload) {
        const logoLink = document.createElement('link');
        logoLink.rel = 'preload';
        logoLink.as = 'image';
        logoLink.href = '/logo.png';
        document.head.appendChild(logoLink);
    }
};

// Initialize performance optimizations
export const initPerformanceOptimizations = () => {
    // Preload critical resources
    preloadCriticalResources();

    // Log performance metrics in development
    if (process.env.NODE_ENV === 'development') {
        window.addEventListener('load', () => {
            const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
            if (perfData) {
                console.log('⚡ Performance Metrics:');
                console.log(`  DOM Content Loaded: ${Math.round(perfData.domContentLoadedEventEnd - perfData.fetchStart)}ms`);
                console.log(`  Page Load Complete: ${Math.round(perfData.loadEventEnd - perfData.fetchStart)}ms`);
                console.log(`  DOM Interactive: ${Math.round(perfData.domInteractive - perfData.fetchStart)}ms`);
            }
        });
    }
};
