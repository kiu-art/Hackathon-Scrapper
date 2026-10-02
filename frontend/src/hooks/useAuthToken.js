import { useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { api } from "../lib/api";

/**
 * useAuthToken
 * Synchronizes Clerk authentication session tokens with the centralized Axios instance.
 * Automatically attaches and manages request interceptors to inject the active JWT Bearer token,
 * with cleanup handling to prevent duplicate interceptors.
 *
 * @returns {Object} { getToken, isSignedIn, isLoaded }
 */
export const useAuthToken = () => {
  const { getToken, isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;

    // Attach request interceptor to inject Bearer token dynamically
    const interceptorId = api.interceptors.request.use(
      async (config) => {
        if (isSignedIn) {
          try {
            const token = await getToken();
            if (token) {
              config.headers.Authorization = `Bearer ${token}`;
            }
          } catch (error) {
            console.error("[useAuthToken] Failed to retrieve Clerk session token:", error);
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Eject interceptor on dependency update or unmount to avoid memory leaks
    return () => {
      api.interceptors.request.eject(interceptorId);
    };
  }, [getToken, isSignedIn, isLoaded]);

  return { getToken, isSignedIn, isLoaded };
};

export default useAuthToken;