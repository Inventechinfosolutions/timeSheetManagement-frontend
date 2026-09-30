import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks';
import {
  fetchInbox,
  fetchInboxUnreadCount,
  markInboxAsRead,
  markAllInboxAsRead,
  deleteInboxItem,
  InboxItem,
} from '../reducers/inbox.reducer';
import {
  Mail,
  MailOpen,
  Inbox as InboxIcon,
  Search,
  CheckCircle2,
  Trash2,
  Paperclip,
  Calendar,
  User,
  Eye,
  RefreshCw,
  Sparkles,
  Download,
  FileText,
  Clock,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { Modal, message, Popconfirm, Tooltip } from 'antd';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export const InboxManagement: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { items, unreadCount, loading } = useAppSelector((state) => state.inbox);

  const [activeTab, setActiveTab] = useState<'ALL' | 'UNREAD' | 'READ'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInboxItem, setSelectedInboxItem] = useState<InboxItem | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchInbox({}));
    dispatch(fetchInboxUnreadCount());
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(fetchInbox({}));
    dispatch(fetchInboxUnreadCount());
    message.success('Inbox refreshed');
  };

  const handleMarkAsRead = (item: InboxItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    dispatch(markInboxAsRead(item.inboxId));
  };

  const handleMarkAllAsRead = () => {
    dispatch(markAllInboxAsRead())
      .unwrap()
      .then(() => {
        message.success('All messages marked as read');
        dispatch(fetchInboxUnreadCount());
      })
      .catch((err) => {
        message.error(err || 'Failed to mark all as read');
      });
  };

  const handleDeleteItem = (inboxId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    dispatch(deleteInboxItem(inboxId))
      .unwrap()
      .then(() => {
        message.success('Message removed from inbox');
        if (selectedInboxItem?.inboxId === inboxId) {
          setIsViewModalOpen(false);
          setSelectedInboxItem(null);
        }
      })
      .catch((err) => {
        message.error(err || 'Failed to delete item');
      });
  };

  const handleOpenItem = (item: InboxItem) => {
    setSelectedInboxItem(item);
    setIsViewModalOpen(true);
    if (!item.isRead) {
      dispatch(markInboxAsRead(item.inboxId));
    }
  };

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Tab filter
      if (activeTab === 'UNREAD' && item.isRead) return false;
      if (activeTab === 'READ' && !item.isRead) return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = item.note?.title?.toLowerCase().includes(q);
        const matchesDesc = item.note?.description?.toLowerCase().includes(q);
        const matchesSender = item.senderName?.toLowerCase().includes(q) || item.fromMail?.toLowerCase().includes(q);
        const matchesProject = item.note?.projectName?.toLowerCase().includes(q);
        return matchesTitle || matchesDesc || matchesSender || matchesProject;
      }

      return true;
    });
  }, [items, activeTab, searchQuery]);

  const readCount = useMemo(() => items.filter((i) => i.isRead).length, [items]);

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

  return (
    <div className="p-4 md:p-6 w-full max-w-7xl mx-auto space-y-5">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-2xl shadow-xs border border-slate-100">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4318FF] to-[#7052FF] flex items-center justify-center text-white shadow-md shadow-[#4318FF]/20 shrink-0">
            <InboxIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl md:text-2xl font-bold text-[#1B2559]">
                Received Notes Inbox
              </h1>
              {unreadCount > 0 && (
                <span className="px-2.5 py-0.5 bg-[#4318FF] text-white text-xs font-semibold rounded-full shadow-xs animate-pulse">
                  {unreadCount} Unread
                </span>
              )}
            </div>
            <p className="text-xs md:text-sm text-slate-500 mt-0.5">
              Access and review all shared notes, updates, and documents sent to you by team members.
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={handleRefresh}
            className="p-2 text-slate-600 hover:text-[#4318FF] bg-slate-50 hover:bg-indigo-50/50 rounded-xl border border-slate-200 transition cursor-pointer flex items-center gap-1.5 text-xs font-medium"
            title="Refresh Inbox"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="px-3.5 py-2 bg-[#4318FF] hover:bg-[#330fcf] text-white rounded-xl text-xs font-semibold shadow-sm shadow-[#4318FF]/20 transition cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Mark All Read</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl shadow-xs border border-slate-100">
        {/* Tab Pills */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto bg-slate-100/80 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'ALL'
                ? 'bg-white text-[#4318FF] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>All Notes</span>
            <span className="text-[11px] px-1.5 py-0.2 bg-slate-200/60 rounded-full">
              {items.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('UNREAD')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'UNREAD'
                ? 'bg-white text-[#4318FF] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Unread</span>
            {unreadCount > 0 && (
              <span className="text-[11px] px-1.5 py-0.2 bg-[#4318FF] text-white rounded-full">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('READ')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'READ'
                ? 'bg-white text-[#4318FF] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Read</span>
            <span className="text-[11px] px-1.5 py-0.2 bg-slate-200/60 rounded-full">
              {readCount}
            </span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, sender, content..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#4318FF] focus:ring-1 focus:ring-[#4318FF] outline-none transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Inbox Items List */}
      {loading && items.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-100 min-h-[300px]">
          <RefreshCw className="w-8 h-8 text-[#4318FF] animate-spin mb-3" />
          <p className="text-sm font-medium text-slate-600">Loading your inbox...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-100 min-h-[350px] text-center">
          <div className="w-16 h-16 rounded-3xl bg-indigo-50 flex items-center justify-center text-[#4318FF] mb-4">
            <MailOpen className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No received notes found</h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            {searchQuery
              ? 'No messages match your search filter. Try clearing or changing the search keywords.'
              : activeTab === 'UNREAD'
              ? 'You are all caught up! No unread notes in your inbox.'
              : 'When teammates share notes with you, they will appear here in your Inbox.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const hasAttachments = item.note?.attachments && item.note.attachments.length > 0;
            const isUnread = !item.isRead;

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
                                        {item.permission === 'EDIT' ? (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-md border border-emerald-200 flex items-center gap-1">
                            <span>✏️</span>
                            <span>Can Edit</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-md border border-blue-200 flex items-center gap-1">
                            <span>👁️</span>
                            <span>View Only</span>
                          </span>
                        )}

                        {isUnread && (
                  <div className="absolute left-0 top-3 bottom-3 w-1.5 bg-[#4318FF] rounded-r-full" />
                )}

                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                  {/* Sender Info & Header */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Avatar Badge */}
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        isUnread
                          ? 'bg-gradient-to-tr from-[#4318FF] to-[#7052FF] text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {getInitials(item.senderName, item.fromMail)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span
                          className={`text-sm font-bold truncate ${
                            isUnread ? 'text-[#1B2559]' : 'text-slate-700'
                          }`}
                        >
                          {item.senderName || item.fromMail}
                        </span>

                        <span className="text-[11px] text-slate-400">
                          &lt;{item.fromMail}&gt;
                        </span>

                        {item.senderDesignation && (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-medium rounded-md">
                            {item.senderDesignation}
                          </span>
                        )}

                                                {item.permission === 'EDIT' ? (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-md border border-emerald-200 flex items-center gap-1">
                            <span>✏️</span>
                            <span>Can Edit</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-md border border-blue-200 flex items-center gap-1">
                            <span>👁️</span>
                            <span>View Only</span>
                          </span>
                        )}

                        {isUnread && (
                          <span className="px-2 py-0.5 bg-indigo-50 text-[#4318FF] text-[10px] font-bold rounded-full border border-indigo-100 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#4318FF] animate-pulse" />
                            New Note
                          </span>
                        )}
                      </div>

                      {/* Note Title & Project */}
                      <div className="flex items-center gap-2 mb-1.5">
                        <h4
                          className={`text-sm font-semibold truncate ${
                            isUnread ? 'text-[#4318FF]' : 'text-slate-800'
                          }`}
                        >
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
                          <div className="flex items-center gap-1.5 text-xs text-[#4318FF] bg-indigo-50/70 px-2.5 py-1 rounded-lg border border-indigo-100/60">
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

                  {/* Actions (Right Side) */}
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

                    <Popconfirm
                      title="Delete this message from your inbox?"
                      onConfirm={(e) => handleDeleteItem(item.inboxId, e as any)}
                      okText="Delete"
                      cancelText="Cancel"
                      okButtonProps={{ danger: true }}
                    >
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 rounded-xl bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 border border-slate-200 transition cursor-pointer"
                        title="Delete from inbox"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </Popconfirm>

                    <button
                      onClick={() => handleOpenItem(item)}
                      className="px-3 py-1.5 bg-slate-50 hover:bg-[#4318FF] text-slate-700 hover:text-white rounded-xl text-xs font-semibold border border-slate-200 hover:border-[#4318FF] transition cursor-pointer flex items-center gap-1.5 group/btn"
                    >
                      <span>View Note</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Note View Modal */}
      <Modal
        open={isViewModalOpen}
        onCancel={() => setIsViewModalOpen(false)}
        footer={null}
        width={780}
        destroyOnClose
        centered
        title={null}
        styles={{
          content: { padding: 0, borderRadius: '20px', overflow: 'hidden' },
        }}
      >
        {selectedInboxItem && (
          <div className="flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#4318FF] to-[#7052FF] p-5 text-white">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-white/20 backdrop-blur-xs text-white text-[11px] font-semibold rounded-full uppercase tracking-wider">
                    Received Note
                  </span>
                  {selectedInboxItem.permission === 'EDIT' ? (
                    <span className="px-2.5 py-0.5 bg-emerald-500 text-white text-[11px] font-bold rounded-full shadow-xs">
                      ✏️ Edit Allowed
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 bg-blue-500/80 text-white text-[11px] font-bold rounded-full shadow-xs">
                      👁️ View Only
                    </span>
                  )}
                </div>
                <span className="text-xs text-white/80">
                  {dayjs(selectedInboxItem.createdAt).format('MMM DD, YYYY • hh:mm A')}
                </span>
              </div>

              <h2 className="text-lg md:text-xl font-bold text-white">
                {selectedInboxItem.note?.title || 'Shared Note'}
              </h2>

              {/* Sender Details Header */}
              <div className="flex items-center gap-2.5 mt-3 pt-3 border-t border-white/15">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-bold text-xs text-white">
                  {getInitials(selectedInboxItem.senderName, selectedInboxItem.fromMail)}
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">
                    From: {selectedInboxItem.senderName || selectedInboxItem.fromMail}
                  </div>
                  <div className="text-[11px] text-white/75">
                    {selectedInboxItem.fromMail}
                    {selectedInboxItem.senderDesignation ? ` • ${selectedInboxItem.senderDesignation}` : ''}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Content Body */}
            <div className="p-6 overflow-y-auto custom-scrollbar space-y-5 bg-[#F8FAFC]">
              {/* Project / Type Meta */}
              {selectedInboxItem.note?.projectName && (
                <div className="flex items-center gap-2 p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-xs font-semibold text-slate-500">Project:</span>
                  <span className="text-xs font-bold text-[#4318FF]">
                    {selectedInboxItem.note.projectName}
                  </span>
                </div>
              )}

              {/* Note Description (Rich Text/HTML content) */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  <FileText className="w-4 h-4 text-[#4318FF]" />
                  <span>Note Content</span>
                </div>

                <div
                  className="prose prose-sm max-w-none text-slate-700 leading-relaxed overflow-x-auto"
                  dangerouslySetInnerHTML={{
                    __html: selectedInboxItem.note?.description || '<p class="text-slate-400 italic">No description provided for this note.</p>',
                  }}
                />
              </div>

              {/* Attached Files */}
              {selectedInboxItem.note?.attachments && selectedInboxItem.note.attachments.length > 0 && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
                      <Paperclip className="w-4 h-4 text-[#4318FF]" />
                      <span>Attachments ({selectedInboxItem.note.attachments.length})</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {selectedInboxItem.note.attachments.map((att, index) => {
                      const fileKey = att.key || att.fileKey || String(att.id);
                      const name = att.fileName || att.name || `Attachment_${index + 1}`;
                      const size = att.fileSize ? `${Math.round(att.fileSize / 1024)} KB` : '';
                      const downloadUrl = `/api/notes/attachments/${fileKey}/download`;
                      const viewUrl = `/api/notes/attachments/${fileKey}/view`;

                      return (
                        <div
                          key={`view-att-${fileKey}-${index}`}
                          className="flex items-center justify-between p-3 bg-slate-50 hover:bg-indigo-50/50 rounded-xl border border-slate-200 transition"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <FileText className="w-4 h-4 text-[#4318FF] shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-slate-800 truncate" title={name}>
                                {name}
                              </p>
                              {size && <span className="text-[10px] text-slate-400">{size}</span>}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0 ml-2">
                            <a
                              href={viewUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-slate-500 hover:text-[#4318FF] rounded-lg hover:bg-white transition"
                              title="Preview file"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </a>
                            <a
                              href={downloadUrl}
                              download
                              className="p-1.5 text-slate-500 hover:text-[#4318FF] rounded-lg hover:bg-white transition"
                              title="Download file"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-4 bg-white border-t border-slate-200 shrink-0">
              <span className="text-xs text-slate-400">
                To: {selectedInboxItem.toMail}
              </span>

              <div className="flex items-center gap-2">
                {selectedInboxItem.permission === 'EDIT' && (
                  <button
                    onClick={() => {
                      setIsViewModalOpen(false);
                      // Navigate to Notes page
                      navigate('/admin-dashboard/notes', {
                        state: { editNoteId: selectedInboxItem.notesId },
                      });
                    }}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
                  >
                    <span>✏️ Edit in Notes</span>
                  </button>
                )}

                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default InboxManagement;
