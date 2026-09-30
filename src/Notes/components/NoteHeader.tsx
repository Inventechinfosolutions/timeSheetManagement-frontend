import React from "react";
import { Plus, ChevronDown, Search, X } from "lucide-react";
import { NoteType } from "../types/notes.types";

interface NoteHeaderProps {
  activeTab: NoteType;
  searchQuery: string;
  onTabSwitch: (tab: NoteType) => void;
  onSearchChange: (val: string) => void;
  onClearSearch: () => void;
  onCreateProjectNote: () => void;
  onCreatePersonalNote: () => void;
}

export const NoteHeader: React.FC<NoteHeaderProps> = ({
  activeTab,
  searchQuery,
  onTabSwitch,
  onSearchChange,
  onClearSearch,
  onCreateProjectNote,
  onCreatePersonalNote,
}) => {
  const isProjectNotesTab = activeTab === "PROJECT";

  return (
    <div className="flex flex-col gap-4">
      {/* Top Header: Title & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl md:text-3xl font-bold text-[#1B2559] tracking-tight">
            {activeTab === "PROJECT" ? "Project Notes" : activeTab === "PERSONAL" ? "Personal Notes" : "Archived Notes"}
          </h1>
          {activeTab === "ARCHIVED" && (
            <span className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold rounded-lg">
              Archived
            </span>
          )}
        </div>

        {/* Top-Right Action Buttons & Dropdown Filter */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onCreateProjectNote}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#4318FF] hover:bg-[#320fe0] text-white font-semibold text-xs md:text-sm rounded-xl shadow-md shadow-[#4318FF]/20 hover:shadow-lg transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Project Note</span>
          </button>

          <button
            onClick={onCreatePersonalNote}
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-[#4318FF] hover:bg-indigo-50 text-[#4318FF] font-semibold text-xs md:text-sm rounded-xl shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Personal Note</span>
          </button>

          {/* Filter Dropdown */}
          <div className="relative">
            <select
              value={activeTab}
              onChange={(e) => onTabSwitch(e.target.value as NoteType)}
              className="px-4 py-2 pr-9 bg-white border border-slate-200 rounded-xl text-xs md:text-sm font-semibold text-slate-700 outline-none focus:ring-1 focus:ring-[#4318FF] transition cursor-pointer appearance-none shadow-xs"
            >
              <option value="PROJECT">Project Notes</option>
              <option value="PERSONAL">Personal Notes</option>
              <option value="ARCHIVED">Archived Notes</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search notes..."
            className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-700 outline-none focus:bg-white focus:ring-1 focus:ring-[#4318FF] transition placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={onClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NoteHeader;
