import React, { useState, useMemo } from "react";
import { MatchBadge } from "../common/MatchBadge";
import { SkillTag } from "../common/SkillTag";
import { StatusPill } from "../common/StatusPill";

/**
 * HackathonTable
 * High-density ERP tabular view for hackathons with live filtering,
 * multi-attribute sorting, and direct click-through to individual hackathon records.
 *
 * @param {Array} hackathons - Array of hackathon objects matching Mongoose schema
 * @param {Function} onSelectHackathon - Callback invoked when a user clicks a row
 * @param {boolean} [isLoading=false] - Loading state flag
 */
export const HackathonTable = ({
  hackathons = [],
  onSelectHackathon,
  isLoading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [sortBy, setSortBy] = useState("score"); // 'score' | 'deadline' | 'prize'
  const [sortOrder, setSortOrder] = useState("desc"); // 'asc' | 'desc'

  // Extract unique categories across all available records
  const allCategories = useMemo(() => {
    const categoriesSet = new Set();
    hackathons.forEach((h) => {
      (h.categories || []).forEach((c) => categoriesSet.add(c.trim()));
    });
    return ["ALL", ...Array.from(categoriesSet).sort()];
  }, [hackathons]);

  // Filter and sort items in-memory
  const processedHackathons = useMemo(() => {
    return hackathons
      .filter((item) => {
        const matchesSearch =
          item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.organizer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.techStack?.some((t) =>
            t.toLowerCase().includes(searchQuery.toLowerCase())
          );

        const matchesCategory =
          selectedCategory === "ALL" ||
          item.categories?.includes(selectedCategory);

        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        let valueA = 0;
        let valueB = 0;

        if (sortBy === "score") {
          valueA = a.finalScore ?? 0;
          valueB = b.finalScore ?? 0;
        } else if (sortBy === "deadline") {
          valueA = a.currentDeadline ? new Date(a.currentDeadline).getTime() : 0;
          valueB = b.currentDeadline ? new Date(b.currentDeadline).getTime() : 0;
        } else if (sortBy === "prize") {
          valueA = a.prize ?? 0;
          valueB = b.prize ?? 0;
        }

        if (sortOrder === "asc") {
          return valueA > valueB ? 1 : -1;
        }
        return valueA < valueB ? 1 : -1;
      });
  }, [hackathons, searchQuery, selectedCategory, sortBy, sortOrder]);

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const formatPrize = (prize) => {
    if (!prize) return "—";
    return `₹${Number(prize).toLocaleString("en-IN")}`;
  };

  return (
    <div className="space-y-3 font-sans text-xs">
      {/* ERP Filter & Control Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#0c0c0e] border border-zinc-800 rounded">
        {/* Search */}
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <span className="text-zinc-500 font-mono text-[11px]">FILTER:</span>
          <input
            type="text"
            placeholder="Search by title, organizer, tech stack..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-700 font-mono text-xs"
          />
        </div>

        {/* Category Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-zinc-500 font-mono text-[11px]">TRACK:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1 text-zinc-300 focus:outline-none focus:border-zinc-700 font-mono text-xs"
          >
            {allCategories.map((cat, idx) => (
              <option key={idx} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Counter */}
        <div className="text-[11px] font-mono text-zinc-500">
          SHOWING: <span className="text-zinc-200">{processedHackathons.length}</span> /{" "}
          {hackathons.length} RECORDS
        </div>
      </div>

      {/* Main Table */}
      <div className="border border-zinc-800 rounded bg-[#0c0c0e] overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-950 font-mono text-[11px] text-zinc-500 uppercase select-none">
              <th
                onClick={() => toggleSort("score")}
                className="py-2.5 px-4 font-medium cursor-pointer hover:text-zinc-300 w-24"
              >
                Score {sortBy === "score" && (sortOrder === "asc" ? "▲" : "▼")}
              </th>

              <th className="py-2.5 px-4 font-medium min-w-[240px]">
                Hackathon / Organizer
              </th>

              <th
                onClick={() => toggleSort("deadline")}
                className="py-2.5 px-4 font-medium cursor-pointer hover:text-zinc-300 w-36"
              >
                Deadline {sortBy === "deadline" && (sortOrder === "asc" ? "▲" : "▼")}
              </th>

              <th
                onClick={() => toggleSort("prize")}
                className="py-2.5 px-4 font-medium cursor-pointer hover:text-zinc-300 w-28"
              >
                Prize {sortBy === "prize" && (sortOrder === "asc" ? "▲" : "▼")}
              </th>

              <th className="py-2.5 px-4 font-medium">Stack & Alignment</th>

              <th className="py-2.5 px-4 text-right font-medium w-24">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-800/60">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-16 text-center text-zinc-500 font-mono">
                  QUERYING VECTOR CLUSTER & HACKATHON RECORDS...
                </td>
              </tr>
            ) : processedHackathons.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center text-zinc-500 font-mono">
                  NO MATCHING HACKATHONS FOUND
                </td>
              </tr>
            ) : (
              processedHackathons.map((hackathon) => {
                const id = hackathon._id || hackathon.id;
                return (
                  <tr
                    key={id || hackathon.link}
                    onClick={() => onSelectHackathon && onSelectHackathon(hackathon)}
                    className="hover:bg-zinc-900/60 cursor-pointer transition-colors group"
                  >
                    {/* Score / Match Badge */}
                    <td className="py-3 px-4">
                      {hackathon.finalScore !== undefined ? (
                        <MatchBadge score={hackathon.finalScore} />
                      ) : (
                        <span className="font-mono text-zinc-600 text-[11px]">—</span>
                      )}
                    </td>

                    {/* Title & Organizer */}
                    <td className="py-3 px-4">
                      <span className="font-medium text-zinc-200 group-hover:text-blue-400 transition-colors block truncate max-w-sm">
                        {hackathon.title}
                      </span>
                      <span className="text-[11px] font-mono text-zinc-500 block truncate max-w-sm mt-0.5">
                        {hackathon.organizer}
                        {hackathon.location ? ` • ${hackathon.location}` : ""}
                      </span>
                    </td>

                    {/* Deadline & Status */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <StatusPill
                          status={hackathon.status}
                          deadline={hackathon.currentDeadline}
                        />
                        <span className="block font-mono text-[10px] text-zinc-500">
                          {hackathon.currentDeadline
                            ? new Date(hackathon.currentDeadline).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : "NO DEADLINE"}
                        </span>
                      </div>
                    </td>

                    {/* Prize Pool */}
                    <td className="py-3 px-4 font-mono text-[11px] text-emerald-400 font-medium whitespace-nowrap">
                      {formatPrize(hackathon.prize)}
                    </td>

                    {/* Skills & Stack Badges */}
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {/* Show matched skills first if available */}
                        {hackathon.matchedSkills?.slice(0, 3).map((skill, idx) => (
                          <SkillTag key={`matched-${idx}`} skill={skill} variant="matched" />
                        ))}

                        {/* Show missing skills if present */}
                        {hackathon.missingSkills?.slice(0, 2).map((skill, idx) => (
                          <SkillTag key={`missing-${idx}`} skill={skill} variant="missing" />
                        ))}

                        {/* Fallback to raw techStack if no score breakdown exists */}
                        {!hackathon.matchedSkills?.length &&
                          hackathon.techStack?.slice(0, 3).map((tech, idx) => (
                            <SkillTag key={`tech-${idx}`} skill={tech} variant="neutral" />
                          ))}
                      </div>
                    </td>

                    {/* Action Button */}
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectHackathon) onSelectHackathon(hackathon);
                        }}
                        className="px-2.5 py-1 bg-zinc-900 group-hover:bg-zinc-800 text-zinc-300 font-mono text-[11px] rounded border border-zinc-800 group-hover:border-zinc-700 transition-colors"
                      >
                        VIEW →
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HackathonTable;