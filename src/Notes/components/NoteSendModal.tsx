import React, { useState, useEffect } from "react";
import { Modal, message, Checkbox } from "antd";
import {
  Send,
  FileText,
  Paperclip,
  Folder,
  User,
  Layers,
  Sparkles,
  X,
} from "lucide-react";
import { Note } from "../types/notes.types";
import { getCleanDescriptionSnippet, sendNoteContent } from "../utils/notesHelpers";

interface NoteSendModalProps {
  open: boolean;
  note: Note | null;
  currentUser?: { loginId?: string; email?: string } | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const NoteSendModal: React.FC<NoteSendModalProps> = ({
  open,
  note,
  onClose,
  onSuccess,
}) => {
  const [recipientEmails, setRecipientEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState("");
  const [emailError, setEmailError] = useState("");
  const [subject, setSubject] = useState("");
  const [canView, setCanView] = useState(true);
  const [canEdit, setCanEdit] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [includeDescription, setIncludeDescription] = useState(true);
  const [includeFiles, setIncludeFiles] = useState(true);
  const [selectedFileKeys, setSelectedFileKeys] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Reset/Initialize state when note changes
  useEffect(() => {
    if (note && open) {
      setSubject("");
      setRecipientEmails([]);
      setEmailInput("");
      setEmailError("");
      setCanView(true);
      setCanEdit(false);
      setCanDelete(false);
      setIncludeDescription(true);
      setIncludeFiles(true);

      // Select all files by default
      const fileKeys = (note.attachments || []).map(
        (att) => att.key || att.fileKey || String(att.id)
      );
      setSelectedFileKeys(fileKeys);
    }
  }, [note, open]);

  if (!note) return null;

  const isProjectNote = note.type === "PROJECT";
  const attachments = note.attachments || [];

  // Email chip helpers matching Request Management exactly
  const addRecipientEmail = (email: string) => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;

    // Handle possible pasted comma/space separated emails
    if (trimmed.includes(",") || trimmed.includes(";") || trimmed.includes(" ")) {
      const parts = trimmed.split(/[,;\s]+/).map((e) => e.trim()).filter(Boolean);
      for (const part of parts) {
        if (!emailRegex.test(part)) {
          setEmailError("Please enter a valid email address.");
          return;
        }
      }
      setEmailError("");
      setRecipientEmails((prev) => {
        const next = [...prev];
        for (const part of parts) {
          if (!next.includes(part)) {
            next.push(part);
          }
        }
        return next;
      });
      setEmailInput("");
      return;
    }

    if (!emailRegex.test(trimmed)) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    setEmailError("");
    if (!recipientEmails.includes(trimmed)) {
      setRecipientEmails((prev) => [...prev, trimmed]);
    }
    setEmailInput("");
  };

  const removeRecipientEmail = (email: string) =>
    setRecipientEmails((prev) => prev.filter((e) => e !== email));

  // Attachment files selection helpers
  const isAllFilesSelected =
    attachments.length > 0 && selectedFileKeys.length === attachments.length;

  const handleToggleSelectAllFiles = (checked: boolean) => {
    if (checked) {
      setSelectedFileKeys(
        attachments.map((att) => att.key || att.fileKey || String(att.id))
      );
    } else {
      setSelectedFileKeys([]);
    }
  };

  const handleToggleFile = (fileKey: string, checked: boolean) => {
    if (checked) {
      setSelectedFileKeys((prev) => [...prev, fileKey]);
    } else {
      setSelectedFileKeys((prev) => prev.filter((k) => k !== fileKey));
    }
  };

  const handleSend = async () => {
    // If user typed an email but didn't press enter, add it automatically
    let currentEmails = [...recipientEmails];
    if (emailInput.trim()) {
      const pending = emailInput.trim().toLowerCase();
      if (emailRegex.test(pending)) {
        if (!currentEmails.includes(pending)) {
          currentEmails.push(pending);
          setRecipientEmails(currentEmails);
        }
        setEmailInput("");
        setEmailError("");
      } else {
        setEmailError(`"${pending}" is not a valid email address.`);
        message.error("Please enter a valid email address");
        return;
      }
    }

    if (currentEmails.length === 0) {
      setEmailError("Please enter a valid email address.");
      message.error("Please enter a valid recipient email address");
      return;
    }

    if (!canView && !canEdit && !canDelete) {
      message.error("Please select at least one permission (View, Edit, or Delete)");
      return;
    }

    // Validate that something is being sent
    const hasContent =
      includeDescription || (includeFiles && selectedFileKeys.length > 0);

    if (!hasContent) {
      message.error(
        "Please select at least one item (Description or Files) to send"
      );
      return;
    }

    setIsSending(true);
    const hideLoading = message.loading("Sending note to recipient(s)...", 0);

    const selectedPerms: string[] = [];
    if (canView) selectedPerms.push("CanView");
    if (canEdit) selectedPerms.push("CanEdit");
    if (canDelete) selectedPerms.push("CanDelete");
    if (selectedPerms.length === 0) selectedPerms.push("CanView");
    const permissionString = selectedPerms.join(",");

    try {
      await sendNoteContent({
        noteId: note.id,
        recipientEmail: currentEmails.join(", "),
        recipients: currentEmails,
        subject: subject.trim() || note.title || "WorkSphere Note",
        permission: permissionString,
        permissions: selectedPerms,
        canView,
        canEdit,
        canDelete,
        includeDescription,
        includeFiles,
        hasDocument: includeFiles,
        hasDescription: includeDescription,
        selectedAttachmentKeys: includeFiles ? selectedFileKeys : [],
      });

      hideLoading();
      setIsSending(false);
      message.success("Note sent successfully!");
      onSuccess?.();
      onClose();
    } catch (err: any) {
      hideLoading();
      setIsSending(false);
      console.error("Error sending note:", err);
      message.error("Failed to send note. Please try again.");
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      closeIcon={null}
      footer={null}
      width={620}
      centered
      className="note-send-modal"
      styles={{
        content: { padding: 0, borderRadius: "16px", overflow: "hidden" },
        body: { padding: 0 },
      } as any}
      destroyOnClose
    >
      <div className="flex flex-col max-h-[85vh] overflow-hidden bg-white">
        {/* Fixed Header */}
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-3.5 bg-white shrink-0">
          <div className="space-y-1 max-w-[85%]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#4318FF]/10 text-[#4318FF] flex items-center justify-center">
                <Send className="w-3.5 h-3.5 text-[#4318FF]" />
              </div>
              <h2 className="text-base font-bold text-[#1B2559]">Send & Share Note</h2>
            </div>

            <div className="pt-0.5">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wide truncate max-w-full ${
                  isProjectNote
                    ? "bg-indigo-50 text-[#4318FF] border border-indigo-100"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                }`}
              >
                {isProjectNote ? (
                  <Folder className="w-3.5 h-3.5 text-[#4318FF] shrink-0" />
                ) : (
                  <User className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                )}
                <span className="truncate">
                  {isProjectNote
                    ? `Project: ${note.projectName || "Worksphere"} - ${note.title}`
                    : `Personal Note - ${note.title}`}
                </span>
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Body with Compact Spacing */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar bg-white">
          {/* Email Field */}
          <div>
            <label className="text-xs font-bold text-[#2B3674] ml-1 block mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2 items-center">
              {recipientEmails.map((email) => (
                <span
                  key={email}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-200 text-gray-700 text-xs font-medium"
                >
                  <span>{email}</span>
                  <button
                    type="button"
                    onClick={() => removeRecipientEmail(email)}
                    className="text-gray-500 hover:text-red-600 focus:outline-none cursor-pointer"
                    aria-label={`Remove ${email}`}
                  >
                    ×
                  </button>
                </span>
              ))}

              <input
                type="text"
                value={emailInput}
                onChange={(e) => {
                  setEmailInput(e.target.value);
                  if (emailError) setEmailError("");
                }}
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" ||
                    e.key === "," ||
                    e.key === " "
                  ) {
                    e.preventDefault();
                    addRecipientEmail(emailInput);
                  }
                }}
                onBlur={() => {
                  if (emailInput.trim()) {
                    addRecipientEmail(emailInput);
                  }
                }}
                placeholder="Add email and press Enter"
                className="min-w-[180px] flex-1 px-3 py-1.5 border border-gray-200 rounded-xl bg-white text-gray-700 text-sm placeholder-gray-400 focus:border-[#4318FF] focus:ring-1 focus:ring-[#4318FF] outline-none"
              />

              {emailError && (
                <p className="text-red-500 text-xs mt-1 ml-1 w-full">
                  {emailError}
                </p>
              )}
            </div>
          </div>

          {/* Recipient Permission Checkboxes - View, Edit, Delete */}
          <div>
            <div className="flex items-center justify-between mb-1 ml-1">
              <label className="text-xs font-bold text-[#2B3674]">
                Permissions
              </label>
              <span className="text-[11px] text-slate-400">
                (Select permissions to grant)
              </span>
            </div>
            <div className="flex items-center gap-5 ml-1 p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl">
              <Checkbox
                checked={canView}
                onChange={(e) => setCanView(e.target.checked)}
                className="text-xs font-semibold text-slate-700 select-none cursor-pointer"
              >
                Can View
              </Checkbox>
              <Checkbox
                checked={canEdit}
                onChange={(e) => setCanEdit(e.target.checked)}
                className="text-xs font-semibold text-slate-700 select-none cursor-pointer"
              >
                Can Edit
              </Checkbox>
           
            </div>
          </div>

          {/* Subject Field */}
          <div>
            <label className="text-xs font-bold text-[#2B3674] ml-1 block mb-1">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter subject line..."
              className="w-full px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:border-[#4318FF] focus:ring-1 focus:ring-[#4318FF] outline-none transition font-medium"
            />
          </div>

          {/* Content Selection Checkboxes Section */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-[#1B2559] uppercase tracking-wider flex items-center gap-1.5 ml-1">
              <Layers className="w-3.5 h-3.5 text-[#4318FF]" />
              <span>Select Content To Include</span>
            </h3>

            {/* Note Content (Description & Files) */}
            <div className="p-3.5 bg-[#F8FAFC] rounded-xl border border-slate-200 space-y-3">
              {/* Description Checkbox & Scrollable Preview */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={includeDescription}
                    onChange={(e) => setIncludeDescription(e.target.checked)}
                  />
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#4318FF]" />
                    <span className="text-xs font-bold text-slate-800">
                      Include Note Description & Content
                    </span>
                  </div>
                </div>

                {includeDescription && (
                  <div className="ml-6 p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-700 leading-relaxed max-h-32 overflow-y-auto custom-scrollbar shadow-2xs break-words whitespace-pre-wrap">
                    {getCleanDescriptionSnippet(note.description, 3000) || (
                      <span className="text-slate-400 italic">No description entered</span>
                    )}
                  </div>
                )}
              </div>

              {/* Attachments Checkbox & File List */}
              {attachments.length > 0 && (
                <div className="pt-2.5 border-t border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={includeFiles}
                        onChange={(e) => setIncludeFiles(e.target.checked)}
                      />
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Paperclip className="w-3.5 h-3.5 text-[#4318FF]" />
                        <span>Include Uploaded Files ({attachments.length})</span>
                      </span>
                    </div>

                    {includeFiles && (
                      <div className="flex items-center gap-2 text-[11px]">
                        <button
                          type="button"
                          onClick={() => handleToggleSelectAllFiles(true)}
                          className="font-semibold text-[#4318FF] hover:underline cursor-pointer bg-transparent border-none p-0"
                        >
                          Select All
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          type="button"
                          onClick={() => handleToggleSelectAllFiles(false)}
                          className="font-semibold text-slate-500 hover:text-slate-700 cursor-pointer bg-transparent border-none p-0"
                        >
                          Deselect All
                        </button>
                      </div>
                    )}
                  </div>

                  {includeFiles && (
                    <div className="ml-6 flex flex-wrap gap-2 pt-0.5 max-h-32 overflow-y-auto custom-scrollbar">
                      {attachments.map((att) => {
                        const fileKey = att.key || att.fileKey || String(att.id);
                        const isSelected = selectedFileKeys.includes(fileKey);
                        const name = att.fileName || att.name || "Attachment";
                        const size = att.fileSize ? `${Math.round(att.fileSize / 1024)} KB` : "";

                        return (
                          <div
                            key={`send-att-${fileKey}`}
                            onClick={() => handleToggleFile(fileKey, !isSelected)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                              isSelected
                                ? "bg-white border-[#4318FF] text-[#4318FF] shadow-xs"
                                : "bg-white/70 border-slate-200 text-slate-600 hover:bg-white"
                            }`}
                          >
                            <Checkbox
                              checked={isSelected}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleToggleFile(fileKey, e.target.checked);
                              }}
                              className="pointer-events-none"
                            />
                            <Paperclip className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[170px]">{name}</span>
                            {size && <span className="text-[10px] text-slate-400 font-normal">({size})</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Fixed Modal Footer Actions */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-white shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-[#4318FF]" />
            <span>Sends note content to recipients</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSend}
              disabled={isSending}
              className="px-4 py-1.5 bg-[#4318FF] hover:bg-[#320fe0] text-white font-semibold text-xs rounded-xl shadow-md shadow-[#4318FF]/20 hover:shadow-lg transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5 text-white" />
              <span>{isSending ? "Sending..." : "Send Note"}</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default NoteSendModal;
