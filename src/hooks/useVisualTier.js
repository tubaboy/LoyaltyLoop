import { useState, useEffect } from 'react';

/**
 * Hook to detect if the current device/browser should use a legacy visual mode
 * to avoid GPU rendering issues (like artifacts on old Android/Chrome) 
 * or performance lag (like on old iPads).
 */
export function useVisualTier() {
    const [isLegacy, setIsLegacy] = useState(false);

    useEffect(() => {
        const ua = navigator.userAgent;
        
        // 1. Detect Chrome version on Android
        const chromeMatch = ua.match(/Chrome\/(\d+)/);
        const chromeVersion = chromeMatch ? parseInt(chromeMatch[1], 10) : null;
        
        // 2. Detect Android version
        const androidMatch = ua.match(/Android\s(\d+)/);
        const androidVersion = androidMatch ? parseInt(androidMatch[1], 10) : null;

        // 3. Detect iOS version
        const iosMatch = ua.match(/OS\s(\d+)_/);
        const iosVersion = iosMatch ? parseInt(iosMatch[1], 10) : null;

        // 4. Hardware hints (if available)
        const lowMemory = navigator.deviceMemory && navigator.deviceMemory < 4;
        const lowCPU = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;

        // --- Legacy Rules ---
        let legacy = false;

        // Rule A: Old Chrome or Old Android
        if (chromeVersion && chromeVersion < 100) legacy = true;
        if (androidVersion && androidVersion < 10) legacy = true;

        // Rule B: Old iOS (iOS 12-15 particularly)
        // User explicitly asked for iOS 12.5.7 and 15.8.5
        // iOS 16+ is generally much better at handling modern CSS
        if (iosVersion && iosVersion < 16) legacy = true;

        // Rule C: Low Hardware (Modern browser but weak device)
        if (lowMemory || lowCPU) legacy = true;

        setIsLegacy(legacy);
        
        // Apply class to document body for global CSS targeting
        if (legacy) {
            document.body.classList.add('is-legacy');
        } else {
            document.body.classList.remove('is-legacy');
        }
        
    }, []);

    return { isLegacy };
}
