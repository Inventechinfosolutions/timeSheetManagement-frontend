import { useEffect, useMemo, useState, useRef, Fragment } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Plus,
  Trash2,
  Search,
  FileText,
  Pencil,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  Check,
  Loader2,
  AlertCircle,
  Paperclip,
  UploadCloud,
  File,
  Download,
  Eye,
  Minus,
  Copy,
  Maximize2,
  Minimize2,
  WrapText,
  Calendar,
  User,
  Table as TableIcon,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  ArrowLeft,
  Highlighter,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../hooks";
import { Storage } from "../utils/storage-util";
import { EmployeeNotesMobile } from "./Employeenotesmobile";
import {
  fetchEmployeeNotes,
  fetchEmployeeNote,
  createEmployeeNote,
  updateEmployeeNote,
  deleteEmployeeNote,
  exportEmployeeNote,
  uploadEmployeeNoteFile,
  downloadEmployeeNoteFile,
  previewEmployeeNoteFile,
  deleteEmployeeNoteFile,
} from "../reducers/employeeNote.reducer";
import jsPDF from "jspdf";
import LogoTop from "../assets/logo_top.png";
import LogoBottom from "../assets/logo_bottom.png";
import "../components/ApiLoadingSpinner.css";
import type {
  NoteCategory,
  NoteFile,
  EmployeeNote,
  RichTextEditorProps,
  NoteModalMode,
  NoteActionType,
  NoteToastMessage,
  NoteFormErrors,
  RowModalErrors,
} from "./Employeenotes.types";
import {
  DEFAULT_ITEMS_PER_PAGE,
  FILE_SIZE_LIMIT,
  ALLOWED_FILE_ACCEPT,
  isAllowedNoteFile,
  PRESET_COLORS,
} from "./Employeenotes.types";
import {
  NoteCategoryEnum,
  NoteType,
  NoteFilter,
  EntityType,
  ReferenceType,
} from "./Employeenotes.enums";
import "./Employeenotes.css";

const isChildNote = (n: Pick<EmployeeNote, "type" | "parentNoteId">): boolean =>
  n.type === NoteType.CHILD ||
  (n.parentNoteId != null && String(n.parentNoteId) !== "");

const resolveNoteType = (parentNoteId?: number | string | null): NoteType =>
  parentNoteId != null && String(parentNoteId) !== "" && Number(parentNoteId) > 0
    ? NoteType.CHILD
    : NoteType.PARENT;

const sameNoteId = (
  a?: string | number | null,
  b?: string | number | null
): boolean => a != null && b != null && String(a) === String(b);

const toNumericNoteId = (value?: string | number | null): number => {
  if (value == null || value === "") return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const toParentNoteId = (value?: string | number | null): number | null => {
  const parsed = toNumericNoteId(value);
  return parsed > 0 ? parsed : null;
};

const toNoteFilePayload = (files: NoteFile[]): string[] =>
  files
    .filter((f) => !f.uploading)
    .map((f) => f.s3Key || f.id)
    .filter(
      (key): key is string =>
        !!key &&
        !String(key).startsWith("temp-") &&
        !String(key).startsWith("note-")
    );

const isProjectCategory = (n: Pick<EmployeeNote, "category" | "projectName">): boolean =>
  n.category === NoteCategoryEnum.PROJECT_NOTE ||
  (n.category !== NoteCategoryEnum.PERSONAL_NOTE && Boolean(n.projectName?.trim()));

const isPersonalCategory = (n: Pick<EmployeeNote, "category" | "projectName">): boolean =>
  !isProjectCategory(n);

const normalizeNote = (n: EmployeeNote): EmployeeNote => ({
  ...n,
  category: isProjectCategory(n)
    ? NoteCategoryEnum.PROJECT_NOTE
    : NoteCategoryEnum.PERSONAL_NOTE,
  parentNoteId: n.parentNoteId ?? null,
  type: n.type || resolveNoteType(n.parentNoteId),
});

const escapeHtml = (text: string): string => {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const isDescriptionEmpty = (html?: string): boolean => {
  if (!html) return true;
  const stripped = html.replace(/<[^>]*>/g, "").replace(/&nbsp;/gi, " ").trim();
  if (stripped.length > 0) return false;
  return !/<(img|table|iframe|video|audio)\b/i.test(html);
};

const isColorMatch = (c1?: string | null, c2?: string | null): boolean => {
  if (!c1 || !c2) return false;
  const s1 = c1.trim().toLowerCase();
  const s2 = c2.trim().toLowerCase();
  if (s1 === s2) return true;

  const toRgb = (hexOrRgb: string) => {
    if (hexOrRgb.startsWith("#")) {
      const clean = hexOrRgb.replace("#", "");
      if (clean.length === 6) {
        const r = parseInt(clean.substring(0, 2), 16);
        const g = parseInt(clean.substring(2, 4), 16);
        const b = parseInt(clean.substring(4, 6), 16);
        return `rgb(${r}, ${g}, ${b})`;
      }
    }
    return hexOrRgb.replace(/\s+/g, ", ").replace(/,\s+/g, ", ");
  };

  return toRgb(s1) === toRgb(s2);
};

/*
 * RICH TEXT / HTML EDITOR COMPONENT
 * Provides rich text formatting (Bold, Italic, Underline, Strikethrough,
 * Headings, Lists, Quotes, Code, Highlight, Clear, Undo/Redo) with full-width
 * spacious typing area.
 */
const RichTextEditor = ({
  initialValue,
  onChange,
  placeholder,
  minHeight = "380px",
}: RichTextEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [currentColor, setCurrentColor] = useState("#4318FF");
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const savedSelectionRef = useRef<Range | null>(null);

  // Sync initial content once or on note switch
  useEffect(() => {
    if (editorRef.current) {
      if (editorRef.current.innerHTML !== (initialValue || "")) {
        editorRef.current.innerHTML = initialValue || "";
      }
    }
  }, [initialValue]);

  // Close color picker on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        colorPickerRef.current &&
        !colorPickerRef.current.contains(e.target as Node)
      ) {
        setIsColorPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedSelectionRef.current = sel.getRangeAt(0);
    }
  };

  const restoreSelection = () => {
    if (savedSelectionRef.current) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedSelectionRef.current);
      }
    }
  };

  // Active formatting state tracking
  const [activeHeading, setActiveHeading] = useState<"h1" | "h2" | "p">("p");
  const [activeColor, setActiveColor] = useState<string | null>(null);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrike, setIsStrike] = useState(false);
  const [isList, setIsList] = useState(false);
  const [isOrderedList, setIsOrderedList] = useState(false);
  const [isBlockquoteActive, setIsBlockquoteActive] = useState(false);

  const checkEditorState = () => {
    if (!editorRef.current) return;
    try {
      setIsBold(document.queryCommandState("bold"));
      setIsItalic(document.queryCommandState("italic"));
      setIsUnderline(document.queryCommandState("underline"));
      setIsStrike(document.queryCommandState("strikeThrough"));
      setIsList(document.queryCommandState("insertUnorderedList"));
      setIsOrderedList(document.queryCommandState("insertOrderedList"));
    } catch {
      // ignore
    }

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current) {
      let node: Node | null = sel.getRangeAt(0).commonAncestorContainer;
      let heading: "h1" | "h2" | "p" = "p";
      let inBq = false;
      let bgCol: string | null = null;

      while (node && node !== editorRef.current) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as HTMLElement;
          const tag = el.tagName.toLowerCase();
          if (tag === "h1") heading = "h1";
          else if (tag === "h2") heading = "h2";
          else if (tag === "blockquote") inBq = true;

          if (!bgCol) {
            const bg = el.style.backgroundColor || el.getAttribute("bgcolor");
            if (bg && bg !== "transparent" && bg !== "rgba(0, 0, 0, 0)") {
              bgCol = bg;
            }
          }
        }
        node = node.parentNode;
      }

      setActiveHeading(heading);
      setIsBlockquoteActive(inBq);
      setActiveColor(bgCol);
    }
  };

  const execute = (command: string, arg?: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, arg);
    onChange(editorRef.current.innerHTML);
    setTimeout(checkEditorState, 20);
  };

  // Toggle heading 1 or 2 on/off (select & unselect)
  const toggleHeading = (target: "h1" | "h2") => {
    if (!editorRef.current) return;
    editorRef.current.focus();

    const sel = window.getSelection();
    let isCurrentlyTarget = false;
    if (sel && sel.rangeCount > 0) {
      let node: Node | null = sel.getRangeAt(0).commonAncestorContainer;
      while (node && node !== editorRef.current) {
        if (
          node.nodeType === Node.ELEMENT_NODE &&
          (node as HTMLElement).tagName.toLowerCase() === target
        ) {
          isCurrentlyTarget = true;
          break;
        }
        node = node.parentNode;
      }
    }

    if (isCurrentlyTarget || activeHeading === target) {
      // UNSELECT: already this heading, convert back to normal paragraph
      document.execCommand("formatBlock", false, "<p>");
      setActiveHeading("p");
    } else {
      // SELECT: apply target heading
      document.execCommand("formatBlock", false, `<${target}>`);
      setActiveHeading(target);
    }

    onChange(editorRef.current.innerHTML);
    setTimeout(checkEditorState, 20);
  };

  const toggleNormal = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand("formatBlock", false, "<p>");
    setActiveHeading("p");
    onChange(editorRef.current.innerHTML);
    setTimeout(checkEditorState, 20);
  };

  // Toggle blockquote on/off and prevent/remove multiple nested blockquotes
  const toggleBlockquote = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);

    // 1. Check if selection is within an existing blockquote -> unwrap it (unselect)
    let node: Node | null = range.commonAncestorContainer;
    let bq: HTMLElement | null = null;
    while (node && node !== editorRef.current) {
      if (
        node.nodeType === Node.ELEMENT_NODE &&
        (node as HTMLElement).tagName.toLowerCase() === "blockquote"
      ) {
        bq = node as HTMLElement;
        break;
      }
      node = node.parentNode;
    }

    if (bq && editorRef.current.contains(bq)) {
      const parent = bq.parentNode;
      if (parent) {
        const frag = document.createDocumentFragment();
        while (bq.firstChild) {
          frag.appendChild(bq.firstChild);
        }
        parent.replaceChild(frag, bq);
      }
      setIsBlockquoteActive(false);
      onChange(editorRef.current.innerHTML);
      setTimeout(checkEditorState, 20);
      return;
    }

    // 2. Check if selection spans across any blockquote(s) -> unwrap them (removes multiple selection quotes)
    const internalBqs = Array.from(editorRef.current.querySelectorAll("blockquote"));
    let anyUnwrapped = false;
    internalBqs.forEach((existingBq) => {
      try {
        if (range.intersectsNode(existingBq)) {
          anyUnwrapped = true;
          const parent = existingBq.parentNode;
          if (parent) {
            const frag = document.createDocumentFragment();
            while (existingBq.firstChild) {
              frag.appendChild(existingBq.firstChild);
            }
            parent.replaceChild(frag, existingBq);
          }
        }
      } catch {
        // ignore
      }
    });

    if (anyUnwrapped) {
      setIsBlockquoteActive(false);
      onChange(editorRef.current.innerHTML);
      setTimeout(checkEditorState, 20);
      return;
    }

    // 3. Otherwise apply blockquote
    document.execCommand("formatBlock", false, "<blockquote>");

    // Clean up any nested blockquotes (blockquote inside blockquote)
    const nestedBqs = Array.from(
      editorRef.current.querySelectorAll("blockquote blockquote")
    );
    nestedBqs.forEach((nbq) => {
      const p = nbq.parentNode;
      if (p) {
        while (nbq.firstChild) {
          p.insertBefore(nbq.firstChild, nbq);
        }
        p.removeChild(nbq);
      }
    });

    setIsBlockquoteActive(true);
    onChange(editorRef.current.innerHTML);
    setTimeout(checkEditorState, 20);
  };

  // Apply color with select & unselect (toggle) functionality
  const applyColor = (colorHex: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    restoreSelection();

    // Check if the current selection already has this color highlight applied
    let alreadyHasColor = false;
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      let node: Node | null = sel.getRangeAt(0).commonAncestorContainer;
      while (node && node !== editorRef.current) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const bg = (node as HTMLElement).style.backgroundColor;
          if (isColorMatch(bg, colorHex)) {
            alreadyHasColor = true;
            break;
          }
        }
        node = node.parentNode;
      }
    }

    if (alreadyHasColor || isColorMatch(activeColor, colorHex)) {
      // UNSELECT: already applied -> clear background highlight
      if (!document.execCommand("hiliteColor", false, "transparent")) {
        document.execCommand("backColor", false, "transparent");
      }
      setActiveColor(null);
    } else {
      // SELECT: apply background highlight
      if (!document.execCommand("hiliteColor", false, colorHex)) {
        document.execCommand("backColor", false, colorHex);
      }
      setCurrentColor(colorHex);
      setActiveColor(colorHex);
    }

    onChange(editorRef.current.innerHTML);
    setTimeout(checkEditorState, 20);
  };

  const clearColor = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    restoreSelection();
    if (!document.execCommand("hiliteColor", false, "transparent")) {
      document.execCommand("backColor", false, "transparent");
    }
    setActiveColor(null);
    onChange(editorRef.current.innerHTML);
    setTimeout(checkEditorState, 20);
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const text = e.clipboardData.getData("text/plain");
    if (!text) return;

    // Check if the pasted text has bullet characters or numbered list prefixes
    const lines = text.split(/\r?\n/);
    const hasBulletOrListLines = lines.some((line) =>
      /^\s*([•●○▪■◆–—⁃∙·\uf0b7\-\*]|\d+[\.\)])\s+/.test(line)
    );

    if (hasBulletOrListLines) {
      e.preventDefault();
      let html = "";
      let inUl = false;
      let inOl = false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        if (!trimmed) {
          if (inUl) {
            html += "</ul>";
            inUl = false;
          }
          if (inOl) {
            html += "</ol>";
            inOl = false;
          }
          continue;
        }

        const ulMatch = line.match(/^\s*[•●○▪■◆–—⁃∙·\uf0b7\-\*]\s+(.*)$/);
        const olMatch = line.match(/^\s*\d+[\.\)]\s+(.*)$/);

        if (ulMatch) {
          if (inOl) {
            html += "</ol>";
            inOl = false;
          }
          if (!inUl) {
            html += "<ul>";
            inUl = true;
          }
          html += `<li>${escapeHtml(ulMatch[1])}</li>`;
        } else if (olMatch) {
          if (inUl) {
            html += "</ul>";
            inUl = false;
          }
          if (!inOl) {
            html += "<ol>";
            inOl = true;
          }
          html += `<li>${escapeHtml(olMatch[1])}</li>`;
        } else {
          if (inUl) {
            html += "</ul>";
            inUl = false;
          }
          if (inOl) {
            html += "</ol>";
            inOl = false;
          }
          html += `<p>${escapeHtml(line)}</p>`;
        }
      }

      if (inUl) html += "</ul>";
      if (inOl) html += "</ol>";

      document.execCommand("insertHTML", false, html);
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
      }
    }
  };

  return (
    <div
      style={{ resize: "vertical", minHeight }}
      className={`rounded-2xl border transition-all overflow-hidden bg-white resize-y flex flex-col ${isFocused
          ? "border-[#4318FF] ring-2 ring-[#4318FF]/15 shadow-sm"
          : "border-gray-200"
        }`}
    >
      {/* Rich Text Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-1.5 px-2 bg-gray-50/90 border-b border-gray-200 text-slate-700 select-none">
        {/* Bold */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            execute("bold");
          }}
          className={`p-1 rounded-lg transition-colors font-bold text-xs w-7 h-7 flex items-center justify-center cursor-pointer ${
            isBold
              ? "bg-[#4318FF]/15 text-[#4318FF] ring-1 ring-[#4318FF]/30 font-bold shadow-2xs"
              : "hover:bg-white hover:text-[#4318FF] hover:shadow-2xs text-slate-700"
          }`}
          title={isBold ? "Bold (click to unselect)" : "Bold (Ctrl+B)"}
        >
          <Bold size={14} />
        </button>

        {/* Italic */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            execute("italic");
          }}
          className={`p-1 rounded-lg transition-colors italic text-xs w-7 h-7 flex items-center justify-center cursor-pointer ${
            isItalic
              ? "bg-[#4318FF]/15 text-[#4318FF] ring-1 ring-[#4318FF]/30 font-bold shadow-2xs"
              : "hover:bg-white hover:text-[#4318FF] hover:shadow-2xs text-slate-700"
          }`}
          title={isItalic ? "Italic (click to unselect)" : "Italic (Ctrl+I)"}
        >
          <Italic size={14} />
        </button>

        {/* Underline */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            execute("underline");
          }}
          className={`p-1 rounded-lg transition-colors underline text-xs w-7 h-7 flex items-center justify-center cursor-pointer ${
            isUnderline
              ? "bg-[#4318FF]/15 text-[#4318FF] ring-1 ring-[#4318FF]/30 font-bold shadow-2xs"
              : "hover:bg-white hover:text-[#4318FF] hover:shadow-2xs text-slate-700"
          }`}
          title={isUnderline ? "Underline (click to unselect)" : "Underline (Ctrl+U)"}
        >
          <Underline size={14} />
        </button>

        {/* Strikethrough */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            execute("strikeThrough");
          }}
          className={`p-1 rounded-lg transition-colors line-through text-xs w-7 h-7 flex items-center justify-center cursor-pointer ${
            isStrike
              ? "bg-[#4318FF]/15 text-[#4318FF] ring-1 ring-[#4318FF]/30 font-bold shadow-2xs"
              : "hover:bg-white hover:text-[#4318FF] hover:shadow-2xs text-slate-700"
          }`}
          title={isStrike ? "Strikethrough (click to unselect)" : "Strikethrough"}
        >
          <Strikethrough size={14} />
        </button>

        <div className="w-px h-4 bg-gray-200 mx-1" />

        {/* Heading 1 — select & unselect */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            toggleHeading("h1");
          }}
          className={`px-1.5 py-0.5 rounded-lg transition-colors font-bold text-[11px] h-7 flex items-center justify-center cursor-pointer ${
            activeHeading === "h1"
              ? "bg-[#4318FF]/15 text-[#4318FF] ring-1 ring-[#4318FF]/30 font-bold shadow-2xs"
              : "hover:bg-white hover:text-[#4318FF] hover:shadow-2xs text-slate-700"
          }`}
          title={activeHeading === "h1" ? "Heading 1 (click to unselect)" : "Heading 1"}
        >
          <Heading1 size={14} />
        </button>

        {/* Heading 2 — select & unselect */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            toggleHeading("h2");
          }}
          className={`px-1.5 py-0.5 rounded-lg transition-colors font-bold text-[11px] h-7 flex items-center justify-center cursor-pointer ${
            activeHeading === "h2"
              ? "bg-[#4318FF]/15 text-[#4318FF] ring-1 ring-[#4318FF]/30 font-bold shadow-2xs"
              : "hover:bg-white hover:text-[#4318FF] hover:shadow-2xs text-slate-700"
          }`}
          title={activeHeading === "h2" ? "Heading 2 (click to unselect)" : "Heading 2"}
        >
          <Heading2 size={14} />
        </button>

        {/* Normal Text — select / reset to paragraph */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            toggleNormal();
          }}
          className={`px-1.5 py-0.5 rounded-lg transition-colors text-[11px] font-semibold h-7 flex items-center justify-center cursor-pointer ${
            activeHeading === "p" && !isBlockquoteActive
              ? "bg-[#4318FF]/15 text-[#4318FF] ring-1 ring-[#4318FF]/30 font-bold shadow-2xs"
              : "hover:bg-white hover:text-[#4318FF] hover:shadow-2xs text-slate-600"
          }`}
          title="Normal Text (Paragraph)"
        >
          Normal
        </button>

        <div className="w-px h-4 bg-gray-200 mx-1" />

        {/* Bullet List — select & unselect */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            execute("insertUnorderedList");
          }}
          className={`p-1 rounded-lg transition-colors text-xs w-7 h-7 flex items-center justify-center cursor-pointer ${
            isList
              ? "bg-[#4318FF]/15 text-[#4318FF] ring-1 ring-[#4318FF]/30 font-bold shadow-2xs"
              : "hover:bg-white hover:text-[#4318FF] hover:shadow-2xs text-slate-700"
          }`}
          title={isList ? "Bullet List (click to unselect)" : "Bullet List"}
        >
          <List size={14} />
        </button>

        {/* Numbered List — select & unselect */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            execute("insertOrderedList");
          }}
          className={`p-1 rounded-lg transition-colors text-xs w-7 h-7 flex items-center justify-center cursor-pointer ${
            isOrderedList
              ? "bg-[#4318FF]/15 text-[#4318FF] ring-1 ring-[#4318FF]/30 font-bold shadow-2xs"
              : "hover:bg-white hover:text-[#4318FF] hover:shadow-2xs text-slate-700"
          }`}
          title={isOrderedList ? "Numbered List (click to unselect)" : "Numbered List"}
        >
          <ListOrdered size={14} />
        </button>

        {/* Blockquote — toggles on/off and unselects cleanly */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            toggleBlockquote();
          }}
          className={`p-1 rounded-lg transition-colors text-xs w-7 h-7 flex items-center justify-center cursor-pointer ${
            isBlockquoteActive
              ? "bg-[#4318FF]/15 text-[#4318FF] font-bold ring-1 ring-[#4318FF]/30 shadow-2xs"
              : "hover:bg-white hover:text-[#4318FF] hover:shadow-2xs text-slate-700"
          }`}
          title={isBlockquoteActive ? "Quote (click to unselect)" : "Quote"}
        >
          <Quote size={14} />
        </button>

        <div className="w-px h-4 bg-gray-200 mx-1" />

        {/* Highlight Color Picker (Background) — select & unselect */}
        <div className="relative" ref={colorPickerRef}>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              saveSelection();
              setIsColorPickerOpen((prev) => !prev);
            }}
            className={`p-1 rounded-lg transition-colors text-xs w-7 h-7 flex flex-col items-center justify-center cursor-pointer relative ${
              isColorPickerOpen || activeColor
                ? "bg-[#4318FF]/15 text-[#4318FF] ring-1 ring-[#4318FF]/30 shadow-2xs font-bold"
                : "hover:bg-white hover:text-[#4318FF] hover:shadow-2xs text-slate-700"
            }`}
            title="Highlight Color (Click to select/unselect highlight)"
          >
            <Highlighter size={13} />
            <span
              className="w-3.5 h-[2.5px] rounded-full mt-[1px]"
              style={{ backgroundColor: activeColor || currentColor }}
            />
          </button>

          {isColorPickerOpen && (
            <div
              className="absolute left-0 top-full mt-1 z-30 bg-white border border-gray-200 rounded-xl shadow-lg p-2.5 w-52 space-y-2 animate-fadeIn"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Highlight Color
                </span>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    clearColor();
                    setIsColorPickerOpen(false);
                  }}
                  className="text-[10px] font-bold text-slate-500 hover:text-red-600 cursor-pointer bg-slate-100 hover:bg-red-50 px-1.5 py-0.5 rounded transition-colors"
                >
                  Unselect / Clear
                </button>
              </div>

              {/* Preset Swatches */}
              <div className="grid grid-cols-6 gap-1.5">
                {PRESET_COLORS.map((c) => {
                  const isSelected = isColorMatch(c.value, activeColor);
                  return (
                    <button
                      key={c.value}
                      type="button"
                      title={isSelected ? `${c.label} (click to unselect)` : c.label}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        applyColor(c.value);
                        setIsColorPickerOpen(false);
                      }}
                      style={{ backgroundColor: c.value }}
                      className={`w-6 h-6 rounded-md transition-transform hover:scale-110 cursor-pointer border relative flex items-center justify-center ${
                        isSelected
                          ? "ring-2 ring-[#4318FF] ring-offset-1 border-transparent shadow-2xs scale-105"
                          : "border-gray-200/80"
                      }`}
                    >
                      {isSelected && (
                        <Check size={12} className="text-slate-800 stroke-[3]" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Custom Color Input */}
              <div className="pt-1.5 border-t border-gray-100 flex items-center gap-2">
                <label className="text-[11px] font-semibold text-slate-600 flex-1 cursor-pointer">
                  Custom:
                </label>
                <input
                  type="color"
                  value={currentColor}
                  onChange={(e) => {
                    applyColor(e.target.value);
                  }}
                  className="w-7 h-7 rounded-lg border border-gray-200 cursor-pointer p-0.5 bg-transparent"
                  title="Pick custom color"
                />
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Editable Content Area - Substantially larger and clear for long notes */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onPaste={handlePaste}
        onKeyUp={checkEditorState}
        onMouseUp={checkEditorState}
        onSelect={checkEditorState}
        onFocus={() => {
          setIsFocused(true);
          checkEditorState();
        }}
        onBlur={() => {
          setIsFocused(false);
          handleInput();
        }}
        data-placeholder={
          placeholder ||
          "Write your notes, key updates, documentation, or action items here..."
        }
        className="notes-rich-editor-content custom-scrollbar flex-1"
        style={{ minHeight: "330px" }}
      />
    </div>
  );
};



const formatDateTime = (iso?: string) => {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  const datePart = d.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
  const timePart = d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return `${datePart} at ${timePart}`;
};

const formatDateOnly = (iso?: string) => {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

const formatFileSize = (bytes: number) => {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Capitalizes just the first character of a display name (e.g. "alex" -> "Alex")
// without affecting the rest of the string's casing.
const capitalizeFirst = (str?: string) => {
  if (!str) return str || "";
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// File extensions we know are plain text / source code, so we can decode and
// show their actual contents in the preview modal instead of a generic
// "can't preview this file" placeholder.
const TEXT_PREVIEW_EXTENSIONS = [
  "txt", "md", "markdown", "csv", "tsv", "json", "js", "jsx", "ts", "tsx",
  "css", "scss", "less", "html", "htm", "xml", "yml", "yaml", "py", "java",
  "c", "cpp", "h", "hpp", "cs", "sh", "bash", "sql", "log", "env", "ini",
  "conf", "gitignore", "toml",
];

const MAX_TEXT_PREVIEW_CHARS = 500000;

const isTextPreviewable = (file: NoteFile) => {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  if (TEXT_PREVIEW_EXTENSIONS.includes(ext)) return true;
  if (file.type?.startsWith("text/")) return true;
  if (file.type === "application/json") return true;
  return false;
};

const isCsvFile = (fileName?: string) => {
  return (fileName || "").toLowerCase().endsWith(".csv");
};

const parseCsvRows = (text: string): string[][] => {
  const lines = text.split(/\r\n|\r|\n/).filter((l) => l.trim().length > 0);
  return lines.map((line) => {
    const row: string[] = [];
    let curr = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        row.push(curr.trim());
        curr = "";
      } else {
        curr += ch;
      }
    }
    row.push(curr.trim());
    return row;
  });
};

const stripHtmlTags = (html?: string) => {
  if (!html) return "";
  return html.replace(/<[^>]*>?/gm, "").trim();
};

const htmlToPlainText = (html?: string): string => {
  if (!html) return "";
  try {
    const temp = document.createElement("div");
    temp.innerHTML = html;

    const lines: string[] = [];

    const walkNode = (node: Node, listType: "ul" | "ol" | null, listIndex: { n: number }) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || "";
        if (text.trim()) {
          // Append to the last line if inside a block element that already started a line
          if (lines.length > 0 && lines[lines.length - 1] !== "") {
            lines[lines.length - 1] += text;
          } else {
            lines.push(text);
          }
        }
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      const el = node as Element;
      const tag = el.tagName.toLowerCase();

      if (tag === "ul" || tag === "ol") {
        const newListType = tag as "ul" | "ol";
        const counter = { n: 0 };
        el.childNodes.forEach((child) => walkNode(child, newListType, counter));
        return;
      }

      if (tag === "li") {
        listIndex.n += 1;
        const prefix = listType === "ol" ? `${listIndex.n}. ` : "• ";
        // Collect all text inside this li
        const liTemp = document.createElement("div");
        liTemp.innerHTML = (el as HTMLElement).innerHTML;
        const liText = (liTemp.innerText || liTemp.textContent || "").replace(/\n/g, " ").trim();
        if (liText) {
          lines.push(`${prefix}${liText}`);
        }
        return;
      }

      // Block-level elements that start a new line
      const isBlock = [
        "p", "div", "h1", "h2", "h3", "h4", "h5", "h6",
        "blockquote", "pre", "br",
      ].includes(tag);

      if (tag === "br") {
        lines.push("");
        return;
      }

      if (isBlock) {
        // Ensure previous block is separated
        if (lines.length > 0 && lines[lines.length - 1] !== "") {
          lines.push("");
        }
        const innerTemp = document.createElement("div");
        // Only collect direct text/inline children (not nested blocks/lists)
        el.childNodes.forEach((child) => {
          if (child.nodeType === Node.TEXT_NODE) {
            innerTemp.appendChild(child.cloneNode(true));
          } else if (child.nodeType === Node.ELEMENT_NODE) {
            const childTag = (child as Element).tagName.toLowerCase();
            if (!["ul", "ol", "li", "p", "div", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "pre"].includes(childTag)) {
              innerTemp.appendChild(child.cloneNode(true));
            }
          }
        });
        const blockText = (innerTemp.innerText || innerTemp.textContent || "").trim();
        if (blockText) {
          lines.push(blockText);
          lines.push("");
        }
        // Now walk nested block/list children
        el.childNodes.forEach((child) => {
          if (child.nodeType === Node.ELEMENT_NODE) {
            const childTag = (child as Element).tagName.toLowerCase();
            if (["ul", "ol", "p", "div", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "pre"].includes(childTag)) {
              walkNode(child, null, { n: 0 });
            }
          }
        });
        return;
      }

      // Inline elements — just walk children
      el.childNodes.forEach((child) => walkNode(child, listType, listIndex));
    };

    temp.childNodes.forEach((child) => walkNode(child, null, { n: 0 }));

    // Clean up: collapse multiple consecutive blank lines, trim leading/trailing blank lines
    const result = lines
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    return result;
  } catch {
    return stripHtmlTags(html);
  }
};

const getFileIcon = (fileName: string) => {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  if (["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(ext)) {
    return <FileText className="text-purple-500 shrink-0" size={14} />;
  }
  if (ext === "pdf") {
    return <FileText className="text-red-500 shrink-0" size={14} />;
  }
  if (["doc", "docx"].includes(ext)) {
    return <FileText className="text-blue-500 shrink-0" size={14} />;
  }
  if (["xls", "xlsx", "csv"].includes(ext)) {
    return <FileText className="text-emerald-500 shrink-0" size={14} />;
  }
  return <File className="text-gray-500 shrink-0" size={14} />;
};

const getDecodedToken = () => {
  try {
    const rawToken =
      Storage.local.get("TimeSheet-authenticationToken") ||
      Storage.session.get("TimeSheet-authenticationToken") ||
      localStorage.getItem("TimeSheet-authenticationToken") ||
      sessionStorage.getItem("TimeSheet-authenticationToken");
    if (!rawToken || typeof rawToken !== "string") return null;
    const parts = rawToken.split(".");
    if (parts.length >= 2) {
      return JSON.parse(atob(parts[1]));
    }
  } catch {
    // Ignore decode error
  }
  return null;
};

// Optional Manager/Admin access: checks common role/authority shapes so
// managers or admins can manage notes for employees other than themselves.
// Adjust the field names below if your auth payload uses different keys.
const MANAGER_ROLE_KEYWORDS = ["ADMIN", "MANAGER", "HR"];
const hasManagerAccess = (user: any): boolean => {
  if (!user) return false;
  const roleCandidates: string[] = [];

  if (typeof user.role === "string") roleCandidates.push(user.role);
  if (Array.isArray(user.roles)) roleCandidates.push(...user.roles);
  if (Array.isArray(user.authorities)) {
    roleCandidates.push(
      ...user.authorities.map((a: any) => (typeof a === "string" ? a : a?.authority || ""))
    );
  }
  if (typeof user.isAdmin === "boolean" && user.isAdmin) return true;
  if (typeof user.isManager === "boolean" && user.isManager) return true;

  return roleCandidates.some((r) =>
    MANAGER_ROLE_KEYWORDS.some((keyword) => (r || "").toUpperCase().includes(keyword))
  );
};

interface NoteDownloadDropdownProps {
  hasContent: boolean;
  onDownload: (format: "doc" | "pdf") => void;
}

const NoteDownloadDropdown = ({
  hasContent,
  onDownload,
}: NoteDownloadDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen]);

  if (!hasContent) return null;

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-[#4318FF] bg-blue-50/70 hover:bg-blue-100/70 rounded-lg transition-all cursor-pointer border border-blue-100/80 shadow-2xs"
        title="Download description (PDF, Word Document)"
      >
        <Download size={13} />
        <span>Download</span>
        <ChevronDown
          size={11}
          className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 z-50 w-44 bg-white border border-gray-200 rounded-xl shadow-xl p-1.5 space-y-0.5 animate-fadeIn">
          <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Choose Format
          </div>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onDownload("pdf");
            }}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors cursor-pointer font-medium text-left"
          >
            <span className="w-5 h-5 rounded bg-red-100 text-red-600 flex items-center justify-center text-[10px] font-bold shrink-0">
              PDF
            </span>
            <div className="flex-1 min-w-0">
              <span className="font-semibold block text-[12px] leading-tight">PDF Document</span>
              <span className="text-[10px] text-slate-400 block">.pdf format</span>
            </div>
          </button>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onDownload("doc");
            }}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors cursor-pointer font-medium text-left"
          >
            <span className="w-5 h-5 rounded bg-blue-100 text-[#4318FF] flex items-center justify-center text-[10px] font-bold shrink-0">
              DOC
            </span>
            <div className="flex-1 min-w-0">
              <span className="font-semibold block text-[12px] leading-tight">Word Document</span>
              <span className="text-[10px] text-slate-400 block">.doc format</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

const EmployeeNotes = () => {
  const dispatch = useAppDispatch();
  const { entity } = useAppSelector((state) => state.employeeDetails);
  const { currentUser } = useAppSelector((state) => state.user);
  const navigate = useNavigate();
  const location = useLocation();

  const isManagerRoute = location.pathname.startsWith("/manager-dashboard");
  const baseDashboardPath = isManagerRoute ? "/manager-dashboard" : "/employee-dashboard";
  const baseNotesPath = `${baseDashboardPath}/employee-notes`;

  const tokenPayload = useMemo(() => getDecodedToken(), []);

  const employeeId =
    entity?.employeeId ||
    currentUser?.employeeId ||
    currentUser?.loginId ||
    (currentUser as any)?.id ||
    tokenPayload?.employeeId ||
    tokenPayload?.sub ||
    tokenPayload?.loginId ||
    localStorage.getItem("employeeId") ||
    "";
  const authorName =
    currentUser?.aliasLoginName ||
    entity?.fullName ||
    (entity?.firstName
      ? `${entity.firstName} ${entity.lastName || ""}`.trim()
      : "") ||
    currentUser?.loginId ||
    employeeId ||
    "";

  const currentCreator =
    authorName ||
    currentUser?.loginId ||
    employeeId ||
    "Employee";

  const getAuthorDisplay = (createdBy?: string | null): string => {
    if (!createdBy) return authorName || currentCreator;
    const trimmed = createdBy.trim();
    if (
      /^\d+$/.test(trimmed) ||
      trimmed === employeeId ||
      trimmed === currentUser?.loginId
    ) {
      return authorName || currentCreator;
    }
    return trimmed;
  };
  // Notes are API/DB only — no localStorage keys needed

  // Employee can view/edit their own notes only, unless the signed-in user
  // has manager/admin access, in which case they may manage any employee's notes.
  const isManagerOrAdmin = hasManagerAccess(currentUser);
  const viewerId = currentUser?.loginId || currentUser?.employeeId || "";
  const isOwnRecord = !entity?.employeeId || !viewerId || entity.employeeId === viewerId;
  const canManageNotes = isOwnRecord || isManagerOrAdmin;

  const [notes, setNotes] = useState<EmployeeNote[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<NoteFilter>(NoteFilter.PROJECT);

  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [uploadingNoteId, setUploadingNoteId] = useState<string | number | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = DEFAULT_ITEMS_PER_PAGE;

  // Editor State for Create / Edit / View (Full Page View)
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [modalMode, setModalMode] = useState<NoteModalMode>("create");
  const [activeNoteId, setActiveNoteId] = useState<string | number | null>(null);
  const [activeNote, setActiveNote] = useState<EmployeeNote | null>(null);

  // Form Fields
  const [formProjectName, setFormProjectName] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] =
    useState<NoteCategory>(NoteCategoryEnum.PROJECT_NOTE);
  const [formDescription, setFormDescription] = useState("");
  const [formFiles, setFormFiles] = useState<NoteFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Required field validation
  const [formErrors, setFormErrors] = useState<NoteFormErrors>({});



  // Preview file modal state (streamed from MinIO)
  const [previewFile, setPreviewFile] = useState<NoteFile | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [previewTextContent, setPreviewTextContent] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isWordWrap, setIsWordWrap] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [previewTab, setPreviewTab] = useState<"content" | "table">("content");

  const openFilePreview = async (file: NoteFile, noteId?: number | string) => {
    setIsMaximized(false);
    setIsWordWrap(false);
    setIsCopied(false);
    setPreviewTab("content");
    setPreviewBlobUrl(null);
    setPreviewTextContent(null);
    setPreviewLoading(true);

    const targetNoteId = toNumericNoteId(noteId || file.noteId || activeNoteId);
    setPreviewFile({ ...file, noteId: targetNoteId });

    const fileKey =
      file.s3Key ||
      (file.id && !file.id.startsWith("temp-") ? file.id : undefined);

    try {
      if (fileKey) {
        const response = await dispatch(
          previewEmployeeNoteFile({
            entityId: targetNoteId,
            refId: targetNoteId,
            refType: ReferenceType.NOTE_ATTACHMENT,
            entityType: EntityType.EMPLOYEE_NOTE,
            key: fileKey,
          })
        ).unwrap();

        const mimeType =
          response.headers?.["content-type"] ||
          (file.name.toLowerCase().endsWith(".pdf") ? "application/pdf" : "application/octet-stream");
        const blob = new Blob([response.data], { type: mimeType });
        const objectUrl = window.URL.createObjectURL(blob);
        setPreviewBlobUrl(objectUrl);

        if (isTextPreviewable(file) || isCsvFile(file.name)) {
          const text = await blob.text();
          setPreviewTextContent(text);
        }
      } else if (file.rawFile) {
        const objectUrl = window.URL.createObjectURL(file.rawFile);
        setPreviewBlobUrl(objectUrl);
        if (isTextPreviewable(file) || isCsvFile(file.name)) {
          const text = await file.rawFile.text();
          setPreviewTextContent(text);
        }
      }
    } catch (err) {
      console.error("Failed to load file preview from MinIO:", err);
    } finally {
      setPreviewLoading(false);
    }
  };

  const closeFilePreview = () => {
    if (previewBlobUrl) {
      window.URL.revokeObjectURL(previewBlobUrl);
    }
    setPreviewFile(null);
    setPreviewBlobUrl(null);
    setPreviewTextContent(null);
    setPreviewLoading(false);
  };

  const handleCopyText = (text: string | null) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    window.setTimeout(() => setIsCopied(false), 2000);
  };

  // Text content for text/code preview in modal, streamed from MinIO
  const previewText = useMemo(() => {
    return previewTextContent;
  }, [previewTextContent]);

  const textLines = useMemo(() => {
    if (previewText === null) return [];
    return previewText.split(/\r\n|\r|\n/);
  }, [previewText]);

  const csvRows = useMemo(() => {
    if (!previewText || !previewFile || !isCsvFile(previewFile.name)) return null;
    return parseCsvRows(previewText);
  }, [previewText, previewFile]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete Confirmation Modal
  const [noteToDelete, setNoteToDelete] = useState<EmployeeNote | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Expandable sub-table state for Project Notes (+ / - button in Project Name column)
  const [expandedRowProjectNotes, setExpandedRowProjectNotes] = useState<(string | number)[]>([]);
  const toggleRowProjectNotesExpand = (noteId: string | number) => {
    setExpandedRowProjectNotes((prev) =>
      prev.some((id) => String(id) === String(noteId))
        ? prev.filter((id) => String(id) !== String(noteId))
        : [...prev, noteId]
    );
  };

  // When the full-page editor is opened from a sub-table row, remember the parent note ID
  const [editorParentNoteId, setEditorParentNoteId] = useState<string | number | null>(null);

  // Row-level "Create Note" Modal State
  const [isRowCreateNoteModalOpen, setIsRowCreateNoteModalOpen] = useState(false);
  const [rowModalProjectName, setRowModalProjectName] = useState("");
  const [rowModalTitle, setRowModalTitle] = useState("");
  const [rowModalDescription, setRowModalDescription] = useState("");
  const [rowModalFiles, setRowModalFiles] = useState<NoteFile[]>([]);
  const [rowModalErrors, setRowModalErrors] = useState<RowModalErrors>({});
  const [isRowModalSubmitting, setIsRowModalSubmitting] = useState(false);
  const [rowModalParentNoteId, setRowModalParentNoteId] = useState<string | number | null>(null);
  const rowModalFileInputRef = useRef<HTMLInputElement>(null);

  // Action Loading State (for View, Edit, Delete buttons)
  const [actionLoadingNoteId, setActionLoadingNoteId] = useState<string | number | null>(null);
  const [actionLoadingType, setActionLoadingType] = useState<NoteActionType | null>(null);
  const [isCenterLoading, setIsCenterLoading] = useState(false);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<NoteToastMessage | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const showToast = (
    text: string,
    type: "success" | "error" | "info" | "delete" | "loading" = "success"
  ) => {
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage({ text, type });
    if (type !== "loading") {
      toastTimeoutRef.current = window.setTimeout(() => setToastMessage(null), 3500);
    }
  };

  // Drag and drop states for file uploads
  const [isMainModalDragging, setIsMainModalDragging] = useState(false);
  const [isRowModalDragging, setIsRowModalDragging] = useState(false);

  const processUploadedFiles = async (
    files: FileList | File[],
    target: "main" | "row"
  ) => {
    if (!files || files.length === 0) return;
    const fileList = Array.from(files);

    const invalidType = fileList.filter((f) => !isAllowedNoteFile(f.name));
    const tooLarge = fileList.filter((f) => f.size > FILE_SIZE_LIMIT);
    const validFiles = fileList.filter(
      (f) => isAllowedNoteFile(f.name) && f.size <= FILE_SIZE_LIMIT
    );

    if (invalidType.length > 0) {
      showToast("Only PDF, Word, Excel, and images are allowed.", "error");
    }
    if (tooLarge.length > 0) {
      showToast(
        `${tooLarge[0].name} exceeds the 5 MB limit.`,
        "error"
      );
    }
    if (validFiles.length === 0) return;

    const currentFiles = target === "row" ? rowModalFiles : formFiles;
    // Distinct check: ignore files already in the list by name & size
    const distinctFiles = validFiles.filter(
      (nf) => !currentFiles.some((ef) => ef.name === nf.name && ef.size === nf.size)
    );

    if (distinctFiles.length === 0) {
      showToast("Selected file(s) are already attached.", "info");
      return;
    }

    // Temporary items with uploading: true
    const tempFiles: NoteFile[] = distinctFiles.map((file) => ({
      id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: file.name,
      size: file.size,
      type: file.type,
      uploading: true,
      rawFile: file,
    }));

    if (target === "row") {
      setRowModalFiles((prev) => [...prev, ...tempFiles]);
    } else {
      setFormFiles((prev) => [...prev, ...tempFiles]);
    }

    // Upload to object_store immediately.
    // Existing note (edit / table): use that note's id so entityId === refId === note.id
    // New note (create / row modal): use 0, then backend stamps the saved note id on POST.
    const targetNoteId =
      target === "row" ? 0 : toNumericNoteId(activeNoteId);
    try {
      const formData = new FormData();
      for (const file of distinctFiles) {
        formData.append("file", file);
      }

      const response: any = await dispatch(
        uploadEmployeeNoteFile({
          entityId: targetNoteId,
          refId: targetNoteId,
          refType: ReferenceType.NOTE_ATTACHMENT,
          entityType: EntityType.EMPLOYEE_NOTE,
          formData,
        })
      ).unwrap();

      const uploadedList: any[] =
        response?.data || (Array.isArray(response) ? response : [response]);

      const finishedFiles: NoteFile[] = distinctFiles.map((file, idx) => {
        const item = uploadedList[idx] || uploadedList[0] || {};
        const key = item.key || item.id || item.s3Key || tempFiles[idx].id;
        return {
          id: key,
          name: item.fileName || file.name,
          size: file.size,
          type: item.mimeType || file.type,
          s3Key: key,
          uploading: false,
        };
      });

      const tempIdSet = new Set(tempFiles.map((t) => t.id));
      if (target === "row") {
        setRowModalFiles((prev) => [
          ...prev.filter((f) => !tempIdSet.has(f.id)),
          ...finishedFiles,
        ]);
      } else {
        setFormFiles((prev) => [
          ...prev.filter((f) => !tempIdSet.has(f.id)),
          ...finishedFiles,
        ]);
      }

      showToast(
        `${
          distinctFiles.length === 1
            ? distinctFiles[0].name
            : `${distinctFiles.length} files`
        } uploaded to storage successfully!`
      );
    } catch (err) {
      console.error("Direct upload failed:", err);
      const tempIdSet = new Set(tempFiles.map((t) => t.id));
      if (target === "row") {
        setRowModalFiles((prev) => prev.filter((f) => !tempIdSet.has(f.id)));
      } else {
        setFormFiles((prev) => prev.filter((f) => !tempIdSet.has(f.id)));
      }
      showToast("Failed to upload file to storage. Please try again.", "error");
    }
  };

  const downloadDescriptionAsPdf = (
    htmlContent: string,
    fileName: string,
    title?: string
  ) => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 44;
    const maxLineWidth = pageWidth - margin * 2;
    const normalLineHeight = 16;
    let y = margin + 14;

    const ensureSpace = (needed: number) => {
      if (y + needed > pageHeight - margin) {
        doc.addPage();
        y = margin + 14;
      }
    };

    // Render title above description in large text size with black color
    if (title && title.trim()) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(0, 0, 0);
      const titleLines = doc.splitTextToSize(title.trim(), maxLineWidth);
      ensureSpace(titleLines.length * 24 + 14);
      doc.text(titleLines, margin, y);
      y += titleLines.length * 24 + 14;
    }

    const parser = new DOMParser();
    const parsed = parser.parseFromString(`<div>${htmlContent || ""}</div>`, "text/html");
    const container = parsed.body.firstElementChild || parsed.body;

    const renderNode = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.replace(/\s+/g, " ").trim();
        if (text) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(11);
          doc.setTextColor(30, 41, 59);
          const lines = doc.splitTextToSize(text, maxLineWidth);
          ensureSpace(lines.length * normalLineHeight + 6);
          doc.text(lines, margin, y);
          y += lines.length * normalLineHeight + 6;
        }
        return;
      }

      if (node.nodeType !== Node.ELEMENT_NODE) return;
      const el = node as HTMLElement;
      const tag = el.tagName.toLowerCase();

      if (tag === "h1") {
        const text = el.textContent?.trim();
        if (text) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(16);
          doc.setTextColor(15, 23, 42);
          const lines = doc.splitTextToSize(text, maxLineWidth);
          ensureSpace(lines.length * 20 + 8);
          doc.text(lines, margin, y);
          y += lines.length * 20 + 8;
        }
        return;
      }

      if (tag === "h2" || tag === "h3") {
        const text = el.textContent?.trim();
        if (text) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(13);
          doc.setTextColor(15, 23, 42);
          const lines = doc.splitTextToSize(text, maxLineWidth);
          ensureSpace(lines.length * 18 + 6);
          doc.text(lines, margin, y);
          y += lines.length * 18 + 6;
        }
        return;
      }

      if (tag === "ul") {
        const lis = Array.from(el.querySelectorAll(":scope > li"));
        lis.forEach((li) => {
          const text = li.textContent?.trim();
          if (!text) return;
          doc.setFont("helvetica", "normal");
          doc.setFontSize(11);
          doc.setTextColor(30, 41, 59);
          const bulletIndent = 16;
          const lines = doc.splitTextToSize(text, maxLineWidth - bulletIndent);
          ensureSpace(lines.length * normalLineHeight + 5);
          doc.text("\u2022", margin, y);
          doc.text(lines, margin + bulletIndent, y);
          y += lines.length * normalLineHeight + 5;
        });
        y += 4;
        return;
      }

      if (tag === "ol") {
        const lis = Array.from(el.querySelectorAll(":scope > li"));
        lis.forEach((li, idx) => {
          const text = li.textContent?.trim();
          if (!text) return;
          doc.setFont("helvetica", "normal");
          doc.setFontSize(11);
          doc.setTextColor(30, 41, 59);
          const prefix = `${idx + 1}.`;
          const numIndent = 20;
          const lines = doc.splitTextToSize(text, maxLineWidth - numIndent);
          ensureSpace(lines.length * normalLineHeight + 5);
          doc.text(prefix, margin, y);
          doc.text(lines, margin + numIndent, y);
          y += lines.length * normalLineHeight + 5;
        });
        y += 4;
        return;
      }

      if (tag === "blockquote") {
        const text = el.textContent?.trim();
        if (text) {
          doc.setFont("helvetica", "italic");
          doc.setFontSize(11);
          doc.setTextColor(71, 85, 105);
          const bqIndent = 16;
          const lines = doc.splitTextToSize(text, maxLineWidth - bqIndent);
          const blockHeight = lines.length * normalLineHeight + 8;
          ensureSpace(blockHeight);
          doc.setDrawColor(67, 24, 255);
          doc.setLineWidth(2.5);
          doc.line(margin, y - 9, margin, y - 9 + blockHeight - 4);
          doc.text(lines, margin + bqIndent, y);
          y += blockHeight;
        }
        return;
      }

      if (tag === "p") {
        const text = el.textContent?.trim();
        if (text) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(11);
          doc.setTextColor(30, 41, 59);
          const lines = doc.splitTextToSize(text, maxLineWidth);
          ensureSpace(lines.length * normalLineHeight + 6);
          doc.text(lines, margin, y);
          y += lines.length * normalLineHeight + 6;
        } else {
          y += 8;
        }
        return;
      }

      if (tag === "br") {
        y += 8;
        return;
      }

      Array.from(el.childNodes).forEach(renderNode);
    };

    Array.from(container.childNodes).forEach(renderNode);
    doc.save(`${fileName}.pdf`);
  };

  const downloadDescriptionAsDoc = (
    htmlContent: string,
    fileName: string,
    title?: string
  ) => {
    const displayTitle = title?.trim() || "";
    const titleHtml = displayTitle
      ? `<h1 style="font-size: 20pt; font-weight: bold; color: #000000; margin-top: 0; margin-bottom: 14pt; line-height: 1.3;">${escapeHtml(displayTitle)}</h1>`
      : "";
    const htmlDoc = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  body { font-family: Calibri, Arial, sans-serif; margin: 2cm; color: #1e293b; }
  .note-body { font-size: 11pt; line-height: 1.65; color: #334155; }
  .note-body p { margin-bottom: 8pt; }
  .note-body ul, .note-body ol { padding-left: 20pt; margin-bottom: 8pt; }
  .note-body li { margin-bottom: 4pt; }
  .note-body blockquote { border-left: 4px solid #4318FF; background: #f8fafc; padding: 6pt 12pt; color: #475569; font-style: italic; margin: 8pt 0; }
</style></head><body>
${titleHtml}
<div class="note-body">
${htmlContent || "<p></p>"}
</div>
</body></html>`;
    const blob = new Blob([htmlDoc], { type: "application/msword;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileName}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadDescription = async (
    htmlContent?: string,
    noteTitle?: string,
    format: "doc" | "pdf" | "docx" | "txt" = "pdf"
  ) => {
    const text = htmlToPlainText(htmlContent || "");
    if (!text.trim()) {
      showToast("Description is empty, nothing to download", "info");
      return;
    }
    const cleanTitle = (noteTitle || "description")
      .trim()
      .replace(/[^a-zA-Z0-9_\-\s]/g, "")
      .replace(/\s+/g, "_")
      .toLowerCase() || "description";

    try {
      const result = await dispatch(
        exportEmployeeNote({
          htmlContent: htmlContent || "",
          title: noteTitle || "",
          format,
          employeeId,
          noteId: activeNoteId != null ? String(activeNoteId) : undefined,
        })
      ).unwrap();
      const blob =
        result?.data instanceof Blob
          ? result.data
          : new Blob([result?.data]);
      if (blob.type && blob.type.includes("json")) {
        showToast("Failed to download from server. Please try again.", "error");
        return;
      }
      const ext = format === "doc" || format === "docx" ? "doc" : format === "txt" ? "txt" : "pdf";
      const filename = `${cleanTitle}.${ext}`;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      showToast(
        format === "doc" || format === "docx"
          ? "Downloaded Word document (.doc) successfully"
          : format === "txt"
          ? "Downloaded text document successfully"
          : "Downloaded PDF successfully",
        "success"
      );
    } catch {
      showToast("Failed to download from server. Please try again.", "error");
    }
  };

  /*
   * LOAD NOTES FROM BACKEND API
   */
  /** Re-fetch all notes for this employee from the API (DB only, no localStorage). */
  const refetchNotes = async (searchTerm?: string) => {
    if (!employeeId) return;
    try {
      setIsLoading(true);
      setApiError("");
      const query = (searchTerm ?? debouncedSearch).trim();
      const result = await dispatch(
        fetchEmployeeNotes({
          employeeId,
          search: query || undefined,
        })
      ).unwrap();
      const apiNotes: EmployeeNote[] = Array.isArray(result)
        ? result
        : Array.isArray(result?.data)
        ? result.data
        : [];
      setNotes(apiNotes.map(normalizeNote));
    } catch {
      setApiError("Couldn't reach the server.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Load notes on mount / when employeeId or debounced search changes
  useEffect(() => {
    if (!employeeId) {
      setNotes([]);
      return;
    }
    refetchNotes(debouncedSearch);
  }, [employeeId, debouncedSearch]);

  // View URL is /employee-dashboard/employee-notes/:noteId (numeric id only)
  const getNoteIdFromUrl = (): string | null => {
    const match = location.pathname.match(/\/employee-notes\/(\d+)\/?$/i);
    return match?.[1] ?? null;
  };

  const skipUrlSyncRef = useRef(false);

  // Sync viewer with URL so refresh / back / forward open the same note by id
  useEffect(() => {
    if (skipUrlSyncRef.current) {
      skipUrlSyncRef.current = false;
      return;
    }

    const urlNoteId = getNoteIdFromUrl();

    if (urlNoteId) {
      if (notes.length === 0) return;

      if (isEditorOpen && modalMode === "view" && sameNoteId(activeNoteId, urlNoteId)) {
        return;
      }

      const matched = notes.find((n) => sameNoteId(n.id, urlNoteId));
      if (!matched) return;

      setModalMode("view");
      setActiveNoteId(matched.id);
      setActiveNote(matched);
      setFormProjectName(matched.projectName || "");
      setFormTitle(matched.title || "");
      setFormCategory(matched.category || NoteCategoryEnum.PROJECT_NOTE);
      setFormDescription(matched.content || "");
      setFormFiles(matched.files ? [...matched.files] : []);
      setFormErrors({});
      setEditorParentNoteId(matched.parentNoteId || null);
      setIsEditorOpen(true);
    } else if (isEditorOpen && modalMode === "view") {
      setIsEditorOpen(false);
      setActiveNoteId(null);
      setActiveNote(null);
      setIsSubmitting(false);
      setFormErrors({});
      setEditorParentNoteId(null);
    }
  }, [location.pathname, notes, isEditorOpen, activeNoteId, modalMode]);
 
  // Ensure "Project" notes filter is default on initial mount only
  const hasSetInitialFilterRef = useRef(false);
  useEffect(() => {
    if (!hasSetInitialFilterRef.current) {
      hasSetInitialFilterRef.current = true;
      setSelectedFilter(NoteFilter.PROJECT);
    }
  }, []);

  // Filter and Search — exclude child notes (they live in sub-tables only)
  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      if (isChildNote(n)) return false;
      return (
        (selectedFilter === NoteFilter.PROJECT && isProjectCategory(n)) ||
        (selectedFilter === NoteFilter.PERSONAL && isPersonalCategory(n))
      );
    });
  }, [notes, selectedFilter]);

  // Count visible parent notes by category
  const projectNotesCount = useMemo(() => {
    return notes.filter((n) => {
      if (isChildNote(n)) return false;
      return isProjectCategory(n);
    }).length;
  }, [notes]);

  const personalNotesCount = useMemo(() => {
    return notes.filter((n) => {
      if (isChildNote(n)) return false;
      return isPersonalCategory(n);
    }).length;
  }, [notes]);

  const totalParentNotesCount = projectNotesCount + personalNotesCount;

  // Reset pagination when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedFilter]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredNotes.length / itemsPerPage));
  const paginatedNotes = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredNotes.slice(start, start + itemsPerPage);
  }, [filteredNotes, currentPage, itemsPerPage]);

  const startRecord =
    filteredNotes.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endRecord = Math.min(currentPage * itemsPerPage, filteredNotes.length);

  /*
   * MODAL FILE UPLOAD HANDLING
   */
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processUploadedFiles(e.target.files, "main");
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFormFile = async (fileId: string) => {
    const fileToRemove = formFiles.find((f) => f.id === fileId);
    setFormFiles((prev) => prev.filter((f) => f.id !== fileId));
    const fileKey =
      fileToRemove?.s3Key ||
      (fileToRemove?.id && !fileToRemove.id.startsWith("temp-")
        ? fileToRemove.id
        : null);
    if (fileKey) {
      try {
        await dispatch(
          deleteEmployeeNoteFile({
            entityId: toNumericNoteId(activeNoteId),
            refId: toNumericNoteId(activeNoteId),
            refType: ReferenceType.NOTE_ATTACHMENT,
            entityType: EntityType.EMPLOYEE_NOTE,
            key: fileKey,
          })
        ).unwrap();
      } catch (err) {
        console.warn("Could not delete file from object store:", err);
      }
    }
  };

  const downloadFile = async (file: NoteFile, noteId?: number | string) => {
    const key = file.s3Key || file.id;
    const targetNoteId = toNumericNoteId(
      noteId || file.noteId || activeNoteId || (previewFile as any)?.noteId
    );

    if (key) {
      try {
        const response = await dispatch(
          downloadEmployeeNoteFile({
            entityId: targetNoteId,
            refId: targetNoteId,
            refType: ReferenceType.NOTE_ATTACHMENT,
            entityType: EntityType.EMPLOYEE_NOTE,
            key,
          })
        ).unwrap();

        const blob = new Blob([response.data], {
          type: response.headers?.["content-type"] || "application/octet-stream",
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } catch (err) {
        console.error("Failed to download from MinIO:", err);
      }
    } else if (file.rawFile) {
      const url = window.URL.createObjectURL(file.rawFile);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
  };

  /*
   * DIRECT TABLE ROW FILE UPLOAD (Dispatches uploadEmployeeNoteFile to MinIO)
   */
  const handleTableDirectUpload = async (
    note: EmployeeNote,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    const invalidType = fileList.filter((f) => !isAllowedNoteFile(f.name));
    const tooLarge = fileList.filter((f) => f.size > FILE_SIZE_LIMIT);
    const validFiles = fileList.filter(
      (f) => isAllowedNoteFile(f.name) && f.size <= FILE_SIZE_LIMIT
    );

    if (invalidType.length > 0) {
      showToast("Only PDF, Word, Excel, and images are allowed.", "error");
    }
    if (tooLarge.length > 0) {
      showToast(`${tooLarge[0].name} exceeds the 5 MB limit.`, "error");
    }
    if (validFiles.length === 0) {
      e.target.value = "";
      return;
    }

    setUploadingNoteId(String(note.id));

    try {
      const formData = new FormData();
      for (const file of validFiles) {
        formData.append("file", file);
      }

      await dispatch(
        uploadEmployeeNoteFile({
          entityId: toNumericNoteId(note.id),
          refId: toNumericNoteId(note.id),
          refType: ReferenceType.NOTE_ATTACHMENT,
          entityType: EntityType.EMPLOYEE_NOTE,
          formData,
        })
      ).unwrap();

      await refetchNotes();
      showToast(
        `${
          validFiles.length === 1
            ? validFiles[0].name
            : `${validFiles.length} files`
        } uploaded successfully!`
      );
    } catch {
      showToast("Failed to upload file to server.", "error");
    } finally {
      setUploadingNoteId(null);
      e.target.value = "";
    }
  };

  /*
   * REMOVE FILE DIRECTLY FROM TABLE (Dispatches deleteEmployeeNoteFile from MinIO)
   */
  const handleTableRemoveFile = async (note: EmployeeNote, fileId: string) => {
    const targetFile = (note.files || []).find((f) => f.id === fileId);
    const fileKey = targetFile?.s3Key || targetFile?.id || fileId;

    try {
      await dispatch(
        deleteEmployeeNoteFile({
          entityId: toNumericNoteId(note.id),
          refId: toNumericNoteId(note.id),
          refType: ReferenceType.NOTE_ATTACHMENT,
          entityType: EntityType.EMPLOYEE_NOTE,
          key: fileKey,
        })
      ).unwrap();

      await refetchNotes();
      showToast("File removed successfully!");
    } catch {
      showToast("Failed to remove file from server.", "error");
    }
  };

  /*
   * OPEN CREATE NOTE / EDIT NOTE (Full Page In-Place View)
   */
  const openCreateNote = (
    category: NoteCategory = NoteCategoryEnum.PROJECT_NOTE
  ) => {
    if (location.pathname !== baseNotesPath) {
      navigate(baseNotesPath);
    }
    setModalMode("create");
    setActiveNoteId(null);
    setActiveNote(null);
    setFormProjectName("");
    setFormTitle("");
    setFormCategory(category);
    setFormDescription("");
    setFormFiles([]);
    setFormErrors({});
    setEditorParentNoteId(null);
    if (category === NoteCategoryEnum.PROJECT_NOTE) {
      setSelectedFilter(NoteFilter.PROJECT);
    } else {
      setSelectedFilter(NoteFilter.PERSONAL);
    }
    setSearch("");
    setCurrentPage(1);
    setIsEditorOpen(true);

    // Always open fresh — no draft persistence
  };

  const openEditModal = async (note: EmployeeNote) => {
    if (!note || !note.id) return;
    if (actionLoadingNoteId || isCenterLoading) return;
    setActionLoadingNoteId(note.id);
    setActionLoadingType("edit");
    setIsCenterLoading(true);

    const startTime = Date.now();

    try {
      let resolvedNote = { ...note };

      // Call GET API to fetch latest note details on edit
      // Always fetch fresh note from API before editing
      if (note.id) {
        const empId = employeeId || note.employeeId;
        if (empId) {
          try {
            const fresh = await dispatch(
              fetchEmployeeNote({ employeeId: empId, id: note.id })
            ).unwrap();
            const freshNote: EmployeeNote = fresh?.data ?? fresh;
            if (freshNote) resolvedNote = normalizeNote({ ...resolvedNote, ...freshNote });
          } catch (err) {
            console.warn("Failed to fetch note details on edit:", err);
          }
        }
      }

      // Ensure spinner in center of page displays for 1 second (1000ms)
      const elapsed = Date.now() - startTime;
      if (elapsed < 1000) {
        await new Promise((resolve) => setTimeout(resolve, 1000 - elapsed));
      }

      skipUrlSyncRef.current = true;
      if (location.pathname !== baseNotesPath) {
        navigate(baseNotesPath);
      }
      setActiveNoteId(resolvedNote.id);
      setActiveNote(resolvedNote);
      setFormProjectName(resolvedNote.projectName || "");
      setFormTitle(resolvedNote.title || "");
      setFormCategory(
        resolvedNote.category ||
          (resolvedNote.projectName
            ? NoteCategoryEnum.PROJECT_NOTE
            : NoteCategoryEnum.PERSONAL_NOTE)
      );
      setFormDescription(resolvedNote.content || "");
      setFormFiles(resolvedNote.files ? [...resolvedNote.files] : []);
      setFormErrors({});
      setEditorParentNoteId(resolvedNote.parentNoteId || null);

      // Always load note fresh from the server

      setModalMode("edit");
      setIsEditorOpen(true);
    } finally {
      setIsCenterLoading(false);
      setActionLoadingNoteId(null);
      setActionLoadingType(null);
      setToastMessage(null);
    }
  };

  const openViewNote = async (note: EmployeeNote) => {
    if (!note || !note.id) return;
    if (actionLoadingNoteId || isCenterLoading) return;
    setActionLoadingNoteId(note.id);
    setActionLoadingType("view");
    setIsCenterLoading(true);

    const startTime = Date.now();

    try {
      let resolvedNote = { ...note };

      // Call GET API to fetch latest note details on view
      // Always fetch fresh note from API before viewing
      if (note.id) {
        const empId = employeeId || note.employeeId;
        if (empId) {
          try {
            const fresh = await dispatch(
              fetchEmployeeNote({ employeeId: empId, id: note.id })
            ).unwrap();
            const freshNote: EmployeeNote = fresh?.data ?? fresh;
            if (freshNote) resolvedNote = normalizeNote({ ...resolvedNote, ...freshNote });
          } catch (err) {
            console.warn("Failed to fetch note details on view:", err);
          }
        }
      }

      // Ensure spinner in center of page displays for 1 second (1000ms)
      const elapsed = Date.now() - startTime;
      if (elapsed < 1000) {
        await new Promise((resolve) => setTimeout(resolve, 1000 - elapsed));
      }

      skipUrlSyncRef.current = true;
      setActiveNoteId(resolvedNote.id);
      setActiveNote(resolvedNote);
      setFormProjectName(resolvedNote.projectName || "");
      setFormTitle(resolvedNote.title || "");
      setFormCategory(
        resolvedNote.category ||
          (resolvedNote.projectName
            ? NoteCategoryEnum.PROJECT_NOTE
            : NoteCategoryEnum.PERSONAL_NOTE)
      );
      setFormDescription(resolvedNote.content || "");
      setFormFiles(resolvedNote.files ? [...resolvedNote.files] : []);
      setFormErrors({});
      setEditorParentNoteId(resolvedNote.parentNoteId || null);

      const targetUrl = `${baseNotesPath}/${resolvedNote.id}`;
      if (location.pathname !== targetUrl) {
        navigate(targetUrl);
      }

      setModalMode("view");
      setIsEditorOpen(true);
    } finally {
      setIsCenterLoading(false);
      setActionLoadingNoteId(null);
      setActionLoadingType(null);
      setToastMessage(null);
    }
  };

  const closeEditor = () => {
    skipUrlSyncRef.current = true;
    setIsEditorOpen(false);
    setActiveNoteId(null);
    setActiveNote(null);
    setIsSubmitting(false);
    setFormErrors({});
    setEditorParentNoteId(null);
    setFormProjectName("");
    setFormTitle("");
    setFormDescription("");
    setFormFiles([]);

    if (location.pathname !== baseNotesPath) {
      navigate(baseNotesPath);
    }
  };

  // Opens the full-page editor in create mode pre-filled for the parent note's category.
  const openSubTableCreateNote = (
    projectName: string,
    parentNoteId: string | number,
    category: NoteCategory = NoteCategoryEnum.PROJECT_NOTE
  ) => {
    if (location.pathname !== baseNotesPath) {
      navigate(baseNotesPath);
    }
    setModalMode("create");
    setActiveNoteId(null);
    setActiveNote(null);
    setFormProjectName(
      category === NoteCategoryEnum.PROJECT_NOTE ? projectName : ""
    );
    setFormTitle("");
    setFormCategory(category);
    setFormDescription("");
    setFormFiles([]);
    setFormErrors({});
    setEditorParentNoteId(parentNoteId);
    setIsEditorOpen(true);
  };

  const closeRowCreateNoteModal = () => {
    setIsRowCreateNoteModalOpen(false);
    setRowModalProjectName("");
    setRowModalTitle("");
    setRowModalDescription("");
    setRowModalFiles([]);
    setRowModalErrors({});
    setIsRowModalSubmitting(false);
    setRowModalParentNoteId(null);
  };

  const handleRowModalFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processUploadedFiles(e.target.files, "row");
    }
    if (rowModalFileInputRef.current) {
      rowModalFileInputRef.current.value = "";
    }
  };

  const removeRowModalFile = async (fileId: string) => {
    const fileToRemove = rowModalFiles.find((f) => f.id === fileId);
    setRowModalFiles((prev) => prev.filter((f) => f.id !== fileId));
    const fileKey =
      fileToRemove?.s3Key ||
      (fileToRemove?.id && !fileToRemove.id.startsWith("temp-")
        ? fileToRemove.id
        : null);
    if (fileKey) {
      try {
        await dispatch(
          deleteEmployeeNoteFile({
            entityId: 0,
            refId: 0,
            refType: ReferenceType.NOTE_ATTACHMENT,
            entityType: EntityType.EMPLOYEE_NOTE,
            key: fileKey,
          })
        ).unwrap();
      } catch (err) {
        console.warn("Could not delete row file from object store:", err);
      }
    }
  };

  const handleRowModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || isRowModalSubmitting) return;

    const errors: RowModalErrors = {};
    const trimmedTitle = rowModalTitle.trim();
    const trimmedProjectName = rowModalProjectName.trim();

    if (!trimmedProjectName) {
      errors.projectName = "Project Name is required";
    }
    if (!trimmedTitle) {
      errors.title = "Project Title is required";
    }
    if (isDescriptionEmpty(rowModalDescription)) {
      errors.description = "Description is required";
    }

    if (Object.keys(errors).length > 0) {
      setRowModalErrors(errors);
      return;
    }
    setRowModalErrors({});

    setIsRowModalSubmitting(true);

    try {
      const parentId = toParentNoteId(rowModalParentNoteId);
      const payload = {
        employeeId,
        projectName: trimmedProjectName,
        title: trimmedTitle,
        category: NoteCategoryEnum.PROJECT_NOTE,
        type: resolveNoteType(parentId),
        content: rowModalDescription,
        files: toNoteFilePayload(rowModalFiles),
        createdBy: currentCreator,
        updatedBy: currentCreator,
        parentNoteId: parentId,
      };

      await dispatch(createEmployeeNote(payload)).unwrap();
      await refetchNotes();
      closeRowCreateNoteModal();
      showToast("Successfully saved your note");
    } catch {
      showToast("Failed to reach server. Please try again.", "error");
    } finally {
      setIsRowModalSubmitting(false);
    }
  };

  /*
   * HANDLE SAVE NOTE (POST / PUT to Backend API)
   */
  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (modalMode === "view") return;
    if (!employeeId || isSubmitting) return;

    const errors: NoteFormErrors = {};
    const trimmedTitle = formTitle.trim();
    const trimmedProjectName = formProjectName.trim();

    if (formCategory === NoteCategoryEnum.PROJECT_NOTE && !trimmedProjectName) {
      errors.projectName = "Project Name is required";
    }
    if (!trimmedTitle) {
      errors.title =
        formCategory === NoteCategoryEnum.PROJECT_NOTE
          ? "Project Title is required"
          : "Title is required";
    }
    if (isDescriptionEmpty(formDescription)) {
      errors.description = "Description is required";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});

    setIsSubmitting(true);

    if (modalMode === "create") {
      const parentId = toParentNoteId(editorParentNoteId);
      try {
        const payload = {
          employeeId,
          projectName:
            formCategory === NoteCategoryEnum.PROJECT_NOTE
              ? trimmedProjectName
              : undefined,
          title: trimmedTitle,
          category: formCategory,
          type: resolveNoteType(parentId),
          content: formDescription,
          files: toNoteFilePayload(formFiles),
          createdBy: currentCreator,
          updatedBy: currentCreator,
          parentNoteId: parentId,
        };

        await dispatch(createEmployeeNote(payload)).unwrap();
        await refetchNotes();
        if (!parentId) {
          setSelectedFilter(
            formCategory === NoteCategoryEnum.PROJECT_NOTE
              ? NoteFilter.PROJECT
              : NoteFilter.PERSONAL
          );
          setSearch("");
          setCurrentPage(1);
        }
        closeEditor();
        showToast("Successfully saved your note");
      } catch {
        showToast("Failed to reach server. Please try again.", "error");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // EDIT MODE
      if (!activeNoteId) {
        setIsSubmitting(false);
        return;
      }

      const existing = notes.find((n) => sameNoteId(n.id, activeNoteId));
      const parentId = toParentNoteId(existing?.parentNoteId ?? editorParentNoteId);
      try {
        const payload = {
          projectName:
            formCategory === NoteCategoryEnum.PROJECT_NOTE
              ? trimmedProjectName
              : undefined,
          title: trimmedTitle,
          category: formCategory,
          type: resolveNoteType(parentId),
          content: formDescription,
          files: toNoteFilePayload(formFiles),
          updatedBy: currentCreator,
          parentNoteId: parentId,
        };

        await dispatch(
          updateEmployeeNote({
            employeeId,
            id: activeNoteId,
            noteData: payload,
          })
        ).unwrap();

        const remainingKeys = new Set(toNoteFilePayload(formFiles));
        const removedFiles = (existing?.files || []).filter((ef) => {
          const key = ef.s3Key || ef.id;
          return key && !remainingKeys.has(key);
        });
        for (const rf of removedFiles) {
          const fileKey = rf.s3Key || rf.id;
          if (fileKey) {
            try {
              await dispatch(
                deleteEmployeeNoteFile({
                  entityId: toNumericNoteId(activeNoteId),
                  refId: toNumericNoteId(activeNoteId),
                  refType: ReferenceType.NOTE_ATTACHMENT,
                  entityType: EntityType.EMPLOYEE_NOTE,
                  key: fileKey,
                })
              ).unwrap();
            } catch (deleteErr) {
              console.warn(
                "Failed to delete note attachment in edit:",
                deleteErr
              );
            }
          }
        }

        await refetchNotes();
        if (!parentId) {
          setSelectedFilter(
            formCategory === NoteCategoryEnum.PROJECT_NOTE
              ? NoteFilter.PROJECT
              : NoteFilter.PERSONAL
          );
          setSearch("");
          setCurrentPage(1);
        }
        closeEditor();
        showToast("Successfully saved your note");
      } catch {
        showToast("Failed to reach server. Please try again.", "error");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  /*
   * DELETE NOTE (DELETE to Backend API)
   */
  const executeDeleteNoteApi = async (note: EmployeeNote) => {
    if (!note || !note.id || isDeleting) return;

    const id = note.id;
    const empId = employeeId || note.employeeId;

    setIsDeleting(true);
    setActionLoadingNoteId(id);
    setActionLoadingType("delete");

    try {
      await dispatch(deleteEmployeeNote({ employeeId: empId, id })).unwrap();
      setNotes((prev) =>
        prev.filter(
          (n) =>
            String(n.id) !== String(id) &&
            String(n.parentNoteId ?? "") !== String(id)
        )
      );
    } catch (err) {
      console.warn("Failed to delete note via API:", err);
      showToast("Failed to delete note. Please try again.", "error");
    } finally {
      setIsDeleting(false);
      setActionLoadingNoteId(null);
      setActionLoadingType(null);
      setNoteToDelete(null);
    }
  };

  const handleDeleteNote = async (note: EmployeeNote) => {
    if (!note || !note.id || isDeleting || isCenterLoading) return;
    setActionLoadingNoteId(note.id);
    setActionLoadingType("delete");
    setIsCenterLoading(true);

    try {
      // 1 second spinner loading in center of page
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // Open pop message in center of page to cancel or confirm
      setNoteToDelete(note);
    } finally {
      setIsCenterLoading(false);
      setActionLoadingNoteId(null);
      setActionLoadingType(null);
    }
  };

  const confirmDelete = async () => {
    if (!noteToDelete || isDeleting) return;
    await executeDeleteNoteApi(noteToDelete);
  };

  const childNotesToDelete = !noteToDelete || isChildNote(noteToDelete)
    ? []
    : notes.filter(
        (n) =>
          isChildNote(n) && String(n.parentNoteId) === String(noteToDelete.id)
      );

  return (
    <div className="flex-1 flex flex-col px-3 md:px-5 py-3 min-h-0 bg-[#F4F7FE] font-sans">
      {/* Center Page Spinner (Worksphere Logo Loader) */}
      {isCenterLoading && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-white/60 backdrop-blur-[2px] animate-fadeIn"
          aria-busy="true"
          aria-label="Loading"
        >
          <div className="logo-loader">
            <img src={LogoTop} alt="Top" className="logo-top" />
            <img src={LogoBottom} alt="Bottom" className="logo-bottom" />
          </div>
        </div>
      )}

      {/* Pop Message Notification on Header Top Middle */}
      {toastMessage && (
        <div
          role="alert"
          aria-live="assertive"
          style={{ left: "50%", transform: "translateX(-50%)" }}
          className={`fixed top-4 sm:top-5 z-[99999] flex items-center gap-2.5 px-5 py-2.5 rounded-full shadow-[0px_16px_36px_rgba(0,0,0,0.18)] bg-white/95 backdrop-blur-md border pointer-events-none animate-popIn ring-1 ring-black/5 ${
            toastMessage.type === "delete" || toastMessage.type === "error"
              ? "border-rose-200/90 text-slate-800"
              : toastMessage.type === "loading"
              ? "border-blue-200/90 text-slate-800"
              : "border-emerald-200/90 text-slate-800"
          }`}
        >
          <div
            className={`flex items-center justify-center w-6 h-6 rounded-full shrink-0 shadow-xs ${
              toastMessage.type === "delete" || toastMessage.type === "error"
                ? "bg-rose-500 text-white shadow-rose-400/40"
                : toastMessage.type === "loading"
                ? "bg-[#4318FF] text-white shadow-blue-400/40"
                : "bg-emerald-500 text-white shadow-emerald-400/40"
            }`}
          >
            {toastMessage.type === "delete" ? (
              <Trash2 size={13} className="stroke-[2.5]" />
            ) : toastMessage.type === "loading" ? (
              <Loader2 size={13} className="animate-spin stroke-[2.5]" />
            ) : (
              <Check size={14} className="stroke-[3]" />
            )}
          </div>
          <span className="text-slate-800 font-bold text-xs sm:text-sm tracking-normal whitespace-nowrap">
            {toastMessage.text}
          </span>
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ml-0.5 ${
              toastMessage.type === "delete" || toastMessage.type === "error"
                ? "bg-rose-500 animate-pulse"
                : toastMessage.type === "loading"
                ? "bg-[#4318FF] animate-pulse"
                : "bg-emerald-500 animate-pulse"
            }`}
          />
        </div>
      )}

      {isEditorOpen ? (
        /* FULL-PAGE IN-PLACE NOTE EDITOR (Extends right up to the sidebar menu) */
        <div className="flex-1 flex flex-col min-h-0 animate-fadeIn">
          {/* Main Editor Form Card */}
          <div className="bg-white rounded-2xl shadow-[0px_18px_40px_rgba(112,144,176,0.12)] border border-gray-100 p-4 sm:p-5 pt-3 sm:pt-3.5 pb-8 flex-1 min-h-0 overflow-y-auto custom-scrollbar">
            <form
              id="note-fullpage-form"
              onSubmit={handleSaveModal}
              className="w-full space-y-3 pb-8"
            >
              {/* 1. TOP HEADER ROW: Project Name & Title + Back button on top */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pb-2.5 border-b border-gray-200">
                <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 min-w-0">
                  {/* Project Name (only if Project Note) */}
                  {formCategory === NoteCategoryEnum.PROJECT_NOTE && (
                    <div className="flex-1 flex items-center gap-2.5 min-w-0">
                      <label className="text-xs sm:text-[13px] font-bold font-sans text-black uppercase tracking-wider shrink-0 whitespace-nowrap">
                        Project Name:
                      </label>
                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          readOnly={modalMode === "view"}
                          value={formProjectName}
                          onChange={(e) => {
                            if (modalMode === "view") return;
                            setFormProjectName(e.target.value);
                            if (formErrors.projectName) {
                              setFormErrors((prev) => ({
                                ...prev,
                                projectName: undefined,
                              }));
                            }
                          }}
                          placeholder={modalMode === "view" ? "No project name" : "Enter project name..."}
                          className={`w-full px-3 py-1.5 text-sm font-medium font-sans rounded-xl border text-slate-800 placeholder:text-gray-400 transition-all h-[36px] ${modalMode === "view"
                              ? "bg-gray-50/70 border-gray-200 cursor-default select-text"
                              : formErrors.projectName
                                ? "border-red-400 ring-2 ring-red-100 focus:outline-none"
                                : "border-gray-200 focus:border-[#4318FF] focus:ring-2 focus:ring-[#4318FF]/15 focus:outline-none"
                            }`}
                        />
                        {formErrors.projectName && (
                          <p className="mt-1 text-xs font-semibold text-red-500">
                            {formErrors.projectName}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Title */}
                  <div className="flex-1 flex items-center gap-2.5 min-w-0">
                    <label className="text-xs sm:text-[13px] font-bold font-sans text-black uppercase tracking-wider shrink-0 whitespace-nowrap">
                      Title:
                    </label>
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        readOnly={modalMode === "view"}
                        value={formTitle}
                        onChange={(e) => {
                          if (modalMode === "view") return;
                          setFormTitle(e.target.value);
                          if (formErrors.title) {
                            setFormErrors((prev) => ({ ...prev, title: undefined }));
                          }
                        }}
                        placeholder={
                          modalMode === "view"
                            ? "No title"
                            : "Enter title..."
                        }
                        className={`w-full px-3 py-1.5 text-sm font-medium font-sans rounded-xl border text-slate-800 placeholder:text-gray-400 transition-all h-[36px] ${modalMode === "view"
                            ? "bg-gray-50/70 border-gray-200 cursor-default select-text"
                            : formErrors.title
                              ? "border-red-400 ring-2 ring-red-100 focus:outline-none"
                              : "border-gray-200 focus:border-[#4318FF] focus:ring-2 focus:ring-[#4318FF]/15 focus:outline-none"
                          }`}
                      />
                      {formErrors.title && (
                        <p className="mt-1 text-xs font-semibold text-red-500">
                          {formErrors.title}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Back Button */}
                <button
                  type="button"
                  onClick={closeEditor}
                  className="inline-flex items-center justify-center gap-1.5 text-xs font-bold font-sans text-[#4318FF] hover:text-[#3311CC] bg-blue-50/70 hover:bg-blue-100/70 px-2.5 h-[32px] rounded-lg transition-all cursor-pointer border border-blue-200/60 shrink-0 self-end md:self-center"
                >
                  <ArrowLeft size={13} />
                  <span>Back</span>
                </button>
              </div>

              {/* Author & Date info (when viewing an existing note) */}
              {modalMode === "view" && activeNote && (
                <div className="flex items-center gap-2 sm:gap-3 text-xs text-slate-500 font-medium flex-wrap min-w-0 pt-0.5">
                  <span className="flex items-center gap-1.5 shrink-0">
                    <User size={13} className="text-[#4318FF]" />
                    <span>
                      Created by <strong className="text-slate-800 font-bold">{capitalizeFirst(getAuthorDisplay(activeNote.createdBy))}</strong>
                    </span>
                  </span>
                  <span className="text-gray-300">&bull;</span>
                  <span className="flex items-center gap-1.5 shrink-0">
                    <Calendar size={13} className="text-[#4318FF]" />
                    <span>{formatDateTime(activeNote.createdAt || activeNote.updatedAt)}</span>
                  </span>
                </div>
              )}

              {/* 3. DESCRIPTION */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs sm:text-[13px] font-bold font-sans text-black uppercase tracking-wider">
                    Description {modalMode !== "view" && <span className="text-red-500">*</span>}
                  </label>
                  <div className="flex items-center gap-3">
                    <NoteDownloadDropdown
                      hasContent={Boolean(formDescription && formDescription.trim())}
                      onDownload={(format) =>
                        handleDownloadDescription(
                          formDescription,
                          formTitle || formProjectName,
                          format
                        )
                      }
                    />
                  </div>
                </div>

                {modalMode === "view" ? (
                  <div
                    style={{ resize: "vertical" }}
                    className="w-full min-h-[350px] max-h-[850px] overflow-auto resize-y p-4 sm:p-5 bg-gray-50/50 rounded-xl border border-gray-200 text-sm font-sans text-slate-800 leading-relaxed shadow-2xs prose prose-slate max-w-none [&_b]:font-bold [&_strong]:font-bold [&_i]:italic [&_em]:italic [&_u]:underline [&_h1]:text-lg [&_h1]:font-bold [&_h2]:text-base [&_h2]:font-bold [&_ul]:list-disc [&_ul]:ml-4.5 [&_ul]:pl-1 [&_ul_li]:mb-2 [&_ol]:list-decimal [&_ol]:ml-5.5 [&_ol]:pl-1 [&_ol_li]:mb-2 [&_blockquote]:border-l-4 [&_blockquote]:border-[#4318FF] [&_blockquote]:bg-indigo-50/60 [&_blockquote]:py-1.5 [&_blockquote]:px-3.5 [&_blockquote]:rounded-r-xl [&_blockquote]:italic [&_blockquote]:my-2.5 [&_blockquote]:text-slate-700"
                    dangerouslySetInnerHTML={{
                      __html:
                        formDescription ||
                        "<p class='text-slate-400 italic text-sm'>No description provided.</p>",
                    }}
                  />
                ) : (
                  <>
                    <div
                      className={
                        formErrors.description
                          ? "rounded-xl border border-red-400 ring-2 ring-red-100"
                          : ""
                      }
                    >
                      <RichTextEditor
                        initialValue={formDescription}
                        onChange={(html) => {
                          setFormDescription(html);
                          if (formErrors.description) {
                            setFormErrors((prev) => ({
                              ...prev,
                              description: undefined,
                            }));
                          }
                        }}
                        placeholder="Write your notes, key updates, documentation, or action items here..."
                        minHeight="380px"
                        onDownload={() =>
                          handleDownloadDescription(
                            formDescription,
                            formTitle || formProjectName
                          )
                        }
                      />
                    </div>
                    {formErrors.description && (
                      <p className="mt-1 text-xs font-semibold text-red-500">
                        {formErrors.description}
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* 4. FILES & ATTACHMENTS (Multiple File Upload) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs sm:text-[13px] font-bold font-sans text-black tracking-wider uppercase flex items-center gap-2">
                    <Paperclip size={15} className="text-[#4318FF]" />
                    <span>Files & Attachments</span>
                  </label>
                  {formFiles.length > 0 ? (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      {formFiles.length} {formFiles.length === 1 ? "file" : "files"} attached
                    </span>
                  ) : modalMode === "view" ? (
                    <span className="text-xs text-slate-400 font-medium">No files attached</span>
                  ) : null}
                </div>

                {/* Compact Upload Drop Zone (only in create/edit mode) */}
                {modalMode !== "view" && (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsMainModalDragging(true);
                    }}
                    onDragEnter={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsMainModalDragging(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsMainModalDragging(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsMainModalDragging(false);
                      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                        processUploadedFiles(e.dataTransfer.files, "main");
                      }
                    }}
                    className={`inline-flex items-center gap-2.5 border rounded-xl py-2 px-4 transition-all cursor-pointer group ${
                      isMainModalDragging
                        ? "border-[#4318FF] bg-blue-50/70 ring-2 ring-[#4318FF]/20"
                        : "border-dashed border-gray-200 hover:border-[#4318FF] bg-gray-50/60 hover:bg-blue-50/30"
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center text-[#4318FF] transition-colors shrink-0 shadow-2xs">
                      <UploadCloud size={16} />
                    </div>
                    <p className="text-xs font-bold font-sans text-slate-800 whitespace-nowrap">
                      <span className="text-[#4318FF] underline underline-offset-2 font-extrabold">
                        {isMainModalDragging ? "Drop files now" : "Click to upload"}
                      </span>{" "}
                      {isMainModalDragging ? "to attach" : "or drag and drop"}
                      <span className="hidden md:inline text-[11px] text-slate-400 font-normal ml-1.5">
                        (PDF, Word, Excel, images — max 5 MB)
                      </span>
                    </p>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={ALLOWED_FILE_ACCEPT}
                  className="hidden"
                  onChange={handleFileUpload}
                />

                {/* Attached Files Grid List */}
                {formFiles.length > 0 ? (
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {formFiles.map((file, fIdx) => (
                      <div
                        key={file.id || fIdx}
                        className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200 hover:border-blue-200 shadow-2xs transition-all"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#4318FF] flex items-center justify-center shrink-0">
                            {getFileIcon(file.name)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p
                              className="text-xs font-bold text-slate-900 truncate"
                              title={file.name}
                            >
                              {file.name}
                            </p>
                            <p className="text-[10px] text-slate-400 font-semibold">
                              {formatFileSize(file.size)} &bull;{" "}
                              {file.name.split(".").pop()?.toUpperCase() || "FILE"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          <button
                            type="button"
                            onClick={() => openFilePreview(file)}
                            title="Preview file"
                            className="p-1.5 rounded-lg text-gray-500 hover:text-[#4318FF] hover:bg-blue-50 transition-colors cursor-pointer"
                          >
                            <Eye size={14} />
                          </button>
                          {(file.s3Key || file.id || file.rawFile) && (
                            <button
                              type="button"
                              onClick={() => downloadFile(file)}
                              title="Download file"
                              className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                            >
                              <Download size={14} />
                            </button>
                          )}
                          {modalMode !== "view" && (
                            <button
                              type="button"
                              onClick={() => removeFormFile(file.id)}
                              title="Remove file"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : modalMode === "view" ? (
                  <p className="text-xs text-slate-400 italic py-3 px-4 bg-gray-50/60 rounded-xl border border-dashed border-gray-200">
                    No files attached to this note.
                  </p>
                ) : null}
              </div>

              {/* Footer Action Buttons (Below Right - only in create/edit mode) */}
              {modalMode !== "view" && (
                <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-3 pb-3 mb-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={closeEditor}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-4 py-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#4318FF] hover:bg-[#3410d1] disabled:opacity-50 text-white text-xs sm:text-sm font-bold px-5 py-1.5 rounded-xl shadow-sm shadow-[#4318FF]/25 transition-all cursor-pointer"
                  >
                    {isSubmitting && <Loader2 size={15} className="animate-spin" />}
                    {modalMode === "create"
                      ? formCategory === NoteCategoryEnum.PROJECT_NOTE
                        ? "Save Project Note"
                        : "Save Personal Note"
                      : "Save Changes"}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      ) : (
        <>
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
            <div>
              <h1 className="text-2xl font-bold font-sans text-black tracking-tight">
                {selectedFilter === NoteFilter.PERSONAL ? "Personal Notes" : "Project Notes"}
              </h1>
            </div>

            {canManageNotes && (
              <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 flex-wrap">
                {/* Button 1: Create Project Note */}
                <button
                  type="button"
                  onClick={() => openCreateNote(NoteCategoryEnum.PROJECT_NOTE)}
                  className="inline-flex items-center gap-2 bg-[#4318FF] hover:bg-[#3410d1] text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow-sm shadow-[#4318FF]/25 transition-all active:scale-[0.98] cursor-pointer"
                >
                  <Plus size={16} className="stroke-[2.5]" />
                  <span>Create Project Note</span>
                </button>

                {/* Button 2: Create Personal Note */}
                <button
                  type="button"
                  onClick={() => openCreateNote(NoteCategoryEnum.PERSONAL_NOTE)}
                  className="inline-flex items-center gap-2 bg-white hover:bg-blue-50/60 text-[#4318FF] border border-[#4318FF]/30 hover:border-[#4318FF] text-sm font-bold px-4 py-2.5 rounded-xl shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
                >
                  <Plus size={16} className="stroke-[2.5]" />
                  <span>Create Personal Note</span>
                </button>
              </div>
            )}
          </div>

          {/* Employee can view/edit their own notes only, unless a manager/admin is viewing */}
          {!canManageNotes && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 flex items-center gap-2">
              <AlertCircle size={16} />
              You can only view this employee&apos;s notes. Only the employee or a
              manager/admin can edit them.
            </div>
          )}
          {canManageNotes && !isOwnRecord && (
            <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 flex items-center gap-2">
              <AlertCircle size={16} />
              You&apos;re viewing and managing this employee&apos;s notes with
              manager/admin access.
            </div>
          )}

          {/* API Error Alert */}
          {apiError && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 flex items-center gap-2">
              <AlertCircle size={16} />
              {apiError}
            </div>
          )}

          {/* Top Filter and Search Bar Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            {/* Search Box */}
            <div className="relative w-full sm:w-80">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A3AED0]"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by project name or title..."
                className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-gray-200 bg-white placeholder:text-gray-400 text-slate-800 font-medium focus:outline-none focus:border-[#4318FF] transition-colors"
              />
              {search.trim() !== "" && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setDebouncedSearch("");
                  }}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A3AED0] hover:text-slate-600 cursor-pointer"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Filter Dropdown */}
            <div className="relative shrink-0">
              <select
                value={selectedFilter}
                onChange={(e) => {
                  setSelectedFilter(e.target.value as NoteFilter);
                  setCurrentPage(1);
                }}
                className="appearance-none pl-4 pr-9 py-2.5 rounded-xl text-sm font-bold border border-gray-200 bg-white text-slate-700 focus:outline-none focus:border-[#4318FF] transition-colors cursor-pointer shadow-sm"
              >
                <option value={NoteFilter.PROJECT}>Project Notes</option>
                <option value={NoteFilter.PERSONAL}>Personal Notes</option>
              </select>
              <ChevronDown
                size={15}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>

          {/* Table Container Card - With Cut Rounded Top Outer Borders */}
          <div className="bg-white rounded-[20px] shadow-[0px_18px_40px_rgba(112,144,176,0.12)] overflow-hidden border border-gray-100 flex flex-col flex-1 min-h-0 mb-4">
            {/* Table Content */}
            <div className="flex-1 overflow-x-auto overflow-y-visible min-h-[350px] relative custom-scrollbar">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-64">
                  <Loader2 className="w-8 h-8 text-[#4318FF] animate-spin mb-3" />
                  <p className="text-sm font-bold text-[#2B3674]">
                    Loading notes...
                  </p>
                </div>
              ) : filteredNotes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center p-6">
                  {totalParentNotesCount === 0 ? (
                    <>
                      <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-[#4318FF] mb-3">
                        <FileText size={22} />
                      </div>
                      <p className="text-sm sm:text-base font-bold text-[#2B3674]">
                        No notes created yet
                      </p>
                      <p className="text-xs text-[#707EAE] mt-1 max-w-sm">
                        Click &apos;+ Create Project Note&apos; or &apos;+ Create Personal Note&apos; above to add your notes.
                      </p>
                    </>
                  ) : search.trim() ? (
                    <>
                      <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-[#4318FF] mb-3">
                        <Search size={22} />
                      </div>
                      <p className="text-sm sm:text-base font-bold text-[#2B3674]">
                        No matching notes found
                      </p>
                      <p className="text-xs text-[#707EAE] mt-1 max-w-sm">
                        No {selectedFilter === NoteFilter.PERSONAL ? "personal" : "project"} notes match &quot;{search}&quot;. Try clearing your search query.
                      </p>
                      <div className="mt-4 flex items-center gap-2.5 flex-wrap justify-center">
                        <button
                          type="button"
                          onClick={() => {
                            setSearch("");
                            setDebouncedSearch("");
                          }}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#4318FF] hover:bg-[#3410d1] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-2xs"
                        >
                          Clear Search
                        </button>
                        {((selectedFilter === NoteFilter.PROJECT && personalNotesCount > 0) ||
                          (selectedFilter === NoteFilter.PERSONAL && projectNotesCount > 0)) && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedFilter(
                                selectedFilter === NoteFilter.PERSONAL ? NoteFilter.PROJECT : NoteFilter.PERSONAL
                              );
                              setSearch("");
                            }}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                          >
                            Switch to{" "}
                            {selectedFilter === NoteFilter.PERSONAL
                              ? `Project Notes (${projectNotesCount})`
                              : `Personal Notes (${personalNotesCount})`}
                          </button>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-[#4318FF] mb-3">
                        <FileText size={22} />
                      </div>
                      <p className="text-sm sm:text-base font-bold text-[#2B3674]">
                        {selectedFilter === NoteFilter.PERSONAL
                          ? "No Personal Notes found"
                          : "No Project Notes found"}
                      </p>
                      <p className="text-xs text-[#707EAE] mt-1 max-w-sm">
                        {selectedFilter === NoteFilter.PERSONAL
                          ? `You haven't created any personal notes yet. You have ${projectNotesCount} project note${projectNotesCount === 1 ? "" : "s"}.`
                          : `You haven't created any project notes yet. You have ${personalNotesCount} personal note${personalNotesCount === 1 ? "" : "s"}.`}
                      </p>
                      <div className="mt-4 flex items-center gap-2.5 flex-wrap justify-center">
                        {canManageNotes && (
                          <button
                            type="button"
                            onClick={() =>
                              openCreateNote(
                                selectedFilter === NoteFilter.PERSONAL
                                  ? NoteCategoryEnum.PERSONAL_NOTE
                                  : NoteCategoryEnum.PROJECT_NOTE
                              )
                            }
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#4318FF] hover:bg-[#3410d1] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-2xs"
                          >
                            <Plus size={14} className="stroke-[2.5]" />
                            Create{" "}
                            {selectedFilter === NoteFilter.PERSONAL
                              ? NoteCategoryEnum.PERSONAL_NOTE
                              : NoteCategoryEnum.PROJECT_NOTE}
                          </button>
                        )}
                        {((selectedFilter === NoteFilter.PROJECT && personalNotesCount > 0) ||
                          (selectedFilter === NoteFilter.PERSONAL && projectNotesCount > 0)) && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedFilter(
                                selectedFilter === NoteFilter.PERSONAL ? NoteFilter.PROJECT : NoteFilter.PERSONAL
                              );
                              setSearch("");
                            }}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-gray-50 text-[#4318FF] border border-gray-200 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-2xs"
                          >
                            Switch to{" "}
                            {selectedFilter === NoteFilter.PERSONAL
                              ? `Project Notes (${projectNotesCount})`
                              : `Personal Notes (${personalNotesCount})`}
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <>
                  <div className="hidden md:block">
                    <table className="w-full text-left border-collapse table-auto">
                      <thead>
                        <tr className="bg-[#4318FF] text-white">
                          <th className="py-3.5 pl-6 pr-3 text-[13px] font-bold uppercase tracking-wider text-left text-white w-24 whitespace-nowrap">
                            SL NO
                          </th>
                          {selectedFilter !== NoteFilter.PERSONAL && (
                            <th className="py-3.5 px-4 text-[13px] font-bold uppercase tracking-wider text-left text-white w-[28%] whitespace-nowrap">
                              Project Name
                            </th>
                          )}
                          <th
                            className={`py-3.5 px-4 text-[13px] font-bold uppercase tracking-wider text-left text-white whitespace-nowrap ${
                              selectedFilter === NoteFilter.PERSONAL ? "w-[52%]" : "w-[30%]"
                            }`}
                          >
                            Title
                          </th>
                          <th className="py-3.5 px-4 text-[13px] font-bold uppercase tracking-wider text-left text-white w-[22%] whitespace-nowrap">
                            Created by
                          </th>
                          <th className="py-3.5 pl-2 pr-6 text-[13px] font-bold uppercase tracking-wider text-center text-white w-28 whitespace-nowrap">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-sm">
                        {paginatedNotes.map((note, idx) => {
                          const slNo = (currentPage - 1) * itemsPerPage + idx + 1;
                          const isProject = note.category === NoteCategoryEnum.PROJECT_NOTE;
                          const createdDate = note.createdAt || note.updatedAt;
                          const isEven = idx % 2 === 0;

                          const isExpanded = expandedRowProjectNotes.some((id) =>
                            sameNoteId(id, note.id)
                          );
                          // Child notes: only notes explicitly added to this parent via the sub-table
                          const childNotes = notes.filter(
                            (n) =>
                              isChildNote(n) &&
                              String(n.parentNoteId) === String(note.id)
                          );

                          return (
                            <Fragment key={note.id}>
                              <tr
                                className={`group transition-all duration-150 ${isEven ? "bg-white" : "bg-[#F8F9FC]"
                                  } hover:bg-[#F1F4FF]`}
                              >
                                {/* 1. SL NO */}
                                <td className="py-4 pl-6 pr-3 text-left whitespace-nowrap">
                                  <div className="flex items-center gap-2">
                                    <span className="text-slate-800 text-sm font-bold min-w-[16px]">{slNo}</span>
                                    <button
                                      type="button"
                                      onClick={() => toggleRowProjectNotesExpand(note.id)}
                                      className={`w-6 h-6 rounded-md flex items-center justify-center transition-all cursor-pointer shrink-0 ${isExpanded
                                          ? "bg-[#4318FF] text-white shadow-xs"
                                          : "bg-blue-50 hover:bg-blue-100 text-[#4318FF] border border-blue-200"
                                        }`}
                                      title={
                                        isExpanded
                                          ? "Collapse notes"
                                          : "Expand to view notes"
                                      }
                                    >
                                      {isExpanded ? (
                                        <Minus size={13} className="stroke-[2.5]" />
                                      ) : (
                                        <Plus size={13} className="stroke-[2.5]" />
                                      )}
                                    </button>
                                  </div>
                                </td>

                                {/* 2. Project Name */}
                                {selectedFilter !== NoteFilter.PERSONAL && (
                                  <td className="py-4 px-4 text-left">
                                    <span
                                      className="text-slate-900 text-sm font-bold truncate max-w-[240px] block"
                                      title={
                                        note.projectName ||
                                        (isProject ? "Untitled Project" : NoteCategoryEnum.PERSONAL_NOTE)
                                      }
                                    >
                                      {note.projectName ||
                                        (isProject ? "-" : NoteCategoryEnum.PERSONAL_NOTE)}
                                    </span>
                                  </td>
                                )}

                                {/* 3. Title */}
                                <td className="py-4 px-4 text-left">
                                  <span
                                    className="text-slate-800 text-sm font-semibold truncate max-w-[320px] block"
                                    title={note.title || "Untitled note"}
                                  >
                                    {note.title || "Untitled note"}
                                  </span>
                                </td>

                                {/* 4. Created by */}
                                <td className="py-4 px-4 text-left whitespace-nowrap">
                                  <div className="flex flex-col">
                                    <span className="text-slate-800 text-sm font-semibold">
                                      {formatDateOnly(createdDate)}
                                    </span>
                                    <span className="text-xs text-slate-500 font-medium truncate max-w-[180px]">
                                      Created by {capitalizeFirst(getAuthorDisplay(note.createdBy))}
                                    </span>
                                  </div>
                                </td>

                                {/* 5. Action */}
                                <td className="py-4 pl-2 pr-6 text-center whitespace-nowrap">
                                  {(() => {
                                    const isNoteLoading = actionLoadingNoteId === note.id;
                                    const isViewLoading = isNoteLoading && actionLoadingType === "view";
                                    const isEditLoading = isNoteLoading && actionLoadingType === "edit";
                                    const isDeleteLoading = isNoteLoading && actionLoadingType === "delete";
                                    return (
                                      <div className="inline-flex items-center justify-center gap-1.5">
                                        <button
                                          type="button"
                                          disabled={Boolean(actionLoadingNoteId)}
                                          onClick={() => openViewNote(note)}
                                          title={isViewLoading ? "Loading details..." : "View Note Details"}
                                          className="p-2 rounded-lg bg-indigo-50 text-[#4318FF] hover:bg-indigo-100 hover:text-[#3311CC] disabled:opacity-60 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                        >
                                          {isViewLoading ? (
                                            <Loader2 size={15} className="animate-spin text-[#4318FF]" />
                                          ) : (
                                            <Eye size={15} />
                                          )}
                                        </button>
                                        {canManageNotes ? (
                                          <>
                                            <button
                                              type="button"
                                              disabled={Boolean(actionLoadingNoteId)}
                                              onClick={() => openEditModal(note)}
                                              title={isEditLoading ? "Opening editor..." : "Edit Note"}
                                              className="p-2 rounded-lg bg-blue-50 text-[#4318FF] hover:bg-blue-100 disabled:opacity-60 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                            >
                                              {isEditLoading ? (
                                                <Loader2 size={15} className="animate-spin text-[#4318FF]" />
                                              ) : (
                                                <Pencil size={15} />
                                              )}
                                            </button>
                                            <button
                                              type="button"
                                              disabled={Boolean(actionLoadingNoteId)}
                                              onClick={() => handleDeleteNote(note)}
                                              title={isDeleteLoading ? "Deleting note..." : "Delete Note"}
                                              className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 disabled:opacity-60 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                            >
                                              {isDeleteLoading ? (
                                                <Loader2 size={15} className="animate-spin text-red-500" />
                                              ) : (
                                                <Trash2 size={15} />
                                              )}
                                            </button>
                                          </>
                                        ) : (
                                          <span className="text-xs text-slate-500 font-medium ml-1">
                                            View only
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })()}
                                </td>
                              </tr>

                              {/* Sub-table below formatted when plus symbol is clicked */}
                              {isExpanded && (
                                <tr className="bg-gradient-to-r from-blue-50/30 via-indigo-50/20 to-purple-50/20 border-y border-blue-100 animate-fadeIn">
                                  <td colSpan={selectedFilter === NoteFilter.PERSONAL ? 4 : 5} className="py-3 px-6 sm:px-8">
                                    <div className="bg-white rounded-xl border border-blue-100 shadow-xs overflow-hidden p-3.5 space-y-3">
                                      {/* Sub-table header bar */}
                                      {canManageNotes && (
                                        <div className="flex items-center justify-end pb-2 border-b border-gray-100">
                                          <button
                                            type="button"
                                            onClick={() => openSubTableCreateNote(note.projectName || "", note.id, note.category)}
                                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-[#4318FF] hover:bg-[#3410d1] text-white shadow-xs transition-all cursor-pointer shrink-0"
                                            title={`Add ${isProject ? "project" : "personal"} note`}
                                          >
                                            <Plus size={13} className="stroke-[2.5]" />
                                            <span>Add Note</span>
                                          </button>
                                        </div>
                                      )}

                                      {/* Sub-table */}
                                      <div className="overflow-x-auto rounded-lg border border-gray-200">
                                        <table className="w-full text-left border-collapse text-xs">
                                          <thead>
                                            <tr className="bg-[#4318FF] text-white font-bold uppercase tracking-wider">
                                              <th className="py-2.5 pl-4 pr-3 w-16 text-left whitespace-nowrap">SL NO</th>
                                              <th className="py-2.5 px-3 text-left whitespace-nowrap">Title</th>
                                              <th className="py-2.5 px-3 text-left w-48 whitespace-nowrap">Created By</th>
                                              <th className="py-2.5 pr-4 pl-2 text-center w-28 whitespace-nowrap">Actions</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-gray-100 bg-white">
                                            {childNotes.length === 0 ? (
                                              <tr>
                                                <td colSpan={4} className="py-6 text-center text-xs text-slate-400 font-medium">
                                                  No notes yet. Click <span className="font-bold text-[#4318FF]">+ Add Note</span> to add one.
                                                </td>
                                              </tr>
                                            ) : (
                                              childNotes.map((child, cIdx) => {
                                                const childCreatedDate = child.createdAt || child.updatedAt;
                                                return (
                                                  <tr key={child.id} className="hover:bg-blue-50/40 transition-colors">
                                                    <td className="py-2.5 pl-4 pr-2 font-bold text-slate-700">
                                                      {cIdx + 1}
                                                    </td>
                                                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                                                      <span
                                                        className="text-slate-900 truncate max-w-[280px] block"
                                                        title={child.title || "Untitled"}
                                                      >
                                                        {child.title || "Untitled"}
                                                      </span>
                                                    </td>
                                                    <td className="py-2.5 px-3 text-slate-600">
                                                      <div className="flex flex-col">
                                                        <span className="font-semibold text-slate-800">
                                                          {formatDateOnly(childCreatedDate)}
                                                        </span>
                                                        <span className="text-[10px] text-slate-500">
                                                          Created by {capitalizeFirst(getAuthorDisplay(child.createdBy))}
                                                        </span>
                                                      </div>
                                                    </td>
                                                    <td className="py-2.5 pr-4 pl-2 text-center">
                                                      {(() => {
                                                        const isChildLoading = actionLoadingNoteId === child.id;
                                                        const isChildViewLoading = isChildLoading && actionLoadingType === "view";
                                                        const isChildEditLoading = isChildLoading && actionLoadingType === "edit";
                                                        const isChildDeleteLoading = isChildLoading && actionLoadingType === "delete";
                                                        return (
                                                          <div className="inline-flex items-center justify-center gap-1.5">
                                                            <button
                                                              type="button"
                                                              disabled={Boolean(actionLoadingNoteId)}
                                                              onClick={() => openViewNote(child)}
                                                              title={isChildViewLoading ? "Loading details..." : "View Note"}
                                                              className="p-1 rounded-md bg-indigo-50 text-[#4318FF] hover:bg-indigo-100 disabled:opacity-60 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                                            >
                                                              {isChildViewLoading ? (
                                                                <Loader2 size={13} className="animate-spin text-[#4318FF]" />
                                                              ) : (
                                                                <Eye size={13} />
                                                              )}
                                                            </button>
                                                            {canManageNotes && (
                                                              <>
                                                                <button
                                                                  type="button"
                                                                  disabled={Boolean(actionLoadingNoteId)}
                                                                  onClick={() => openEditModal(child)}
                                                                  title={isChildEditLoading ? "Opening editor..." : "Edit Note"}
                                                                  className="p-1 rounded-md bg-blue-50 text-[#4318FF] hover:bg-blue-100 disabled:opacity-60 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                                                >
                                                                  {isChildEditLoading ? (
                                                                    <Loader2 size={13} className="animate-spin text-[#4318FF]" />
                                                                  ) : (
                                                                    <Pencil size={13} />
                                                                  )}
                                                                </button>
                                                                <button
                                                                  type="button"
                                                                  disabled={Boolean(actionLoadingNoteId)}
                                                                  onClick={() => handleDeleteNote(child)}
                                                                  title={isChildDeleteLoading ? "Deleting note..." : "Delete Note"}
                                                                  className="p-1 rounded-md bg-red-50 text-red-500 hover:bg-red-100 disabled:opacity-60 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                                                >
                                                                  {isChildDeleteLoading ? (
                                                                    <Loader2 size={13} className="animate-spin text-red-500" />
                                                                  ) : (
                                                                    <Trash2 size={13} />
                                                                  )}
                                                                </button>
                                                              </>
                                                            )}
                                                          </div>
                                                        );
                                                      })()}
                                                    </td>
                                                  </tr>
                                                );
                                              })
                                            )}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card List (shown below md breakpoint) */}
                  <div className="md:hidden">
                    <EmployeeNotesMobile
                      paginatedNotes={paginatedNotes}
                      allNotes={notes}
                      currentPage={currentPage}
                      itemsPerPage={itemsPerPage}
                      canManageNotes={canManageNotes}
                      expandedRowProjectNotes={expandedRowProjectNotes}
                      toggleRowProjectNotesExpand={toggleRowProjectNotesExpand}
                      openViewNote={openViewNote}
                      openEditModal={openEditModal}
                      setNoteToDelete={setNoteToDelete}
                      handleDeleteNote={handleDeleteNote}
                      openSubTableCreateNote={openSubTableCreateNote}
                      uploadingNoteId={uploadingNoteId}
                      actionLoadingNoteId={actionLoadingNoteId}
                      actionLoadingType={actionLoadingType}
                      handleTableDirectUpload={handleTableDirectUpload}
                      handleTableRemoveFile={handleTableRemoveFile}
                      openFilePreview={openFilePreview}
                      downloadFile={downloadFile}
                      getAuthorDisplay={getAuthorDisplay}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Bottom Pagination */}
            {filteredNotes.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 border-t border-gray-100">
                <p className="text-sm text-slate-700 font-semibold">
                  Showing {startRecord} - {endRecord} of {filteredNotes.length} notes
                </p>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-gray-200 text-[#2B3674] hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    aria-label="Previous Page"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center transition-colors cursor-pointer ${currentPage === pageNum
                          ? "bg-[#4318FF] text-white shadow-sm"
                          : "text-[#2B3674] hover:bg-gray-100"
                          }`}
                      >
                        {pageNum}
                      </button>
                    )
                  )}

                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-gray-200 text-[#2B3674] hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    aria-label="Next Page"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>

        </>
      )}

      {/* FILE PREVIEW MODAL */}
      {previewFile && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div
            className={`bg-white rounded-2xl ${isMaximized ? "w-[96vw] h-[94vh]" : "max-w-4xl w-full h-[88vh]"
              } flex flex-col shadow-2xl border border-gray-100 overflow-hidden transition-all duration-200`}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-gray-100 bg-white shrink-0 z-10">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#4318FF] flex items-center justify-center shrink-0">
                  {getFileIcon(previewFile.name)}
                </div>
                <div className="min-w-0">
                  <h3
                    className="text-sm font-bold text-[#1B2559] truncate max-w-xs sm:max-w-md"
                    title={previewFile.name}
                  >
                    {previewFile.name}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-gray-500 font-medium mt-0.5">
                    <span>{formatFileSize(previewFile.size)}</span>
                    <span>&bull;</span>
                    <span className="uppercase font-bold text-[#4318FF]">
                      {previewFile.name.split(".").pop() || "FILE"}
                    </span>
                    {previewText !== null && (
                      <>
                        <span>&bull;</span>
                        <span className="text-slate-600 font-semibold">
                          {textLines.length} {textLines.length === 1 ? "line" : "lines"}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Header Actions */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {/* CSV Table vs Text Toggle */}
                {csvRows && csvRows.length > 0 && (
                  <div className="flex items-center bg-gray-100 rounded-lg p-0.5 border border-gray-200">
                    <button
                      type="button"
                      onClick={() => setPreviewTab("content")}
                      className={`px-2 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${previewTab === "content"
                          ? "bg-white text-[#4318FF] shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                        }`}
                      title="View Raw CSV Text"
                    >
                      Source
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewTab("table")}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${previewTab === "table"
                          ? "bg-white text-[#4318FF] shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                        }`}
                      title="View CSV Table"
                    >
                      <TableIcon size={12} />
                      <span>Table</span>
                    </button>
                  </div>
                )}

                {/* Word Wrap Toggle for text */}
                {previewText !== null && previewTab === "content" && (
                  <button
                    type="button"
                    onClick={() => setIsWordWrap(!isWordWrap)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${isWordWrap
                        ? "bg-blue-50 text-[#4318FF] border-blue-200"
                        : "bg-white text-slate-600 border-gray-200 hover:bg-gray-50"
                      }`}
                    title={isWordWrap ? "Disable line wrap" : "Enable line wrap"}
                  >
                    <WrapText size={13} />
                    <span className="hidden sm:inline">Wrap</span>
                  </button>
                )}

                {/* Copy Text Button */}
                {previewText !== null && (
                  <button
                    type="button"
                    onClick={() => handleCopyText(previewText)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 text-slate-700 hover:bg-gray-50 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                    title="Copy file contents"
                  >
                    {isCopied ? (
                      <>
                        <Check size={13} className="text-emerald-600" />
                        <span className="text-emerald-600 hidden sm:inline">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} />
                        <span className="hidden sm:inline">Copy</span>
                      </>
                    )}
                  </button>
                )}

                {/* Maximize / Minimize Button */}
                <button
                  type="button"
                  onClick={() => setIsMaximized(!isMaximized)}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors cursor-pointer"
                  title={isMaximized ? "Restore size" : "Maximize window"}
                >
                  {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>

                {/* Download Button */}
                <button
                  type="button"
                  onClick={() => downloadFile(previewFile)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-[#4318FF] hover:bg-blue-100 text-xs font-semibold transition-colors cursor-pointer"
                  title="Download file"
                >
                  <Download size={14} />
                  <span className="hidden sm:inline">Download</span>
                </button>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={closeFilePreview}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                  title="Close modal"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body / Viewer */}
            <div className="flex-1 min-h-0 flex flex-col bg-gray-50/50 overflow-hidden">
              {previewLoading ? (
                <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-8">
                  <Loader2 size={36} className="animate-spin text-[#4318FF] mb-3" />
                  <p className="text-xs text-slate-500 font-medium">Loading preview from MinIO...</p>
                </div>
              ) : (previewBlobUrl || previewFile.rawFile) &&
                (previewFile.name.match(/\.(png|jpe?g|webp|gif|svg)$/i) ||
                  previewFile.type?.startsWith("image/")) ? (
                /* IMAGE VIEWER */
                <div className="flex-1 min-h-0 overflow-auto p-4 sm:p-6 flex flex-col items-center justify-center">
                  <div className="bg-white p-3 rounded-2xl border border-gray-200 shadow-sm max-w-full max-h-full flex flex-col items-center">
                    <img
                      src={previewBlobUrl || ""}
                      alt={previewFile.name}
                      className="max-h-[70vh] max-w-full object-contain rounded-xl"
                    />
                    <p className="mt-2.5 text-xs text-slate-500 font-semibold">
                      {previewFile.name} &bull; {formatFileSize(previewFile.size)}
                    </p>
                  </div>
                </div>
              ) : (previewBlobUrl || previewFile.rawFile) &&
                (previewFile.name.toLowerCase().endsWith(".pdf") ||
                  previewFile.type === "application/pdf") ? (
                /* PDF VIEWER */
                <div className="flex-1 min-h-0 w-full h-full p-3 sm:p-4 flex flex-col">
                  <iframe
                    src={previewBlobUrl || ""}
                    title={previewFile.name}
                    className="w-full flex-1 min-h-0 rounded-xl border border-gray-200 bg-white shadow-xs"
                  />
                </div>
              ) : csvRows && previewTab === "table" ? (
                /* CSV TABLE VIEWER */
                <div className="flex-1 min-h-0 p-3 sm:p-4 overflow-auto">
                  <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      {csvRows.length > 0 && (
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200 text-slate-700 font-bold uppercase">
                            <th className="py-2.5 px-3 w-10 text-center text-slate-400">#</th>
                            {csvRows[0].map((header, hIdx) => (
                              <th key={hIdx} className="py-2.5 px-3 whitespace-nowrap">
                                {header || `Col ${hIdx + 1}`}
                              </th>
                            ))}
                          </tr>
                        </thead>
                      )}
                      <tbody className="divide-y divide-gray-100">
                        {csvRows.slice(1).map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-blue-50/30 transition-colors">
                            <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">
                              {rIdx + 1}
                            </td>
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} className="py-2 px-3 text-slate-800 whitespace-nowrap">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : previewText !== null ? (
                /* CODE & TEXT VIEWER - STARTS AT LINE 1 WITH NO NEGATIVE SCROLL */
                <div className="flex-1 min-h-0 flex flex-col p-3 sm:p-4 overflow-hidden">
                  <div className="flex-1 min-h-0 bg-white rounded-xl border border-gray-200 shadow-2xs overflow-auto flex text-xs sm:text-[13px] leading-relaxed font-mono">
                    {/* Line Numbers Gutter */}
                    <div className="select-none bg-slate-50 border-r border-gray-200 py-3 px-3 text-right text-slate-400 shrink-0 sticky left-0 z-10 font-mono text-[11px] sm:text-xs">
                      {textLines.map((_, i) => (
                        <div key={i} className="leading-6">
                          {i + 1}
                        </div>
                      ))}
                    </div>

                    {/* Text / Code Content */}
                    <div
                      className={`flex-1 py-3 px-4 min-w-0 font-mono text-slate-800 ${isWordWrap ? "whitespace-pre-wrap break-words" : "whitespace-pre"
                        }`}
                    >
                      {textLines.map((line, i) => (
                        <div key={i} className="leading-6">
                          {line || "\u00A0"}
                        </div>
                      ))}
                    </div>
                  </div>

                  {previewText.length > MAX_TEXT_PREVIEW_CHARS && (
                    <p className="text-[11px] text-gray-400 text-center pt-2 shrink-0">
                      Showing the first {MAX_TEXT_PREVIEW_CHARS.toLocaleString()} characters.
                      Download the file to see the complete contents.
                    </p>
                  )}
                </div>
              ) : (
                /* UNSUPPORTED FORMAT VIEWER */
                <div className="flex-1 min-h-0 p-8 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#4318FF] flex items-center justify-center mx-auto mb-3 shadow-2xs">
                    <FileText size={32} />
                  </div>
                  <h4 className="text-base font-bold text-slate-800 mb-1">{previewFile.name}</h4>
                  <p className="text-xs text-slate-500 mb-4 max-w-sm leading-relaxed">
                    This file format ({previewFile.name.split(".").pop()?.toUpperCase() || "File"})
                    cannot be previewed in the browser. Download it to view the full contents.
                  </p>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 text-slate-700 text-xs font-semibold mb-4">
                    <span>File Size: {formatFileSize(previewFile.size)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => downloadFile(previewFile)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4318FF] text-white text-xs font-bold hover:bg-[#3410d1] transition-all shadow-sm cursor-pointer"
                  >
                    <Download size={14} />
                    Download File
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}



      {/* ROW-LEVEL CREATE NOTE MODAL */}
      {isRowCreateNoteModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#4318FF] flex items-center justify-center shadow-xs">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1B2559]">
                    Create Project Note
                  </h3>
                  <p className="text-xs text-gray-500">
                    Add a new note for project:{" "}
                    <span className="font-semibold text-[#4318FF]">
                      {rowModalProjectName || "Project"}
                    </span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeRowCreateNoteModal}
                disabled={isRowModalSubmitting}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form Body */}
            <form
              onSubmit={handleRowModalSubmit}
              className="flex-1 overflow-y-auto px-6 py-5 space-y-4"
            >
              {/* Row: Project Name & Project Title */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Project Name */}
                <div className="min-w-0">
                  <label className="block text-xs sm:text-[13px] font-bold font-sans text-black mb-1.5 uppercase tracking-wider">
                    Project Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={rowModalProjectName}
                    onChange={(e) => {
                      setRowModalProjectName(e.target.value);
                      if (rowModalErrors.projectName) {
                        setRowModalErrors((prev) => ({ ...prev, projectName: undefined }));
                      }
                    }}
                    placeholder="Enter project name..."
                    className={`w-full px-3 py-1.5 text-sm font-medium font-sans rounded-xl border text-slate-800 placeholder:text-gray-400 transition-all h-[36px] ${rowModalErrors.projectName
                        ? "border-red-400 ring-2 ring-red-100 focus:outline-none"
                        : "border-gray-200 focus:border-[#4318FF] focus:ring-2 focus:ring-[#4318FF]/15 focus:outline-none"
                      }`}
                  />
                  {rowModalErrors.projectName && (
                    <p className="mt-1 text-xs font-semibold text-red-500">
                      {rowModalErrors.projectName}
                    </p>
                  )}
                </div>

                {/* Project Title */}
                <div className="min-w-0">
                  <label className="block text-xs sm:text-[13px] font-bold font-sans text-black mb-1.5 uppercase tracking-wider">
                    Project Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={rowModalTitle}
                    onChange={(e) => {
                      setRowModalTitle(e.target.value);
                      if (rowModalErrors.title) {
                        setRowModalErrors((prev) => ({ ...prev, title: undefined }));
                      }
                    }}
                    placeholder="Enter project title..."
                    className={`w-full px-3 py-1.5 text-sm font-medium font-sans rounded-xl border text-slate-800 placeholder:text-gray-400 transition-all h-[36px] ${rowModalErrors.title
                        ? "border-red-400 ring-2 ring-red-100 focus:outline-none"
                        : "border-gray-200 focus:border-[#4318FF] focus:ring-2 focus:ring-[#4318FF]/15 focus:outline-none"
                      }`}
                  />
                  {rowModalErrors.title && (
                    <p className="mt-1 text-xs font-semibold text-red-500">
                      {rowModalErrors.title}
                    </p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs sm:text-[13px] font-bold font-sans text-black uppercase tracking-wider">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <NoteDownloadDropdown
                    hasContent={Boolean(rowModalDescription && rowModalDescription.trim())}
                    onDownload={(format) =>
                      handleDownloadDescription(
                        rowModalDescription,
                        rowModalTitle || rowModalProjectName,
                        format
                      )
                    }
                  />
                </div>
                <div
                  className={
                    rowModalErrors.description
                      ? "rounded-xl border border-red-400 ring-2 ring-red-100"
                      : ""
                  }
                >
                  <RichTextEditor
                    initialValue={rowModalDescription}
                    onChange={(html) => {
                      setRowModalDescription(html);
                      if (rowModalErrors.description) {
                        setRowModalErrors((prev) => ({
                          ...prev,
                          description: undefined,
                        }));
                      }
                    }}
                    placeholder="Write your notes, key updates, documentation, or action items here..."
                    minHeight="240px"
                    onDownload={() =>
                      handleDownloadDescription(
                        rowModalDescription,
                        rowModalTitle || rowModalProjectName
                      )
                    }
                  />
                </div>
                {rowModalErrors.description && (
                  <p className="mt-1 text-xs font-semibold text-red-500">
                    {rowModalErrors.description}
                  </p>
                )}
              </div>

              {/* Files & Attachments */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs sm:text-[13px] font-bold font-sans text-black tracking-wider uppercase flex items-center gap-2">
                    <Paperclip size={15} className="text-[#4318FF]" />
                    <span>Files & Attachments</span>
                  </label>
                  {rowModalFiles.length > 0 && (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      {rowModalFiles.length} {rowModalFiles.length === 1 ? "file" : "files"} attached
                    </span>
                  )}
                </div>

                {/* Drop zone */}
                <div
                  onClick={() => rowModalFileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsRowModalDragging(true);
                  }}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsRowModalDragging(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsRowModalDragging(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsRowModalDragging(false);
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      processUploadedFiles(e.dataTransfer.files, "row");
                    }
                  }}
                  className={`border rounded-xl py-2 px-3 flex items-center justify-center gap-2.5 transition-all cursor-pointer group text-center ${
                    isRowModalDragging
                      ? "border-[#4318FF] bg-blue-50/70 ring-2 ring-[#4318FF]/20"
                      : "border-dashed border-gray-200 hover:border-[#4318FF] bg-gray-50/60 hover:bg-blue-50/30"
                  }`}
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center text-[#4318FF] transition-colors shrink-0 shadow-2xs">
                    <UploadCloud size={16} />
                  </div>
                  <div className="text-left sm:text-center">
                    <p className="text-xs font-bold font-sans text-slate-800">
                      <span className="text-[#4318FF] underline underline-offset-2 font-extrabold">
                        {isRowModalDragging ? "Drop files now" : "Click to upload"}
                      </span>{" "}
                      {isRowModalDragging ? "to attach" : "or drag and drop multiple files"}
                      <span className="hidden md:inline text-[11px] text-slate-400 font-normal ml-2">
                        (PDF, Word, Excel, images — max 5 MB)
                      </span>
                    </p>
                  </div>
                </div>

                <input
                  ref={rowModalFileInputRef}
                  type="file"
                  multiple
                  accept={ALLOWED_FILE_ACCEPT}
                  className="hidden"
                  onChange={handleRowModalFileUpload}
                />

                {/* Attached Files Grid List */}
                {rowModalFiles.length > 0 && (
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {rowModalFiles.map((file, fIdx) => (
                      <div
                        key={file.id || fIdx}
                        className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200 hover:border-blue-200 shadow-2xs transition-all"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#4318FF] flex items-center justify-center shrink-0">
                            {getFileIcon(file.name)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p
                              className="text-xs font-bold text-slate-900 truncate"
                              title={file.name}
                            >
                              {file.name}
                            </p>
                            <p className="text-[10px] text-slate-400 font-semibold">
                              {formatFileSize(file.size)} &bull;{" "}
                              {file.name.split(".").pop()?.toUpperCase() || "FILE"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          <button
                            type="button"
                            onClick={() => openFilePreview(file)}
                            title="Preview file"
                            className="p-1.5 rounded-lg text-gray-500 hover:text-[#4318FF] hover:bg-blue-50 transition-colors cursor-pointer"
                          >
                            <Eye size={14} />
                          </button>
                          {(file.s3Key || file.id || file.rawFile) && (
                            <button
                              type="button"
                              onClick={() => downloadFile(file)}
                              title="Download file"
                              className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                            >
                              <Download size={14} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => removeRowModalFile(file.id)}
                            title="Remove file"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeRowCreateNoteModal}
                  disabled={isRowModalSubmitting}
                  className="w-full sm:w-auto px-4 py-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRowModalSubmitting}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#4318FF] hover:bg-[#3410d1] disabled:opacity-50 text-white text-xs sm:text-sm font-bold px-5 py-1.5 rounded-xl shadow-sm shadow-[#4318FF]/25 transition-all cursor-pointer"
                >
                  {isRowModalSubmitting && <Loader2 size={15} className="animate-spin" />}
                  Save Project Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION POPUP MODAL */}
      {noteToDelete && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-3.5 shadow-xs">
              <Trash2 size={22} className="stroke-[2.5]" />
            </div>

            <h3 className="text-base sm:text-lg font-bold text-[#1B2559]">
              {isChildNote(noteToDelete) ? "Delete Child Note" : "Delete Note"}
            </h3>

            {isChildNote(noteToDelete) ? (
              <p className="text-xs sm:text-sm text-gray-500 mt-2 leading-relaxed">
                Are you sure you want to delete the child note &quot;
                <span className="font-semibold text-gray-800">
                  {noteToDelete.title || "Untitled note"}
                </span>
                &quot;? This action cannot be undone.
              </p>
            ) : (
              <>
                <p className="text-xs sm:text-sm text-gray-500 mt-2 leading-relaxed">
                  Are you sure you want to delete &quot;
                  <span className="font-semibold text-gray-800">
                    {noteToDelete.title || "Untitled note"}
                  </span>
                  &quot;?
                  {childNotesToDelete.length > 0
                    ? " The child notes listed below will also be deleted."
                    : " This action cannot be undone."}
                </p>
                {childNotesToDelete.length > 0 && (
                  <ul className="mt-3 w-full max-h-32 overflow-y-auto text-left rounded-xl border border-red-100 bg-red-50/70 px-3 py-2 space-y-1">
                    {childNotesToDelete.map((child) => (
                      <li
                        key={String(child.id)}
                        className="text-xs sm:text-sm text-slate-700 font-medium truncate"
                      >
                        • {child.title || "Untitled note"}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}

            <div className="flex items-center justify-center gap-3 mt-6 w-full">
              <button
                type="button"
                onClick={() => setNoteToDelete(null)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 text-xs sm:text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-xs shadow-red-500/25 transition-all cursor-pointer disabled:opacity-50"
              >
                {isDeleting && <Loader2 size={14} className="animate-spin" />}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeNotes;