import React, { useState, useRef } from "react";
import { useUserStore } from "../../store/useUserStore";
import toast from "react-hot-toast";

/**
 * ResumeUploader
 * Enterprise PDF ingestion component handling drag-and-drop upload,
 * cloud storage synchronization, and 3072-dim vectorization lifecycle states.
 *
 * @param {Function} [onUploadSuccess] - Optional callback triggered after successful indexing
 */
export const ResumeUploader = ({ onUploadSuccess }) => {
  const { profile, updateProfile, loading } = useUserStore();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const isUploading = loading?.saving;
  const currentResumeUrl = profile?.resumeFileUrl;
  const isIndexed = Boolean(currentResumeUrl && profile?.skills?.length);

  const validateAndSetFile = (file) => {
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Invalid format: Only PDF documents are accepted");
      return;
    }

    // 10MB limit check
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size exceeds 10MB limit");
      return;
    }

    setSelectedFile(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("media", selectedFile);

    try {
      const updated = await updateProfile(formData);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (onUploadSuccess) onUploadSuccess(updated);
    } catch {
      // Error toast managed inside useUserStore
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <div className="border border-zinc-800 rounded bg-[#0c0c0e] p-5 space-y-4 font-sans text-xs">
      {/* Module Header */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
        <div>
          <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest block">
            MODULE // INGESTION ENGINE
          </span>
          <h2 className="text-sm font-semibold text-zinc-100 mt-0.5">
            Resume Source & Vector Index
          </h2>
        </div>

        <span
          className={`font-mono text-[10px] px-2 py-0.5 rounded border ${
            isIndexed
              ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/60"
              : currentResumeUrl
              ? "bg-blue-950/60 text-blue-400 border-blue-800/60"
              : "bg-zinc-900 text-zinc-500 border-zinc-800"
          }`}
        >
          {isIndexed ? "INDEX_SYNCED" : currentResumeUrl ? "INDEXING" : "NO_SOURCE"}
        </span>
      </div>

      {/* Current Active Resume Status */}
      {currentResumeUrl && (
        <div className="p-3 bg-zinc-950 border border-zinc-800 rounded flex items-center justify-between font-mono text-[11px]">
          <div className="flex items-center gap-2 truncate max-w-xs sm:max-w-md">
            <span className="text-zinc-500">SOURCE:</span>
            <span className="text-zinc-200 truncate">active_candidate_resume.pdf</span>
          </div>

          <a
            href={currentResumeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 transition-colors whitespace-nowrap ml-2 text-[10px]"
          >
            [VIEW_PDF ↗]
          </a>
        </div>
      )}

      {/* Drag & Drop Target Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border border-dashed rounded p-6 text-center cursor-pointer transition-colors ${
          dragActive
            ? "border-blue-500 bg-blue-950/20"
            : "border-zinc-800 bg-zinc-950/50 hover:bg-zinc-900/40 hover:border-zinc-700"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          disabled={isUploading}
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="space-y-1.5 select-none font-mono">
          <div className="text-zinc-400 text-xs">
            {dragActive ? "DROP FILE TO ATTACH" : "CLICK OR DRAG PDF TO INGEST"}
          </div>
          <div className="text-[10px] text-zinc-600">
            PDF FORMAT ONLY • MAXIMUM ALLOCATED SIZE 10 MB
          </div>
        </div>
      </div>

      {/* Selected File Details / Ingestion Action */}
      {selectedFile && (
        <div className="p-3 bg-zinc-950 border border-zinc-800 rounded space-y-3">
          <div className="flex items-center justify-between font-mono text-[11px]">
            <div className="truncate max-w-xs">
              <span className="text-zinc-500 mr-2">PENDING:</span>
              <span className="text-zinc-200">{selectedFile.name}</span>
              <span className="text-zinc-500 ml-2">({formatFileSize(selectedFile.size)})</span>
            </div>

            <button
              type="button"
              onClick={clearSelectedFile}
              disabled={isUploading}
              className="text-zinc-500 hover:text-zinc-300 text-xs font-mono ml-2 focus:outline-none"
            >
              ✕
            </button>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-zinc-900">
            <span className="font-mono text-[10px] text-zinc-500">
              Target: ImageKit CDN → FastAPI 3072 Embedding
            </span>

            <button
              type="button"
              onClick={handleUpload}
              disabled={isUploading}
              className="px-3 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 font-mono text-[11px] font-semibold rounded border border-zinc-200 transition-colors disabled:opacity-50"
            >
              {isUploading ? "EXTRACTING & VECTORIZING..." : "UPLOAD & INDEX"}
            </button>
          </div>
        </div>
      )}

      {/* Pipeline Information Strip */}
      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-zinc-500 pt-1">
        <div>
          <span>EXTRACTOR: </span>
          <span className="text-zinc-400">GEMINI 2.5 FLASH</span>
        </div>
        <div className="text-right">
          <span>VECTOR DIMS: </span>
          <span className="text-zinc-400">3072 FLOAT32</span>
        </div>
      </div>
    </div>
  );
};

export default ResumeUploader;