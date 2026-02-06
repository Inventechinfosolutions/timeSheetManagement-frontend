import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../store";
import {
  getProject,
  deleteProject,
  uploadProjectPhoto,
  uploadProjectDocuments,
  deleteProjectAttachment,
  createModel,
  updateModel,
  deleteModel,
  uploadModelDocuments,
  deleteModelAttachment,
  resetUpdateSuccess,
  updateProject,
} from "../../reducers/projects.reducer";
import {
  Button,
  Upload,
  Modal,
  Empty,
  message,
  Popconfirm,
  Spin,
  Row,
  Col,
  Card,
  Input,
  Table,
} from "antd";
import {
  ArrowLeft,
  Upload as UploadIcon,
  Trash2,
  Edit,
  FileText,
  Download,
  Image as ImageIcon,
  FolderPlus,
  Calendar,
  Eye,
  Building,
  Save,
  X,
} from "lucide-react";

// --- Styled Components ---

const PageContainer = styled.div`
  min-height: 100vh;
  background-color: #f9fafb;
`;

const MainContent = styled.main`
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
`;

const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
`;

const BreadcrumbParams = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const BackButton = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #6b7280;
  cursor: pointer;
  font-size: 14px;

  &:hover {
    color: #111827;
  }
`;

const PageTitle = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #111827;
  margin: 0;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 12px;
`;

const InfoCard = styled(Card)`
  border-radius: 12px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  margin-bottom: 24px;

  .ant-card-body {
    padding: 0;
  }
`;

const InfoContent = styled.div`
  padding: 32px;
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const ProjectPhotoContainer = styled.div<{ $bgUrl?: string }>`
  width: 100%;
  height: 100%;
  min-height: 300px;
  background-color: #f3f4f6;
  background-image: ${(props) =>
    props.$bgUrl ? `url(${props.$bgUrl})` : "none"};
  background-size: cover;
  background-position: center;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  /* In edit mode or if actionable, show overlay on hover */
  &:hover .overlay {
    opacity: 1;
  }
`;

const PhotoOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
  cursor: pointer;
  color: white;
  flex-direction: column;
  gap: 8px;
`;

const ProjectName = styled.h2`
  font-size: 28px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 8px;
  margin-top: 0;
`;

const SectionLabel = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
  margin-top: 24px;

  &:first-child {
    margin-top: 0;
  }
`;

const DescriptionText = styled.p`
  color: #4b5563;
  font-size: 16px;
  line-height: 1.6;
  margin: 0;
`;

const MetaGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
  margin-top: auto;
  border-top: 1px solid #f3f4f6;
  padding-top: 24px;
`;

const MetaItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;

  span.label {
    font-size: 12px;
    color: #9ca3af;
  }

  span.value {
    font-size: 14px;
    color: #4b5563;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;

const FilesCard = styled(Card)`
  border-radius: 12px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  margin-bottom: 24px;

  .ant-card-body {
    padding: 24px;
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;

  h3 {
    font-size: 18px;
    font-weight: 600;
    color: #111827;
    margin: 0;
  }
`;

const FileList = styled.div`
  display: flex;
  flex-direction: column;
`;

const FileRow = styled.div`
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f3f4f6;
  transition: background-color 0.2s;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: #f9fafb;
  }
`;

const FileIconWrapper = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background-color: #eff6ff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
`;

const FileInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const FileName = styled.span`
  font-weight: 500;
  color: #111827;
  font-size: 14px;
`;

const FileMeta = styled.span`
  font-size: 12px;
  color: #9ca3af;
`;

const FileActions = styled.div`
  display: flex;
  gap: 8px;
`;

// Model specific styles
const ModelCard = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 16px;
  overflow: hidden;
`;

const ModelHeader = styled.div`
  padding: 16px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ModelTitle = styled.h4`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
`;

const ModelContent = styled.div`
  padding: 16px;
`;

const StyledTable = styled(Table)`
  .ant-table-container {
    border-radius: 8px;
    border: 1px solid #e5e7eb;
  }
`;

const UploadBox = styled.div`
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 24px;
  text-align: center;
  background-color: #f9fafb;
  cursor: pointer;
  margin-top: 16px;

  &:hover {
    border-color: #3b82f6;
    background-color: #eff6ff;
  }

  .ant-upload-wrapper {
    width: 100%;
    display: inline-block;
  }
`;

const ProjectDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const {
    currentProject,
    loading,
    updateSuccess,
    uploadLoading,
    errorMessage,
  } = useSelector((state: RootState) => state.projects);

  const { currentUser: user } = useSelector((state: RootState) => state.user);

  // Modal State
  const [modelModalVisible, setModelModalVisible] = useState(false);
  const [editingModel, setEditingModel] = useState<any>(null);
  const [newModelName, setNewModelName] = useState("");
  const [modelFiles, setModelFiles] = useState<any[]>([]);

  // Inline Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  const isAdmin = user?.userType === "ADMIN" || user?.role === "ADMIN";
  const canEdit =
    isAdmin ||
    (currentProject && String(currentProject.createdBy) === String(user?.id));

  // Fetch Project
  useEffect(() => {
    if (id) {
      dispatch(getProject(parseInt(id)));
    }
  }, [dispatch, id]);

  // Handle Updates Success
  useEffect(() => {
    if (updateSuccess) {
      dispatch(resetUpdateSuccess());
      // Reset Modal State
      setModelModalVisible(false);
      setEditingModel(null);
      setNewModelName("");
      setModelFiles([]);
      // Reset Inline Edit State
      setIsEditing(false);
      setEditPhotoFile(null);
      setPreviewPhotoUrl(null);

      // Refresh data
      if (id) dispatch(getProject(parseInt(id)));

      message.success("Changes saved successfully");
    }
  }, [updateSuccess, dispatch, id]);

  // Handle Error (e.g. if update fails)
  useEffect(() => {
    if (errorMessage && isEditing) {
      // Keep edit mode if error, so user can retry or fix
      // Error generally handled by global handler or UI display, but we can toast
      message.error("Failed to save changes: " + errorMessage);
    }
  }, [errorMessage, isEditing]);

  // Initialize Edit State when entering edit mode (handled in toggle, but also ensure sync if project updates while editing? No, overwrite risk).
  // Actually, sync when project loads for the first time.
  useEffect(() => {
    if (currentProject && !isEditing) {
      setEditName(currentProject.projectName);
      setEditDescription(currentProject.description || "");
      setPreviewPhotoUrl(currentProject.photoUrl || null);
    }
  }, [currentProject, isEditing]);

  const handleEnterEditMode = () => {
    if (currentProject) {
      setEditName(currentProject.projectName);
      setEditDescription(currentProject.description || "");
      setPreviewPhotoUrl(currentProject.photoUrl || null);
      setEditPhotoFile(null);
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditPhotoFile(null);
    if (currentProject) {
      setPreviewPhotoUrl(currentProject.photoUrl || null);
    }
  };

  const handleSaveProjectDetails = async () => {
    if (!currentProject) return;

    try {
      // 1. Update Metadata
      await dispatch(
        updateProject({
          id: currentProject.id,
          updates: {
            projectName: editName,
            description: editDescription,
            hasModels: true, // Enforce hasModels as per fix
          },
        }),
      ).unwrap();

      // 2. Upload Photo if changed
      if (editPhotoFile) {
        await dispatch(
          uploadProjectPhoto({
            projectId: currentProject.id,
            file: editPhotoFile,
          }),
        ).unwrap();
      }

      // Success handled in useEffect
    } catch (e) {
      // Error handled in useEffect via state.error or here catch
      console.error("Save failed", e);
    }
  };

  // --- Photo Handling in Edit Mode ---
  const handleEditPhotoSelect = (file: File) => {
    setEditPhotoFile(file);
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setPreviewPhotoUrl(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
    return false; // Prevent auto upload
  };

  // --- File/Model/Meta Handlers (Existing) ---
  const customDocumentUpload = async (options: any, modelId?: number) => {
    const { file, onSuccess, onError } = options;
    try {
      if (modelId) {
        if (!currentProject) return;
        await dispatch(
          uploadModelDocuments({
            projectId: currentProject.id,
            modelId,
            files: [file],
          }),
        ).unwrap();
      } else if (currentProject) {
        await dispatch(
          uploadProjectDocuments({
            projectId: currentProject.id,
            files: [file],
          }),
        ).unwrap();
      }
      onSuccess("Ok");
      message.success("File uploaded successfully");
      if (id) dispatch(getProject(parseInt(id))); // Refresh to show new file
    } catch (err) {
      onError({ err });
      message.error("File upload failed");
    }
  };

  const instancePhotoUpload = (file: File) => {
    // Only used if NOT in edit mode (if we allow hot-swap).
    // But requirement says "Edit page" replacement.
    // So typically we disable photo click unless in edit mode?
    // OR we allow hot-swap if not editing.
    // Let's allow hot-swap if NOT editing (backward compat), but in edit mode use temp state.
    if (!isEditing && currentProject) {
      dispatch(uploadProjectPhoto({ projectId: currentProject.id, file }));
      return false;
    }
    return false;
  };

  const handleDeleteModel = async (modelId: number) => {
    if (currentProject) {
      await dispatch(
        deleteModel({ projectId: currentProject.id, modelId }),
      ).unwrap();
      if (id) dispatch(getProject(parseInt(id)));
    }
  };

  const handleSaveModel = async () => {
    if (!currentProject || !newModelName.trim()) return;
    // ... (Model creation logic same as before) ...
    try {
      let modelId = editingModel?.id;
      if (editingModel) {
        await dispatch(
          updateModel({
            projectId: currentProject.id,
            modelId: editingModel.id,
            modelName: newModelName,
          }),
        ).unwrap();
      } else {
        const result = await dispatch(
          createModel({
            projectId: currentProject.id,
            modelName: newModelName,
          }),
        ).unwrap();
        modelId = result.id;
      }

      if (modelFiles.length > 0 && modelId) {
        const files = modelFiles.map((f) => f.originFileObj);
        await dispatch(
          uploadModelDocuments({
            projectId: currentProject.id,
            modelId: modelId,
            files: files,
          }),
        ).unwrap();
      }

      // Success handles modal close
    } catch (e) {
      message.error("Failed to save model");
    }
  };

  const deleteFile = async (attachmentId: number, modelId?: number) => {
    if (!currentProject) return;
    if (modelId) {
      await dispatch(
        deleteModelAttachment({
          projectId: currentProject.id,
          modelId,
          attachmentId,
        }),
      ).unwrap();
    } else {
      await dispatch(
        deleteProjectAttachment({ projectId: currentProject.id, attachmentId }),
      ).unwrap();
    }
    if (id) dispatch(getProject(parseInt(id)));
  };

  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const columns = (modelId?: number) => [
    {
      title: "Filename",
      dataIndex: "fileName",
      key: "fileName",
      render: (text: string, record: any) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <FileText size={16} color="#6b7280" />
          <a
            href={record.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#2563eb", fontWeight: 500 }}
          >
            {text}
          </a>
        </div>
      ),
    },
    {
      title: "Uploaded At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Action",
      key: "action",
      width: 150,
      render: (_: any, record: any) => (
        <div style={{ display: "flex", gap: 8 }}>
          <a href={record.fileUrl} target="_blank" rel="noopener noreferrer">
            <Button type="text" icon={<Eye size={16} />} />
          </a>
          <a href={record.fileUrl} download>
            <Button type="text" icon={<Download size={16} />} />
          </a>
          {canEdit &&
            !isEditing && ( // Disable file actions during project edit? Or allow? Safest to allow only in view mode to avoid conflict.
              <Popconfirm
                title="Delete file"
                onConfirm={() => deleteFile(record.id, modelId)}
              >
                <Button type="text" danger icon={<Trash2 size={16} />} />
              </Popconfirm>
            )}
        </div>
      ),
    },
  ];

  if (loading && !currentProject) {
    return (
      <PageContainer>
        <MainContent
          style={{ display: "flex", justifyContent: "center", marginTop: 100 }}
        >
          <Spin size="large" />
        </MainContent>
      </PageContainer>
    );
  }

  if (!currentProject) {
    return (
      <PageContainer>
        <MainContent>
          <Empty description="Project not found" />
        </MainContent>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <MainContent>
        <TopBar>
          <BreadcrumbParams>
            <BackButton onClick={() => navigate("..")}>
              <ArrowLeft size={16} />
              Back to Projects
            </BackButton>
            <PageTitle>
              {isEditing ? "Edit Project Details" : "Project Details"}
            </PageTitle>
          </BreadcrumbParams>

          <ActionButtons>
            {canEdit && (
              <>
                {!isEditing ? (
                  <>
                    <Button
                      icon={<FolderPlus size={16} />}
                      onClick={() => {
                        setEditingModel(null);
                        setNewModelName("");
                        setModelFiles([]);
                        setModelModalVisible(true);
                      }}
                    >
                      Add Model
                    </Button>
                    <Button
                      type="primary"
                      icon={<Edit size={16} />}
                      onClick={handleEnterEditMode}
                    >
                      Edit Project
                    </Button>
                    <Popconfirm
                      title="Delete Project"
                      description="Are you sure? This action cannot be undone."
                      onConfirm={async () => {
                        await dispatch(
                          deleteProject(currentProject.id),
                        ).unwrap();
                        navigate("..");
                        message.success("Project deleted");
                      }}
                      okText="Delete"
                      cancelText="Cancel"
                      okButtonProps={{ danger: true }}
                    >
                      <Button danger icon={<Trash2 size={16} />}>
                        Delete Project
                      </Button>
                    </Popconfirm>
                  </>
                ) : (
                  <>
                    <Button onClick={handleCancelEdit} icon={<X size={16} />}>
                      Cancel
                    </Button>
                    <Button
                      type="primary"
                      icon={<Save size={16} />}
                      loading={loading} // Global loading state usually implies op in progress
                      onClick={handleSaveProjectDetails}
                    >
                      Save Changes
                    </Button>
                  </>
                )}
              </>
            )}
          </ActionButtons>
        </TopBar>

        {/* Info Card */}
        <InfoCard>
          <Row style={{ height: "100%" }}>
            <Col xs={24} md={8} style={{ minHeight: 300 }}>
              {isEditing ? (
                <Upload
                  showUploadList={false}
                  beforeUpload={handleEditPhotoSelect}
                  style={{ width: "100%", height: "100%", display: "block" }}
                >
                  <ProjectPhotoContainer $bgUrl={previewPhotoUrl || undefined}>
                    <PhotoOverlay
                      className="overlay"
                      style={{ opacity: 1, background: "rgba(0,0,0,0.6)" }}
                    >
                      <ImageIcon size={32} color="white" />
                      <span>Click to Change Photo</span>
                    </PhotoOverlay>
                  </ProjectPhotoContainer>
                </Upload>
              ) : (
                <Upload
                  showUploadList={false}
                  beforeUpload={instancePhotoUpload} // Live update if not editing
                  disabled={!canEdit}
                  style={{ width: "100%", height: "100%", display: "block" }}
                >
                  <ProjectPhotoContainer $bgUrl={currentProject.photoUrl}>
                    {canEdit && (
                      <PhotoOverlay className="overlay">
                        <ImageIcon size={32} color="white" />
                        <span>Change Photo</span>
                      </PhotoOverlay>
                    )}
                  </ProjectPhotoContainer>
                </Upload>
              )}
            </Col>

            <Col xs={24} md={16}>
              <InfoContent>
                {isEditing ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 16,
                      marginBottom: 16,
                    }}
                  >
                    <div>
                      <SectionLabel style={{ marginTop: 0 }}>
                        Project Name
                      </SectionLabel>
                      <Input
                        size="large"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Project Name"
                      />
                    </div>
                    <div>
                      <SectionLabel>Description</SectionLabel>
                      <Input.TextArea
                        rows={6}
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="Description"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <ProjectName>{currentProject.projectName}</ProjectName>

                    <SectionLabel>Description</SectionLabel>
                    <DescriptionText>
                      {currentProject.description || "No description provided."}
                    </DescriptionText>
                  </>
                )}

                <MetaGrid>
                  <MetaItem>
                    <span className="label">Created</span>
                    <span className="value">
                      <Calendar size={14} />
                      {formatDate(currentProject.createdAt)}
                    </span>
                  </MetaItem>
                  <MetaItem>
                    <span className="label">Last Updated</span>
                    <span className="value">
                      <Calendar size={14} />
                      {formatDate(
                        currentProject.updatedAt || currentProject.createdAt,
                      )}
                    </span>
                  </MetaItem>
                  <MetaItem>
                    <span className="label">Department</span>
                    <span className="value">
                      <Building size={14} />
                      {currentProject.department}
                    </span>
                  </MetaItem>
                </MetaGrid>
              </InfoContent>
            </Col>
          </Row>
        </InfoCard>

        {/* Files and Models can be read-only during edit or active. User said "just to change name/desc/photo". 
            Keeping them active is fine, but maybe disabled "Upload New File" to avoid confusion?
            No, "Upload New File" adds to list. Editing metadata is separate.
            I'll keep them active.
        */}

        {/* Files Card */}
        <FilesCard>
          <CardHeader>
            <h3>Project Files</h3>
            {canEdit && !isEditing && (
              <Upload
                customRequest={(options) => customDocumentUpload(options)}
                showUploadList={false}
                multiple
              >
                <Button type="primary" icon={<UploadIcon size={16} />}>
                  Upload New File
                </Button>
              </Upload>
            )}
          </CardHeader>
          <Spin spinning={uploadLoading}>
            <FileList>
              {currentProject.attachments &&
              currentProject.attachments.length > 0 ? (
                currentProject.attachments.map((file) => (
                  <FileRow key={file.id}>
                    <FileIconWrapper>
                      <FileText size={20} color="#3b82f6" />
                    </FileIconWrapper>
                    <FileInfo>
                      <FileName>{file.fileName}</FileName>
                      <FileMeta>
                        Document • Uploaded{" "}
                        {new Date(file.createdAt).toLocaleDateString()}
                      </FileMeta>
                    </FileInfo>
                    <FileActions>
                      <Button
                        href={file.fileUrl}
                        target="_blank"
                        icon={<Eye size={16} />}
                      >
                        View
                      </Button>
                      <Button
                        href={file.fileUrl}
                        download
                        icon={<Download size={16} />}
                      >
                        Download
                      </Button>
                      {canEdit && !isEditing && (
                        <Popconfirm
                          title="Delete File"
                          onConfirm={() => deleteFile(file.id)}
                        >
                          <Button danger icon={<Trash2 size={16} />}>
                            Delete
                          </Button>
                        </Popconfirm>
                      )}
                    </FileActions>
                  </FileRow>
                ))
              ) : (
                <Empty
                  description="No documents uploaded yet."
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )}
            </FileList>
          </Spin>
        </FilesCard>

        {/* Models Section */}
        {currentProject.models && currentProject.models.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
              Models
            </h3>
            {currentProject.models.map((model) => (
              <ModelCard key={model.id}>
                <ModelHeader>
                  <ModelTitle>{model.modelName}</ModelTitle>
                  {canEdit && !isEditing && (
                    <div style={{ display: "flex", gap: 8 }}>
                      <Upload
                        customRequest={(options) =>
                          customDocumentUpload(options, model.id)
                        }
                        showUploadList={false}
                        multiple
                      >
                        <Button icon={<UploadIcon size={14} />} size="small">
                          Add Files
                        </Button>
                      </Upload>
                      <Button
                        icon={<Edit size={14} />}
                        size="small"
                        onClick={() => {
                          setEditingModel(model);
                          setNewModelName(model.modelName);
                          setModelModalVisible(true);
                        }}
                      />
                      <Popconfirm
                        title="Delete Model"
                        onConfirm={() => handleDeleteModel(model.id)}
                      >
                        <Button
                          icon={<Trash2 size={14} />}
                          size="small"
                          danger
                        />
                      </Popconfirm>
                    </div>
                  )}
                </ModelHeader>
                <ModelContent>
                  <StyledTable
                    dataSource={model.attachments || []}
                    columns={columns(model.id)}
                    rowKey="id"
                    pagination={false}
                    size="small"
                    locale={{ emptyText: "No documents uploaded" }}
                  />
                </ModelContent>
              </ModelCard>
            ))}
          </div>
        )}

        {/* Model Modal handles Create/Edit Model Name/Files */}
        <Modal
          title={editingModel ? "Edit Model" : "Create New Model"}
          open={modelModalVisible}
          onCancel={() => setModelModalVisible(false)}
          onOk={handleSaveModel}
          confirmLoading={loading}
          okText={editingModel ? "Save" : "Create Model & Upload"}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <p style={{ marginBottom: 8, fontWeight: 500 }}>Model Name</p>
              <Input
                placeholder="Enter model name"
                value={newModelName}
                onChange={(e) => setNewModelName(e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <p style={{ marginBottom: 8, fontWeight: 500 }}>
                Upload Documents{" "}
                {editingModel ? "(Optional, adds to existing)" : "(Optional)"}
              </p>
              <UploadBox>
                <Upload
                  multiple
                  fileList={modelFiles}
                  beforeUpload={() => false}
                  onChange={(info) => setModelFiles(info.fileList)}
                  itemRender={(originNode, file, fileList, actions) => (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "4px 8px",
                        background: "white",
                        marginTop: 4,
                        borderRadius: 4,
                        border: "1px solid #eee",
                      }}
                    >
                      <span style={{ fontSize: 13 }}>{file.name}</span>
                      <span
                        style={{
                          color: "red",
                          cursor: "pointer",
                          fontSize: 13,
                        }}
                        onClick={actions.remove}
                      >
                        Remove
                      </span>
                    </div>
                  )}
                >
                  <p style={{ color: "#6b7280", marginBottom: 8 }}>
                    Click to select files
                  </p>
                  <Button icon={<UploadIcon size={14} />}>Select Files</Button>
                </Upload>
              </UploadBox>
            </div>
          </div>
        </Modal>
      </MainContent>
    </PageContainer>
  );
};

export default ProjectDetails;
