import { create } from "zustand";
import { api } from "../lib/api";
import toast from "react-hot-toast";

export const useUserStore = create((set, get) => ({
  profile: null,
  loading: {
    fetching: false,
    saving: false,
  },
  error: null,

  /**
   * Fetches candidate profile, extracted skills, and vector status.
   */
  fetchProfile: async () => {
    set((state) => ({ loading: { ...state.loading, fetching: true }, error: null }));
    try {
      const res = await api.get("/users/profile");
      set({ profile: res.data.data });
      return res.data.data;
    } catch (err) {
      // 404 indicates a brand new user who has not submitted their profile form yet
      if (err.response?.status !== 404) {
        const errorMsg = err.response?.data?.error || "Failed to load user profile";
        set({ error: errorMsg });
        toast.error(errorMsg);
      }
      return null;
    } finally {
      set((state) => ({ loading: { ...state.loading, fetching: false } }));
    }
  },

  /**
   * Updates user metadata and handles resume re-upload with automatic re-vectorization.
   *
   * @param {FormData} formData - Contains text fields and optional PDF resume file
   */
  updateProfile: async (formData) => {
    set((state) => ({ loading: { ...state.loading, saving: true }, error: null }));
    try {
      const res = await api.put("/users/profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      set({ profile: res.data.data });
      toast.success("Profile & vector parameters updated");
      return res.data.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Failed to update profile";
      set({ error: errorMsg });
      toast.error(errorMsg);
      throw err;
    } finally {
      set((state) => ({ loading: { ...state.loading, saving: false } }));
    }
  },

  /**
   * Resets local user state on sign out.
   */
  resetProfile: () => set({ profile: null, error: null }),
}));

export default useUserStore;