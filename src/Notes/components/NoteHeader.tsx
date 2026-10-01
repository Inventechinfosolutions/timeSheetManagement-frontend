import React, { useMemo } from "react";
import { Plus } from "lucide-react";
import { NoteType } from "../types/notes.types";
import { Dropdown, SearchBox } from "../../components/ui";
import type { DropdownOption } from "../../components/ui";

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
  const tabOptions: DropdownOption<NoteType>[] = useMemo(
    () => [
      {
        value: "PROJECT",
        label: "Project Notes",
      },
      {
        value: "PERSONAL",
        label: "Personal Notes",
      },
      {
        value: "ARCHIVED",
        label: "Archived Notes",
      },
    ],
    [],
  );

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
          <Dropdown<NoteType>
            options={tabOptions}
            value={activeTab}
            onChange={(val) => onTabSwitch(val as NoteType)}
            maxLabelWidth="max-w-[140px]"
            buttonClassName="!bg-white !border-slate-200 hover:!bg-slate-50 !py-2 !px-3.5 !text-xs md:!text-sm !font-semibold !text-slate-700 shadow-xs"
            menuClassName="right-0 left-auto w-44"
          />
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
        <SearchBox
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onClear={onClearSearch}
          inputSize="lg"
          containerClassName="w-full max-w-md"
        />
      </div>
    </div>
  );
};

export default NoteHeader;
