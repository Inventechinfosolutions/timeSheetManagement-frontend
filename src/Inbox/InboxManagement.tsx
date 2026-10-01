import React, { useEffect, useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks';
import {
  fetchInbox,
  fetchInboxCounts,
  markInboxAsRead,
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
} from 'lucide-react';
import { Modal, message, Popconfirm, Tooltip } from 'antd';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { NoteEditor, NoteView } from '../Notes/components';
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
  const notesMgr = useNotesManagement();

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

  const handleMarkAsRead = (item: InboxItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    dispatch(markInboxAsRead(item.inboxId));
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

  const handleOpenItem = async (item: InboxItem) => {
    setSelectedInboxItem(item);
    if (!item.isRead) {
      dispatch(markInboxAsRead(item.inboxId));
    }
    if (item.note) {
      await notesMgr.handleStartView(item.note as Note);
    } else if (item.notesId) {
      try {
        const note = await dispatch(fetchNoteById(item.notesId)).unwrap();
        if (note) {
          await notesMgr.handleStartView(note);
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
      await notesMgr.handleStartEdit(item.note as Note);
    } else if (item.notesId) {
      try {
        const note = await dispatch(fetchNoteById(item.notesId)).unwrap();
        if (note) {
          await notesMgr.handleStartEdit(note);
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

  const cleanSnippet = (htmlOrText?: string, max = 160) => {
    if (!htmlOrText) return 'No note content provided.';
    const text = htmlOrText.replace(/<[^>]*>?/gm, '').trim();
    if (text.length <= max) return text;
    return text.substring(0, max) + '...';
  };

  // 1. Full Page Edit Mode
  if (notesMgr.pageMode === 'edit' && notesMgr.activeNote) {
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
          totalAttachmentsCount={notesMgr.totalAttachmentsCount}
          editorRef={notesMgr.editorRef}
          fileInputRef={notesMgr.fileInputRef}
          doclingJsonInputRef={notesMgr.doclingJsonInputRef}
          onEditorInput={notesMgr.handleEditorInput}
          onExecuteCommand={notesMgr.executeEditorCommand}
          onInsertLink={notesMgr.handleInsertLink}
          onDoclingUpload={notesMgr.handleDoclingJsonUpload}
          onFileChange={notesMgr.handleFileChange}
          onProcessDropFiles={notesMgr.handleProcessUploadFiles}
          onRemoveAttachment={notesMgr.handleRemoveSelectedFile}
          onDeleteServerAttachment={notesMgr.handleDeleteAttachment}
          onPreviewAttachment={notesMgr.handlePreviewAttachment}
          onDownloadAttachment={notesMgr.handleDownloadAttachment}
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

        {/* Global Image Preview Modal */}
        <Modal
          open={notesMgr.previewImageModal.open}
          onCancel={() => notesMgr.setPreviewImageModal({ open: false, url: '', title: '' })}
          footer={null}
          title={notesMgr.previewImageModal.title}
          width={800}
        >
          <div className="flex items-center justify-center p-4">
            <img
              src={notesMgr.previewImageModal.url}
              alt="Preview"
              className="max-h-[70vh] object-contain rounded-lg"
            />
          </div>
        </Modal>

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
          canEdit={canEditNote(selectedInboxItem?.permission)}
          onStartEdit={notesMgr.handleStartEdit}
          onBack={() => {
            notesMgr.handleBackToList();
            setSelectedInboxItem(null);
          }}
          onPreviewAttachment={notesMgr.handlePreviewAttachment}
          onDownloadAttachment={notesMgr.handleDownloadAttachment}
          onTogglePin={notesMgr.handleTogglePin}
          onToggleArchive={notesMgr.handleToggleArchive}
        />

        {/* Global Image Preview Modal */}
        <Modal
          open={notesMgr.previewImageModal.open}
          onCancel={() => notesMgr.setPreviewImageModal({ open: false, url: '', title: '' })}
          footer={null}
          title={notesMgr.previewImageModal.title}
          width={800}
        >
          <div className="flex items-center justify-center p-4">
            <img
              src={notesMgr.previewImageModal.url}
              alt="Preview"
              className="max-h-[70vh] object-contain rounded-lg"
            />
          </div>
        </Modal>

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
    <div className="p-4 md:p-6 w-full max-w-7xl mx-auto space-y-5">
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
                onClick={() => handleOpenItem(item)}
                className={`group relative p-4.5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                  isUnread
                    ? 'bg-white border-[#4318FF]/30 shadow-sm shadow-indigo-100/50 hover:border-[#4318FF]'
                    : 'bg-white/80 hover:bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs'
                }`}
              >
                {/* Left blue unread accent bar */}
                {isUnread && (
                  <div className="absolute left-0 top-3 bottom-3 w-1.5 bg-[#4318FF] rounded-r-full" />
                )}

                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                  {/* Sender / Receiver Info & Header */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    {/* Avatar Badge */}
                    <div className="w-11 h-11 rounded-full bg-[#EDE9FE] text-[#6366F1] font-bold text-sm flex items-center justify-center shrink-0">
                      {avatarInitials}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-[#1B2559]">
                            {isSentMode ? `To: ${displayName}` : displayName}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            &lt;{displayEmail}&gt;
                          </span>
                        </div>

                        {/* Badges Row matching User UI */}
                        <div className="flex items-center gap-1.5 flex-wrap ml-1.5">
                          {displayDesignation && (
                            <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[11px] font-medium flex items-center gap-1">
                              <User className="w-3 h-3 text-slate-400" />
                              <span>{displayDesignation}</span>
                            </span>
                          )}

                          {/* View Pill Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenItem(item);
                            }}
                            className="px-2.5 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-md text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer shadow-2xs"
                            title="View Note"
                          >
                            <Eye className="w-3 h-3 text-blue-500" />
                            <span>View</span>
                          </button>

                          {/* Edit Pill Button (when editable) */}
                          {isEditable && (
                            <button
                              type="button"
                              onClick={(e) => handleStartEditItem(item, e)}
                              className="px-2.5 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 rounded-md text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer shadow-2xs"
                              title="Edit Note"
                            >
                              <Edit3 className="w-3 h-3 text-emerald-500" />
                              <span>Edit</span>
                            </button>
                          )}

                          {/* Delete Pill Button */}
                          <Popconfirm
                            title={isSentMode ? "Delete this message from your sent box?" : "Delete this message from your inbox?"}
                            onConfirm={(e) => handleDeleteItem(item.inboxId, e as any)}
                            okText="Delete"
                            cancelText="Cancel"
                            okButtonProps={{ danger: true }}
                          >
                            <button
                              type="button"
                              onClick={(e) => e.stopPropagation()}
                              className="px-2.5 py-0.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-md text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer shadow-2xs"
                              title={isSentMode ? "Delete from sent" : "Delete from inbox"}
                            >
                              <Trash2 className="w-3 h-3 text-red-500" />
                              <span>Delete</span>
                            </button>
                          </Popconfirm>

                          {isUnread && (
                            <span className="px-2 py-0.5 bg-indigo-50 text-[#4318FF] text-[10px] font-bold rounded-full border border-indigo-100 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#4318FF] animate-pulse" />
                              New Note
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Note Title & Project */}
                      <div className="flex items-center gap-2 mt-2 mb-1">
                        <h4 className="text-sm font-bold text-slate-800">
                          {item.note?.title || 'Shared Note'}
                        </h4>

                        {item.note?.projectName && (
                          <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-[10px] font-semibold rounded-md border border-purple-100">
                            📁 {item.note.projectName}
                          </span>
                        )}
                      </div>

                      {/* Note Description Snippet */}
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {cleanSnippet(item.note?.description)}
                      </p>

                      {/* Attachments and Meta Footer */}
                      <div className="flex flex-wrap items-center gap-3 mt-3 pt-2 border-t border-slate-100">
                        {hasAttachments && (
                          <div className="flex items-center gap-1.5 text-xs text-[#7C3AED] bg-[#F5F3FF] px-2.5 py-1 rounded-lg border border-[#DDD6FE]">
                            <Paperclip className="w-3.5 h-3.5" />
                            <span className="font-semibold text-[11px]">
                              {item.note?.attachments?.length} Attached File(s)
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{dayjs(item.createdAt).fromNow()}</span>
                          <span>•</span>
                          <span>{dayjs(item.createdAt).format('MMM DD, YYYY hh:mm A')}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions (Right Side: Mark as read button for INBOX only) */}
                  {!isSentMode && (
                    <div className="flex items-center gap-2 self-end md:self-start shrink-0 pt-2 md:pt-0">
                      <Tooltip title={isUnread ? 'Mark as read' : 'Already read'}>
                        <button
                          onClick={(e) => handleMarkAsRead(item, e)}
                          className={`p-2 rounded-xl border transition cursor-pointer ${
                            isUnread
                              ? 'bg-white hover:bg-indigo-50 text-[#4318FF] border-indigo-200'
                              : 'bg-slate-50 text-slate-400 hover:text-slate-600 border-slate-200'
                          }`}
                        >
                          {isUnread ? <Mail className="w-4 h-4" /> : <MailOpen className="w-4 h-4" />}
                        </button>
                      </Tooltip>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Global Image Preview Modal */}
      <Modal
        open={notesMgr.previewImageModal.open}
        onCancel={() => notesMgr.setPreviewImageModal({ open: false, url: '', title: '' })}
        footer={null}
        title={notesMgr.previewImageModal.title}
        width={800}
      >
        <div className="flex items-center justify-center p-4">
          <img
            src={notesMgr.previewImageModal.url}
            alt="Preview"
            className="max-h-[70vh] object-contain rounded-lg"
          />
        </div>
      </Modal>

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
