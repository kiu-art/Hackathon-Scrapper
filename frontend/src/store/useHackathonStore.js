import { create } from "zustand";
import { api } from "../lib/api";
import toast from "react-hot-toast";

/**
 * useHackathonStore
 * Enterprise state store orchestrating hackathon recommendation listings,
 * granular record dossiers, and AI-driven MVP pitch strategy generation.
 */
export const useHackathonStore = create((set, get) => ({
  // Core State
  hackathons: [],
  selectedHackathon: null,
  activePitch: null,

  // Granular Loading States
  loading: {
    list: false,
    hackathon: false,
    pitch: false,
  },

  error: null,

  /**
   * Fetches personalized, vector-ranked hackathon recommendations
   * combining cosine similarity against candidate profile embeddings and BM25 token matching.
   *
   * @param {Object} [params] - Optional query parameters (e.g. limit, category)
   */
  fetchHackathons: async (params = {}) => {
    set((state) => ({
      loading: { ...state.loading, list: true },
      error: null,
    }));

    try {
      // Primary route: /hackathons/matches (with fallback to /hackathons)
      let res;
      try {
        res = await api.get("/hackathons/matches", { params });
      } catch (err) {
        if (err.response?.status === 404) {
          res = await api.get("/hackathons", { params });
        } else {
          throw err;
        }
      }

      const listData = res.data?.data || res.data || [];
      set({ hackathons: Array.isArray(listData) ? listData : [] });
      return listData;
    } catch (err) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Failed to retrieve hackathon recommendations";
      set({ error: errorMsg });
      toast.error(errorMsg);
      return [];
    } finally {
      set((state) => ({
        loading: { ...state.loading, list: false },
      }));
    }
  },

  /**
   * Fetches a specific hackathon record by its MongoDB ID.
   *
   * @param {string} id - Hackathon document ID
   */
  fetchHackathonById: async (id) => {
    if (!id) return null;

    set((state) => ({
      loading: { ...state.loading, hackathon: true },
      error: null,
    }));

    try {
      const res = await api.get(`/hackathons/${id}`);
      const data = res.data?.data || res.data;

      set((state) => {
        // Reset active pitch if switching to a different hackathon record
        const isDifferent =
          state.selectedHackathon &&
          (state.selectedHackathon._id !== id && state.selectedHackathon.id !== id);

        return {
          selectedHackathon: data,
          activePitch: isDifferent ? null : state.activePitch,
        };
      });

      return data;
    } catch (err) {
      const errorMsg =
        err.response?.data?.error || "Failed to load hackathon record";
      set({ error: errorMsg });
      toast.error(errorMsg);
      return null;
    } finally {
      set((state) => ({
        loading: { ...state.loading, hackathon: false },
      }));
    }
  },

  /**
   * Explicitly sets or updates the selected hackathon record in state.
   *
   * @param {Object|null} hackathon - Hackathon record object
   */
  setSelectedHackathon: (hackathon) => {
    const current = get().selectedHackathon;
    const isNew =
      !current ||
      !hackathon ||
      (current._id || current.id) !== (hackathon._id || hackathon.id);

    set({
      selectedHackathon: hackathon,
      activePitch: isNew ? null : get().activePitch,
    });
  },

  /**
   * Triggers the AI pitch generator (Gemini 2.5 Flash via FastAPI microservice)
   * to synthesize an MVP pitch deck, feature scope, and tech stack recommendation.
   *
   * @param {string} hackathonId - Target hackathon record ID
   * @param {string} preferredTrack - Target hackathon track or theme
   */
  generatePitch: async (hackathonId, preferredTrack) => {
    if (!hackathonId) {
      toast.error("Invalid hackathon reference");
      return null;
    }

    set((state) => ({
      loading: { ...state.loading, pitch: true },
      error: null,
    }));

    try {
      const res = await api.post(`/hackathons/${hackathonId}/pitch`, {
        track: preferredTrack,
      });

      const pitchData = res.data?.data || res.data;
      set({ activePitch: pitchData });
      toast.success("MVP Pitch strategy synthesized successfully");
      return pitchData;
    } catch (err) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Failed to synthesize pitch strategy";
      set({ error: errorMsg });
      toast.error(errorMsg);
      throw err;
    } finally {
      set((state) => ({
        loading: { ...state.loading, pitch: false },
      }));
    }
  },

  /**
   * Clears the current active pitch strategy without deselecting the hackathon.
   */
  clearActivePitch: () => set({ activePitch: null }),

  /**
   * Resets selection and active pitch state when returning to the directory index.
   */
  resetSelection: () =>
    set({
      selectedHackathon: null,
      activePitch: null,
      error: null,
    }),
}));

export default useHackathonStore;