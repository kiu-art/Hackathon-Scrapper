import React, { useState, useEffect } from "react";
import { useUserStore } from "../../store/useUserStore";

/**
 * ProfileForm
 * ERP-styled metadata editor matching the Mongoose User schema.
 * Handles identity attributes, academic parameters, portfolio URLs, and gender classifications.
 *
 * @param {Object} [initialData] - Optional initial user profile values
 * @param {Function} [onSaveSuccess] - Optional callback triggered after successful update
 */
export const ProfileForm = ({ initialData, onSaveSuccess }) => {
  const { profile, updateProfile, loading } = useUserStore();

  const sourceData = initialData || profile || {};

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    gender: "PREFER_NOT_TO_SAY",
    college: "",
    graduationDate: "",
    githubUrl: "",
    linkedinUrl: "",
  });

  // Keep form in sync when profile or initialData changes
  useEffect(() => {
    if (sourceData) {
      setFormData({
        name: sourceData.name || "",
        email: sourceData.email || "",
        gender: sourceData.gender || "PREFER_NOT_TO_SAY",
        college: sourceData.college || "",
        graduationDate: sourceData.graduationDate
          ? new Date(sourceData.graduationDate).toISOString().split("T")[0]
          : "",
        githubUrl: sourceData.githubUrl || "",
        linkedinUrl: sourceData.linkedinUrl || "",
      });
    }
  }, [sourceData._id, sourceData.email]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = new FormData();
    payload.append("name", formData.name.trim());
    payload.append("gender", formData.gender);
    payload.append("college", formData.college.trim());
    if (formData.graduationDate) {
      payload.append("graduationDate", formData.graduationDate);
    }
    payload.append("githubUrl", formData.githubUrl.trim());
    payload.append("linkedinUrl", formData.linkedinUrl.trim());

    try {
      const updated = await updateProfile(payload);
      if (onSaveSuccess) onSaveSuccess(updated);
    } catch {
      // Toast notification is handled within useUserStore
    }
  };

  const isSaving = loading?.saving;

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-zinc-800 rounded bg-[#0c0c0e] p-5 space-y-5 font-sans text-xs"
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
        <div>
          <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest block">
            MODULE // CANDIDATE METRICS
          </span>
          <h2 className="text-sm font-semibold text-zinc-100 mt-0.5">
            Identity & Portfolio Parameters
          </h2>
        </div>
        <span className="font-mono text-[10px] text-zinc-500 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
          CLERK_SYNCED
        </span>
      </div>

      {/* Section 01: Core Credentials */}
      <div className="space-y-3">
        <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider block">
          01 // Identity Records
        </span>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="name"
              className="block font-mono text-[11px] text-zinc-400 mb-1"
            >
              FULL NAME <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              disabled={isSaving}
              placeholder="Candidate full name"
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-zinc-200 placeholder-zinc-700 font-mono text-xs focus:outline-none focus:border-zinc-600 disabled:opacity-50"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block font-mono text-[11px] text-zinc-400 mb-1"
            >
              EMAIL IDENTIFIER
            </label>
            <input
              type="email"
              id="email"
              name="email"
              disabled
              value={formData.email}
              className="w-full bg-zinc-900 border border-zinc-800/80 rounded px-3 py-1.5 text-zinc-500 font-mono text-xs cursor-not-allowed select-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="gender"
              className="block font-mono text-[11px] text-zinc-400 mb-1"
            >
              GENDER CLASSIFICATION
            </label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              disabled={isSaving}
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-zinc-200 font-mono text-xs focus:outline-none focus:border-zinc-600 disabled:opacity-50"
            >
              <option value="PREFER_NOT_TO_SAY">PREFER NOT TO SAY</option>
              <option value="MALE">MALE</option>
              <option value="FEMALE">FEMALE</option>
              <option value="NON_BINARY">NON-BINARY</option>
              <option value="OTHER">OTHER</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="college"
              className="block font-mono text-[11px] text-zinc-400 mb-1"
            >
              ACADEMIC INSTITUTION
            </label>
            <input
              type="text"
              id="college"
              name="college"
              value={formData.college}
              onChange={handleChange}
              disabled={isSaving}
              placeholder="e.g. IIT Bombay, BITS Pilani"
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-zinc-200 placeholder-zinc-700 font-mono text-xs focus:outline-none focus:border-zinc-600 disabled:opacity-50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="graduationDate"
              className="block font-mono text-[11px] text-zinc-400 mb-1"
            >
              ESTIMATED GRADUATION DATE
            </label>
            <input
              type="date"
              id="graduationDate"
              name="graduationDate"
              value={formData.graduationDate}
              onChange={handleChange}
              disabled={isSaving}
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-zinc-200 font-mono text-xs focus:outline-none focus:border-zinc-600 disabled:opacity-50"
            />
          </div>
        </div>
      </div>

      {/* Section 02: Registry Links */}
      <div className="space-y-3 pt-2 border-t border-zinc-800/80">
        <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider block">
          02 // Social & Repository Endpoints
        </span>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="githubUrl"
              className="block font-mono text-[11px] text-zinc-400 mb-1"
            >
              GITHUB REPOSITORY URL
            </label>
            <input
              type="url"
              id="githubUrl"
              name="githubUrl"
              value={formData.githubUrl}
              onChange={handleChange}
              disabled={isSaving}
              placeholder="https://github.com/username"
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-zinc-200 placeholder-zinc-700 font-mono text-xs focus:outline-none focus:border-zinc-600 disabled:opacity-50"
            />
          </div>

          <div>
            <label
              htmlFor="linkedinUrl"
              className="block font-mono text-[11px] text-zinc-400 mb-1"
            >
              LINKEDIN NETWORK URL
            </label>
            <input
              type="url"
              id="linkedinUrl"
              name="linkedinUrl"
              value={formData.linkedinUrl}
              onChange={handleChange}
              disabled={isSaving}
              placeholder="https://linkedin.com/in/username"
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-zinc-200 placeholder-zinc-700 font-mono text-xs focus:outline-none focus:border-zinc-600 disabled:opacity-50"
            />
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80">
        <span className="font-mono text-[10px] text-zinc-500">
          Updates persist immediately to candidate document.
        </span>

        <button
          type="submit"
          disabled={isSaving}
          className="px-4 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 font-mono text-[11px] font-semibold rounded border border-zinc-200 transition-colors disabled:opacity-50"
        >
          {isSaving ? "PERSISTING PARAMETERS..." : "COMMIT CHANGES"}
        </button>
      </div>
    </form>
  );
};

export default ProfileForm;