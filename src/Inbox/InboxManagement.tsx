import React, { useEffect, useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks';
import {
  fetchInbox,
  fetchInboxCounts,
  markInboxAsRead,
  toggleInboxStar,
  deleteInboxItem,
  InboxItem,
} from '../reducers/inbox.reducer';
import {
  Mail,
  MailOpen,
  Trash2,
  Paperclip,
  User,
  Eye,
  Clock,
  Edit3,
  Send,
  Inbox,
  Star,
} from 'lucide-react';
import { Modal, message, Tooltip } from 'antd';
import { PopconfirmWithTooltip } from '../components/ui/PopconfirmWithTooltip';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { NoteEditor, NoteView } from '../Notes/components';
import DocumentPreviewModal from '../Notes/components/DocumentPreviewModal';
import { useNotesManagement } from '../Notes/hooks/useNotesManagement';
import ExcelViewerModal from '../components/ExcelViewerModal';
import { Note } from '../Notes/types/notes.types';
import { fetchNoteById } from '../reducers/notes.reducer';
import SearchBox from '../components/ui/SearchBox';
import { InboxFolder, InboxTab } from '../enums';

dayjs.extend(relativeTime);

const canEditNote = (permission?: string): boolean => {
  if (!permission) return false;
  const p = permission.toLowerCase();
  return p === 'canedit' || p === 'edit' || p.includes('edit');
};

export const InboxManagement: React.FC = () => {
  const dispatch = useAppDispatch();
  const { items, counts, loading } = useAppSelector((state) => state.inbox);
  const notesMgr = useNotesManagement({ loadList: false });

  const [folder, setFolder] = useState<InboxFolder>(InboxFolder.INBOX);
  const [activeTab, setActiveTab] = useState<InboxTab>(InboxTab.ALL);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedInboxItem, setSelectedInboxItem] = useState<InboxItem | null>(null);

  useEffect(() => {
    dispatch(
      fetchInbox({
        folder,
        search: debouncedSearch.trim() || undefined,
      })
    );
    dispatch(fetchInboxCounts());
  }, [dispatch, folder, debouncedSearch]);

  // Notify layout when user is inside the Note Workspace (create, edit, view) vs List mode in Inbox
  useEffect(() => {
    const isWorkspace =
      notesMgr.pageMode === "create" ||
      notesMgr.pageMode === "edit" ||
      notesMgr.pageMode === "view";
    window.dispatchEvent(
      new CustomEvent("note-workspace-mode", { detail: { isWorkspace } })
    );
    return () => {
      window.dispatchEvent(
        new CustomEvent("note-workspace-mode", { detail: { isWorkspace: false } })
      );
    };
  }, [notesMgr.pageMode]);

  const handleToggleStar = (item: InboxItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    dispatch(toggleInboxStar(item.inboxId))
      .unwrap()
      .then((result) => {
        message.success(Number(result?.isStarred) === 1 ? 'Starred' : 'Star removed');
      })
      .catch((err) => {
        message.error(err || 'Failed to update star');
      });
  };

  const handleMarkAsRead = (item: InboxItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!item.isRead) {
      dispatch(markInboxAsRead(item.inboxId))
        .unwrap()
        .then(() => {
          message.success('Marked as read');
        })
        .catch(() => {
          // ignore
        });
    } else {
      message.info('Already marked as read');
    }
  };

  const handleDeleteItem = (inboxId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    dispatch(deleteInboxItem(inboxId))
      .unwrap()
      .then(() => {
        message.success(folder === InboxFolder.SENT ? 'Message removed from sent' : 'Message removed from inbox');
        if (selectedInboxItem?.inboxId === inboxId) {
          notesMgr.handleBackToList();
          setSelectedInboxItem(null);
        }
      })
      .catch((err) => {
        message.error(err || 'Failed to delete item');
      });
  };

  /** Apply send-time flags so recipients only see description/files the sender included */
  const noteForInboxAccess = (item: InboxItem, note: Note): Note => ({
    ...note,
    description: item.hasDescription !== false ? note.description || "" : "",
    attachments: item.hasDocument ? note.attachments || [] : [],
  });

  const handleOpenItem = async (item: InboxItem) => {
    setSelectedInboxItem(item);
    if (!item.isRead) {
      dispatch(markInboxAsRead(item.inboxId));
    }
    if (item.note) {
      await notesMgr.handleStartView(noteForInboxAccess(item, item.note as Note));
    } else if (item.notesId) {
      try {
        const note = await dispatch(fetchNoteById(item.notesId)).unwrap();
        if (note) {
          await notesMgr.handleStartView(noteForInboxAccess(item, note));
        }
      } catch (err) {
        message.error('Failed to load note details');
      }
    }
  };

  const handleStartEditItem = async (item: InboxItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedInboxItem(item);
    if (!item.isRead) {
      dispatch(markInboxAsRead(item.inboxId));
    }
    if (item.note) {
      await notesMgr.handleStartEdit(noteForInboxAccess(item, item.note as Note));
    } else if (item.notesId) {
      try {
        const note = await dispatch(fetchNoteById(item.notesId)).unwrap();
        if (note) {
          await notesMgr.handleStartEdit(noteForInboxAccess(item, note));
        }
      } catch (err) {
        message.error('Failed to load note details for editing');
      }
    }
  };

  // Filter items (status tabs filter client-side for INBOX only, search filters from backend)
  const filteredItems = useMemo(() => {
    if (folder === InboxFolder.SENT) return items;
    return items.filter((item) => {
      // Tab filter
      if (activeTab === InboxTab.UNREAD && item.isRead) return false;
      if (activeTab === InboxTab.READ && !item.isRead) return false;
      return true;
    });
  }, [items, folder, activeTab]);

  const getInitials = (name?: string, email?: string) => {
    if (name && name.trim()) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    }
    if (email && email.trim()) {
      return email.substring(0, 2).toUpperCase();
    }
    return 'WS';
  };

  // 1. Full Page Edit or Create Mode
  if ((notesMgr.pageMode === 'edit' || notesMgr.pageMode === 'create') && (notesMgr.activeNote || notesMgr.pageMode === 'create')) {
    return (
      <div className="w-full min-h-full">
        <NoteEditor
          formData={notesMgr.formData}
          setFormData={notesMgr.setFormData}
          parentNoteContext={notesMgr.parentNoteContext}
          activeNote={notesMgr.activeNote}
          actionLoading={notesMgr.actionLoading}
          showSaveToast={notesMgr.showSaveToast}
          isDraggingModalFile={notesMgr.isDraggingModalFile}
          setIsDraggingModalFile={notesMgr.setIsDraggingModalFile}
          textColor={notesMgr.textColor}
          setTextColor={notesMgr.setTextColor}
          highlightColor={notesMgr.highlightColor}
          setHighlightColor={notesMgr.setHighlightColor}
          isImportingDocling={notesMgr.isImportingDocling}
          isExtractingExcel={notesMgr.isExtractingExcel}
          totalAttachmentsCount={notesMgr.totalAttachmentsCount}
          editorRef={notesMgr.editorRef}
          fileInputRef={notesMgr.fileInputRef}
          doclingJsonInputRef={notesMgr.doclingJsonInputRef}
          excelExtractInputRef={notesMgr.excelExtractInputRef}
          onEditorInput={notesMgr.handleEditorInput}
          onExecuteCommand={notesMgr.executeEditorCommand}
          onInsertLink={notesMgr.handleInsertLink}
          onDoclingUpload={notesMgr.handleDoclingJsonUpload}
          onExcelExtract={notesMgr.handleExcelExtract}
          onFileChange={notesMgr.handleFileChange}
          onProcessDropFiles={notesMgr.handleProcessUploadFiles}
          onRemoveAttachment={notesMgr.handleRemoveSelectedFile}
          onDeleteServerAttachment={notesMgr.handleDeleteAttachment}
          onPreviewAttachment={notesMgr.handlePreviewAttachment}
          onDownloadAttachment={notesMgr.handleDownloadAttachment}
          onPreviewImage={(url, title) =>
            notesMgr.setPreviewImageModal({
              open: true,
              url,
              title: title || "Screenshot",
            })
          }
          onSubmit={async (e) => {
            await notesMgr.handleSubmitForm(e);
            dispatch(fetchInbox({ folder }));
            dispatch(fetchInboxCounts());
          }}
          onBack={() => {
            notesMgr.handleBackToList();
            setSelectedInboxItem(null);
          }}
        />

        {/* Global In-App Document & Image Preview Modal (Card View) */}
        <DocumentPreviewModal
          open={notesMgr.previewImageModal.open}
          url={notesMgr.previewImageModal.url}
          title={notesMgr.previewImageModal.title}
          onClose={() => notesMgr.setPreviewImageModal({ open: false, url: '', title: '' })}
        />

        {/* Global Excel Spreadsheet Preview Modal */}
        <ExcelViewerModal
          open={notesMgr.excelViewerModal.open}
          onClose={() => notesMgr.setExcelViewerModal({ open: false, fileName: '', blob: null, file: null })}
          fileName={notesMgr.excelViewerModal.fileName}
          blob={notesMgr.excelViewerModal.blob}
          file={notesMgr.excelViewerModal.file}
          onDownload={notesMgr.excelViewerModal.onDownload}
        />
      </div>
    );
  }

  // 2. Full Page View Mode
  if (notesMgr.pageMode === 'view' && notesMgr.activeNote) {
    return (
      <div className="w-full min-h-full">
        <NoteView
          activeNote={notesMgr.activeNote}
          excelWorkbook={notesMgr.formData.excelWorkbook}
          canEdit={canEditNote(selectedInboxItem?.permission)}
          onStartEdit={notesMgr.handleStartEdit}
          onBack={() => {
            notesMgr.handleBackToList();
            setSelectedInboxItem(null);
          }}
          onPreviewAttachment={notesMgr.handlePreviewAttachment}
          onDownloadAttachment={notesMgr.handleDownloadAttachment}
          onPreviewImage={(url, title) =>
            notesMgr.setPreviewImageModal({
              open: true,
              url,
              title: title || "Screenshot",
            })
          }
          onTogglePin={notesMgr.handleTogglePin}
          onToggleArchive={notesMgr.handleToggleArchive}
        />

        {/* Global In-App Document & Image Preview Modal (Card View) */}
        <DocumentPreviewModal
          open={notesMgr.previewImageModal.open}
          url={notesMgr.previewImageModal.url}
          title={notesMgr.previewImageModal.title}
          onClose={() => notesMgr.setPreviewImageModal({ open: false, url: '', title: '' })}
        />

        {/* Global Excel Spreadsheet Preview Modal */}
        <ExcelViewerModal
          open={notesMgr.excelViewerModal.open}
          onClose={() => notesMgr.setExcelViewerModal({ open: false, fileName: '', blob: null, file: null })}
          fileName={notesMgr.excelViewerModal.fileName}
          blob={notesMgr.excelViewerModal.blob}
          file={notesMgr.excelViewerModal.file}
          onDownload={notesMgr.excelViewerModal.onDownload}
        />
      </div>
    );
  }

  // 3. Main Inbox List View
  return (
    <div className="w-full min-h-full bg-[#F4F7FE] p-3 sm:p-4 md:p-6 flex flex-col gap-4 font-sans">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-2xl shadow-xs border border-slate-100">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4318FF] to-[#7052FF] flex items-center justify-center text-white shadow-md shadow-[#4318FF]/20 shrink-0">
            {folder === 'SENT' ? <Send className="w-6 h-6" /> : <Inbox className="w-6 h-6" />}
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-[#1B2559]">
              {folder === 'SENT' ? 'Sent Notes' : 'My Notes'}
            </h1>
            <p className="text-xs md:text-sm text-slate-500 mt-0.5">
              {folder === 'SENT'
                ? 'Review notes and documents you have sent and shared with team members.'
                : 'Access and review all shared notes, updates, and documents sent to you by team members.'}
            </p>
          </div>
        </div>

        {/* Gmail-style Folder Toggle: Inbox vs Sent */}
        <div className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200/60 self-start md:self-center">
          <button
            type="button"
            onClick={() => {
              setFolder(InboxFolder.INBOX);
              setActiveTab(InboxTab.ALL);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              folder === InboxFolder.INBOX
                ? 'bg-white text-[#4318FF] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>Inbox</span>
            {(counts?.unread ?? 0) > 0 && (
              <span className="px-1.5 py-0.2 bg-[#4318FF] text-white text-[10px] font-bold rounded-full">
                {counts.unread}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setFolder(InboxFolder.SENT);
              setActiveTab(InboxTab.ALL);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              folder === InboxFolder.SENT
                ? 'bg-white text-[#4318FF] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Sent</span>
            {(counts?.sent ?? 0) > 0 && (
              <span className={`px-1.5 py-0.2 text-[10px] font-bold rounded-full ${
                folder === InboxFolder.SENT ? 'bg-[#4318FF]/10 text-[#4318FF]' : 'bg-slate-200 text-slate-700'
              }`}>
                {counts.sent}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl shadow-xs border border-slate-100">
        {folder === InboxFolder.INBOX ? (
          /* Tab Pills (Inbox only) */
          <div className="flex items-center gap-1.5 w-full sm:w-auto bg-slate-100/80 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab(InboxTab.ALL)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === InboxTab.ALL
                  ? 'bg-white text-[#4318FF] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>All Notes</span>
              <span className="text-[11px] px-1.5 py-0.2 bg-slate-200/60 rounded-full">
                {debouncedSearch.trim() ? items.length : (counts?.inbox ?? 0)}
              </span>
            </button>

            <button
              onClick={() => setActiveTab(InboxTab.UNREAD)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === InboxTab.UNREAD
                  ? 'bg-white text-[#4318FF] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Unread</span>
              {(debouncedSearch.trim()
                ? items.filter((i) => !i.isRead).length
                : (counts?.unread ?? 0)) > 0 && (
                <span className="text-[11px] px-1.5 py-0.2 bg-[#4318FF] text-white rounded-full">
                  {debouncedSearch.trim()
                    ? items.filter((i) => !i.isRead).length
                    : (counts?.unread ?? 0)}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab(InboxTab.READ)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === InboxTab.READ
                  ? 'bg-white text-[#4318FF] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Read</span>
              <span className="text-[11px] px-1.5 py-0.2 bg-slate-200/60 rounded-full">
                {debouncedSearch.trim()
                  ? items.filter((i) => i.isRead).length
                  : (counts?.read ?? 0)}
              </span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 px-2 py-1">
            <span>Sent Messages</span>
            <span className="px-2 py-0.5 bg-[#4318FF]/10 text-[#4318FF] font-bold rounded-full text-xs">
              {debouncedSearch.trim() ? items.length : (counts?.sent ?? 0)}
            </span>
          </div>
        )}

        {/* Search Input using UI SearchBox */}
        <SearchBox
          placeholder={folder === InboxFolder.SENT ? "Search sent by title, recipient, content..." : "Search inbox by title, sender, content..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onDebounce={(val) => setDebouncedSearch(val)}
          onClear={() => {
            setSearchQuery('');
            setDebouncedSearch('');
          }}
          containerClassName="w-full sm:w-80"
        />
      </div>

      {/* Inbox Items List */}
      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-100 min-h-[350px] text-center">
          <div className="w-16 h-16 rounded-3xl bg-indigo-50 flex items-center justify-center text-[#4318FF] mb-4">
            {folder === 'SENT' ? <Send className="w-8 h-8" /> : <MailOpen className="w-8 h-8" />}
          </div>
          <h3 className="text-base font-bold text-slate-800">
            {folder === 'SENT' ? 'No sent notes found' : 'No received notes found'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            {searchQuery
              ? 'No messages match your search filter. Try clearing or changing the search keywords.'
              : folder === 'SENT'
              ? 'Notes and documents you share with teammates will appear here in your Sent box.'
              : activeTab === 'UNREAD'
              ? 'You are all caught up! No unread notes in your inbox.'
              : 'When teammates share notes with you, they will appear here in your Inbox.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const isSentMode = folder === 'SENT';
            const hasAttachments = item.note?.attachments && item.note.attachments.length > 0;
            const isUnread = !isSentMode && !item.isRead;
            const isStarred = Number(item.isStarred) === 1;
            const isEditable = canEditNote(item.permission);

            const displayName = isSentMode
              ? (item.receiverName || item.toMail)
              : (item.senderName || item.fromMail);
            const displayEmail = isSentMode ? item.toMail : item.fromMail;
            const displayDesignation = isSentMode ? item.receiverDesignation : item.senderDesignation;
            const avatarInitials = isSentMode
              ? getInitials(item.receiverName, item.toMail)
              : getInitials(item.senderName, item.fromMail);

            return (
              <div
                key={`inbox-item-${item.inboxId}`}
                className={`group relative p-4.5 rounded-2xl border transition-all duration-200 ${
                  isUnread
                    ? 'bg-white border-[#4318FF]/30 shadow-sm shadow-indigo-100/50 hover:border-[#4318FF]'
                    : 'bg-white/80 hover:bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs'
                }`}
              >
                {/* Left blue unread accent bar */}
                {isUnread && (
                  <div className="absolute left-0 top-3 bottom-3 w-1.5 bg-[#4318FF] rounded-r-full" />
                )}

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
                  {/* Left Column: Sender / Receiver Identity */}
                  <div className="flex items-center gap-3 shrink-0 min-w-0 md:max-w-xs lg:max-w-sm">
                    {/* Avatar Badge */}
                    <div className="w-10 h-10 rounded-full bg-[#EDE9FE] text-[#6366F1] font-bold text-sm flex items-center justify-center shrink-0 shadow-2xs">
                      {avatarInitials}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-bold text-[#1B2559] truncate">
                          {isSentMode ? `To: ${displayName}` : displayName}
                        </span>
                        {displayDesignation && (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-medium flex items-center gap-1 shrink-0">
                            <User className="w-2.5 h-2.5 text-slate-400" />
                            <span>{displayDesignation}</span>
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        &lt;{displayEmail}&gt;
                      </div>
                    </div>
                  </div>

                  {/* Middle Column: Title/Subject & Context Badges (fills the middle space beautifully) */}
                  <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0 lg:px-3">
                    <div className="flex items-baseline gap-1.5 min-w-0">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide shrink-0">
                        Title/Subject:
                      </span>
                      <h4 className="text-xs sm:text-sm font-semibold text-slate-800 truncate max-w-xs md:max-w-sm xl:max-w-md">
                        {item.note?.title || 'Shared Note'}
                      </h4>
                    </div>

                    {/* Nomenclature Badge */}
                    {item.note?.projectName ? (
                      <span className="px-2 py-0.5 bg-indigo-50 text-[#4318FF] text-[10px] font-semibold rounded-md border border-indigo-100 flex items-center gap-1 shrink-0">
                        📁 {item.note.projectName}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-semibold rounded-md border border-emerald-100 flex items-center gap-1 shrink-0">
                        <User className="w-2.5 h-2.5 text-emerald-600" />
                        Personal Note
                      </span>
                    )}

                    {/* Attachments Pill */}
                    {hasAttachments && (
                      <div className="flex items-center gap-1 text-[11px] text-[#7C3AED] bg-[#F5F3FF] px-2.5 py-0.5 rounded-md border border-[#DDD6FE] shrink-0 font-semibold shadow-2xs">
                        <Paperclip className="w-3 h-3" />
                        <span>{item.note?.attachments?.length} Attached File(s)</span>
                      </div>
                    )}

                    {isUnread && (
                      <span className="px-2 py-0.5 bg-indigo-50 text-[#4318FF] text-[10px] font-bold rounded-full border border-indigo-100 flex items-center gap-1 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#4318FF] animate-pulse" />
                        New
                      </span>
                    )}
                  </div>

                  {/* Right Column: Timestamp & Action Buttons */}
                  <div className="flex items-center justify-between lg:justify-end gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 whitespace-nowrap">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{dayjs(item.createdAt).fromNow()}</span>
                      <span className="hidden xl:inline">•</span>
                      <span className="hidden xl:inline">{dayjs(item.createdAt).format('MMM DD, YYYY hh:mm A')}</span>
                    </div>

                    {/* Actions: Icon-only View, Edit, Delete, and Mark as read buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                    <Tooltip title={isStarred ? 'Remove star' : 'Star'} placement="top">
                      <button
                        type="button"
                        onClick={(e) => handleToggleStar(item, e)}
                        className={`w-8 h-8 flex items-center justify-center border rounded-lg transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95 ${
                          isStarred
                            ? 'bg-amber-50 text-amber-500 border-amber-200 hover:bg-amber-100'
                            : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-amber-50 hover:text-amber-500 hover:border-amber-200'
                        }`}
                        aria-label={isStarred ? 'Remove star' : 'Star'}
                      >
                        <Star className={`w-4 h-4 ${isStarred ? 'fill-amber-400 text-amber-500' : ''}`} />
                      </button>
                    </Tooltip>

                    {/* View Icon Button */}
                    <Tooltip title="View Note" placement="top">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenItem(item);
                        }}
                        className="w-8 h-8 flex items-center justify-center bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-lg transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                        aria-label="View Note"
                      >
                        <Eye className="w-4 h-4 text-blue-500" />
                      </button>
                    </Tooltip>

                    {/* Edit Icon Button (when editable) */}
                    {isEditable && (
                      <Tooltip title="Edit Note" placement="top">
                        <button
                          type="button"
                          onClick={(e) => handleStartEditItem(item, e)}
                          className="w-8 h-8 flex items-center justify-center bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 rounded-lg transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                          aria-label="Edit Note"
                        >
                          <Edit3 className="w-4 h-4 text-emerald-500" />
                        </button>
                      </Tooltip>
                    )}

                    {/* Delete Icon Button */}
                    <PopconfirmWithTooltip
                      title={isSentMode ? "Delete this message from your sent box?" : "Delete this message from your inbox?"}
                      tooltipTitle={isSentMode ? "Delete from sent" : "Delete from inbox"}
                      onConfirm={(e) => handleDeleteItem(item.inboxId, e as any)}
                      okText="Delete"
                      cancelText="Cancel"
                      okButtonProps={{ danger: true }}
                    >
                      <button
                        type="button"
                        onClick={(e) => e.stopPropagation()}
                        className="w-8 h-8 flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                        aria-label={isSentMode ? "Delete from sent" : "Delete from inbox"}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </PopconfirmWithTooltip>

                    {/* Mark as read button (INBOX only) */}
                    {!isSentMode && (
                      <Tooltip title="Mark as read" placement="top" color="#4318FF">
                        <button
                          type="button"
                          onClick={(e) => handleMarkAsRead(item, e)}
                          className={`relative w-8 h-8 rounded-lg border transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-md hover:scale-105 active:scale-95 flex items-center justify-center ${
                            isUnread
                              ? 'bg-indigo-50/90 text-[#4318FF] border-indigo-200 hover:bg-[#4318FF] hover:text-white hover:border-[#4318FF]'
                              : 'bg-indigo-50/40 text-[#4318FF]/80 border-indigo-100 hover:bg-[#4318FF] hover:text-white hover:border-[#4318FF]'
                          }`}
                          aria-label="Mark as read"
                        >
                          {isUnread && (
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                          )}
                          {isUnread ? <Mail className="w-4 h-4" /> : <MailOpen className="w-4 h-4" />}
                        </button>
                      </Tooltip>
                    )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Global In-App Document & Image Preview Modal (Card View) */}
      <DocumentPreviewModal
        open={notesMgr.previewImageModal.open}
        url={notesMgr.previewImageModal.url}
        title={notesMgr.previewImageModal.title}
        onClose={() => notesMgr.setPreviewImageModal({ open: false, url: '', title: '' })}
      />

      {/* Global Excel Spreadsheet Preview Modal */}
      <ExcelViewerModal
        open={notesMgr.excelViewerModal.open}
        onClose={() => notesMgr.setExcelViewerModal({ open: false, fileName: '', blob: null, file: null })}
        fileName={notesMgr.excelViewerModal.fileName}
        blob={notesMgr.excelViewerModal.blob}
        file={notesMgr.excelViewerModal.file}
        onDownload={notesMgr.excelViewerModal.onDownload}
      />
    </div>
  );
};

export default InboxManagement;
