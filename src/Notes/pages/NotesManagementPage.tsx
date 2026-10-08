import React, { useEffect } from "react";
import { Modal } from "antd";
import { useNotesManagement } from "../hooks/useNotesManagement";
import {
  NoteHeader,
  NoteList,
  NoteEditor,
  NoteView,
  NoteSendModal,
} from "../components";
import DocumentPreviewModal from "../components/DocumentPreviewModal";
import ExcelViewerModal from "../../components/ExcelViewerModal";

export const NotesManagementPage: React.FC = () => {
  const {
    notes,
    displayNotes,
    paginatedNotes,
    totalPages,
    currentPage,
    pageSize,
    activeTab,
    selectedProject,
    searchQuery,
    loading,
    actionLoading,
    currentUser,
    pageMode,
    setPageMode,
    activeNote,
    parentNoteContext,
    showSaveToast,
    previewImageModal,
    setPreviewImageModal,
    excelViewerModal,
    setExcelViewerModal,
    formData,
    setFormData,
    isDraggingModalFile,
    setIsDraggingModalFile,
    textColor,
    setTextColor,
    highlightColor,
    setHighlightColor,
    fileInputRef,
    doclingJsonInputRef,
    excelExtractInputRef,
    isImportingDocling,
    isExtractingExcel,
    editorRef,
    expandedNotes,
    toggleExpand,
    handleTabSwitch,
    executeEditorCommand,
    handleEditorInput,
    handleInsertLink,
    handleStartCreate,
    handleStartCreateSubNote,
    handleStartEdit,
    handleStartView,
    handleBackToList,
    handleDoclingJsonUpload,
    handleExcelExtract,
    handleProcessUploadFiles,
    handleFileChange,
    handleRemoveSelectedFile,
    handleSubmitForm,
    handleDeleteNote,
    handleDeleteAttachment,
    handlePreviewAttachment,
    handleDownloadAttachment,
    handleTogglePin,
    handleToggleArchive,
    autoSaveStatus,
    handleToggleAutoSave,
    sendNoteModal,
    handleOpenSendModal,
    handleCloseSendModal,
    dragDrop,
    totalAttachmentsCount,
    xlsImportInputRef,
    handleXlsImport,
    handleSearchChange,
    handleClearSearch,
    setCurrentPage,
  } = useNotesManagement();

  // Notify layout when user is inside the Note Workspace (create, edit, view) vs List mode
  useEffect(() => {
    const isWorkspace =
      pageMode === "create" || pageMode === "edit" || pageMode === "view";
    window.dispatchEvent(
      new CustomEvent("note-workspace-mode", { detail: { isWorkspace } })
    );
    return () => {
      window.dispatchEvent(
        new CustomEvent("note-workspace-mode", { detail: { isWorkspace: false } })
      );
    };
  }, [pageMode]);

  return (
    <div className="w-full min-h-full">
      {/* 1. Create or Edit Mode */}
      {(pageMode === "create" || pageMode === "edit") && (
        <NoteEditor
          formData={formData}
          setFormData={setFormData}
          parentNoteContext={parentNoteContext}
          activeNote={activeNote}
          actionLoading={actionLoading}
          showSaveToast={showSaveToast}
          isDraggingModalFile={isDraggingModalFile}
          setIsDraggingModalFile={setIsDraggingModalFile}
          textColor={textColor}
          setTextColor={setTextColor}
          highlightColor={highlightColor}
          setHighlightColor={setHighlightColor}
          isImportingDocling={isImportingDocling}
          isExtractingExcel={isExtractingExcel}
          totalAttachmentsCount={totalAttachmentsCount}
          editorRef={editorRef}
          fileInputRef={fileInputRef}
          doclingJsonInputRef={doclingJsonInputRef}
          excelExtractInputRef={excelExtractInputRef}
          onEditorInput={handleEditorInput}
          onExecuteCommand={executeEditorCommand}
          onInsertLink={handleInsertLink}
          onDoclingUpload={handleDoclingJsonUpload}
          onExcelExtract={handleExcelExtract}
          onFileChange={handleFileChange}
          onProcessDropFiles={handleProcessUploadFiles}
          onRemoveAttachment={handleRemoveSelectedFile}
          onDeleteServerAttachment={handleDeleteAttachment}
          onPreviewAttachment={handlePreviewAttachment}
          onDownloadAttachment={handleDownloadAttachment}
          onPreviewImage={(url, title) =>
            setPreviewImageModal({ open: true, url, title: title || "Screenshot" })
          }
          onSubmit={handleSubmitForm}
          onBack={handleBackToList}
          autoSaveStatus={autoSaveStatus}
          onToggleAutoSave={handleToggleAutoSave}
          xlsImportInputRef={xlsImportInputRef}
          onXlsImport={handleXlsImport}
        />
      )}

      {/* 2. View Mode */}
      {pageMode === "view" && activeNote && (
        <NoteView
          activeNote={activeNote}
          excelWorkbook={formData.excelWorkbook}
          onStartEdit={handleStartEdit}
          onBack={handleBackToList}
          onPreviewAttachment={handlePreviewAttachment}
          onDownloadAttachment={handleDownloadAttachment}
          onPreviewImage={(url, title) =>
            setPreviewImageModal({ open: true, url, title: title || "Screenshot" })
          }
          onTogglePin={handleTogglePin}
          onToggleArchive={handleToggleArchive}
          onOpenSendModal={handleOpenSendModal}
        />
      )}

      {/* 3. List Mode */}
      {pageMode === "list" && (
        <div className="w-full min-h-full bg-[#F4F7FE] p-2 sm:p-3 md:p-4 flex flex-col gap-4 font-sans">
          <NoteHeader
            activeTab={activeTab}
            searchQuery={searchQuery}
            onTabSwitch={handleTabSwitch}
            onSearchChange={handleSearchChange}
            onClearSearch={handleClearSearch}
            onCreateProjectNote={() => handleStartCreate("PROJECT")}
            onCreatePersonalNote={() => handleStartCreate("PERSONAL")}
          />

          <NoteList
            loading={loading}
            notes={displayNotes}
            paginatedNotes={paginatedNotes}
            currentPage={currentPage}
            pageSize={pageSize}
            totalPages={totalPages}
            activeTab={activeTab}
            searchQuery={searchQuery}
            expandedNotes={expandedNotes}
            currentUser={currentUser}
            dragDrop={dragDrop}
            onToggleExpand={toggleExpand}
            onStartView={handleStartView}
            onStartEdit={handleStartEdit}
            onDeleteNote={handleDeleteNote}
            onTogglePin={handleTogglePin}
            onToggleArchive={handleToggleArchive}
            onOpenSendModal={handleOpenSendModal}
            onStartCreateSubNote={handleStartCreateSubNote}
            onTabSwitch={handleTabSwitch}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      )}

      {/* Send Note Modal */}
      <NoteSendModal
        open={sendNoteModal.open}
        note={sendNoteModal.note}
        currentUser={currentUser}
        onClose={handleCloseSendModal}
        onSuccess={() => {}}
      />

      {/* Global In-App Document & Image Preview Modal (Card View) */}
      <DocumentPreviewModal
        open={previewImageModal.open}
        url={previewImageModal.url}
        title={previewImageModal.title}
        onClose={() => setPreviewImageModal({ open: false, url: "", title: "" })}
      />

      {/* Global Excel Spreadsheet Editor Modal */}
      <ExcelViewerModal
        open={excelViewerModal.open}
        onClose={() => setExcelViewerModal({ open: false, fileName: "", blob: null, file: null })}
        fileName={excelViewerModal.fileName}
        blob={excelViewerModal.blob}
        file={excelViewerModal.file}
        onDownload={excelViewerModal.onDownload}
      />
    </div>
  );
};

export default NotesManagementPage;
