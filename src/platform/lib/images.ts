import { API_URL } from "@/platform/lib/api";

// Media lives on the API host; derived from the API URL so this site needs
// no separate NEXT_PUBLIC_BACKEND_URL (still honoured if set).
const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || API_URL).replace(/\/api\/?$/, "");

/**
 * Normalizes an image URL from the backend.
 * If it's already an absolute URL (like Cloudinary), it returns it as is.
 * If it's a relative path, it prefixes it with the backend URL.
 */
export const getImageUrl = (path: string | null | undefined): string => {
    if (!path) return "/image/party.jpg";
    
    // If it's already an absolute URL (Cloudinary or otherwise), return as is
    if (path.startsWith("http://") || path.startsWith("https://")) {
        return path;
    }

    // Normalized path should start with a slash
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;

    // If it's a frontend-local image (fallback or static asset in public/), return it as is.
    if (normalizedPath.startsWith("/image/") || normalizedPath.startsWith("/static/")) {
        return normalizedPath;
    }

    // If using local storage fallback on the backend, ensure it has the /media/ prefix
    let backendPath = normalizedPath;
    if (!backendPath.startsWith("/media/")) {
        backendPath = `/media${backendPath}`;
    }

    return `${BACKEND_URL}${backendPath}`;
};
