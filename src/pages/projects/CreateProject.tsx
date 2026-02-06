import React, { useState } from "react";
import styled from "styled-components";
import {
  Form,
  Input,
  Select,
  Button,
  message,
  Upload,
  Card,
  Row,
  Col,
} from "antd";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../store";
import {
  createProject,
  uploadProjectPhoto,
  uploadProjectDocuments,
} from "../../reducers/projects.reducer";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Image as ImageIcon,
  FileText,
  Upload as UploadIcon,
} from "lucide-react";

const PageContainer = styled.div`
  min-height: 100vh;
  background-color: #f9fafb;
`;

const MainContent = styled.main`
  padding: 24px;
  max-width: 1000px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
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

const FormCard = styled(Card)`
  border-radius: 12px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;

  .ant-card-body {
    padding: 32px;
  }
`;

const SectionLabel = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
`;

const UploadBox = styled.div`
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 32px;
  text-align: center;
  background-color: #f9fafb;
  transition: all 0.2s;
  cursor: pointer;

  &:hover {
    border-color: #3b82f6;
    background-color: #eff6ff;
  }

  .ant-upload-wrapper {
    display: inline-block;
    width: 100%;
  }
`;

const UploadPlaceholder = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: #6b7280;
`;

const CreateProject: React.FC = () => {
  const [form] = Form.useForm();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [fileList, setFileList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const { currentUser: user } = useSelector((state: RootState) => state.user);
  const { departments } = useSelector(
    (state: RootState) => state.employeeDetails,
  );

  const isAdmin = user?.userType === "ADMIN" || user?.role === "ADMIN";

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      // 1. Create Project
      const projectPayload = {
        projectName: values.projectName,
        description: values.description,
        department: isAdmin ? values.department : undefined,
        hasModels: true,
      };

      const resultAction = await dispatch(createProject(projectPayload));

      if (createProject.fulfilled.match(resultAction)) {
        const newProject = resultAction.payload;

        // 2. Upload Photo (if selected)
        if (photoFile) {
          try {
            await dispatch(
              uploadProjectPhoto({ projectId: newProject.id, file: photoFile }),
            ).unwrap();
          } catch (e) {
            console.error("Failed to upload photo", e);
            message.warning("Project created, but photo upload failed.");
          }
        }

        // 3. Upload Files (if selected)
        if (fileList.length > 0) {
          try {
            const files = fileList.map((f) => f.originFileObj);
            await dispatch(
              uploadProjectDocuments({ projectId: newProject.id, files }),
            ).unwrap();
          } catch (e) {
            console.error("Failed to upload documents", e);
            message.warning("Project created, but file upload failed.");
          }
        }

        message.success("Project created successfully");
        navigate("..");
      } else {
        message.error("Failed to create project");
      }
    } catch (error) {
      console.error(error);
      message.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (info: any) => {
    if (info.file.status !== "uploading") {
      setPhotoFile(info.file.originFileObj || info.file);
    }
  };

  const handleFilesChange = (info: any) => {
    setFileList(info.fileList);
  };

  return (
    <PageContainer>
      <MainContent>
        <Header>
          <BackButton onClick={() => navigate("..")}>
            <ArrowLeft size={16} />
            Back to Projects
          </BackButton>
          <PageTitle>Create New Project</PageTitle>
        </Header>

        <FormCard>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            size="large"
          >
            <Form.Item
              name="projectName"
              label="Project Name *"
              rules={[
                { required: true, message: "Please enter a project name" },
              ]}
            >
              <Input placeholder="Enter project name" />
            </Form.Item>

            <div style={{ marginBottom: 24 }}>
              <SectionLabel>Project Photo</SectionLabel>
              <UploadBox>
                <Upload
                  accept="image/*"
                  showUploadList={false}
                  beforeUpload={() => false}
                  onChange={handlePhotoChange}
                >
                  {photoFile ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 12,
                      }}
                    >
                      <ImageIcon size={32} color="#3b82f6" />
                      <span style={{ fontWeight: 500, color: "#111827" }}>
                        {photoFile.name}
                      </span>
                      <Button
                        type="link"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPhotoFile(null);
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <UploadPlaceholder>
                      <ImageIcon size={48} color="#9ca3af" />
                      <span>Upload a project photo</span>
                      <Button type="primary" icon={<UploadIcon size={16} />}>
                        Choose Photo
                      </Button>
                    </UploadPlaceholder>
                  )}
                </Upload>
              </UploadBox>
            </div>

            <Form.Item name="description" label="Description">
              <Input.TextArea
                rows={4}
                placeholder="Enter project description"
              />
            </Form.Item>

            {isAdmin && (
              <Form.Item
                name="department"
                label="Department"
                rules={[
                  { required: true, message: "Please select a department" },
                ]}
              >
                <Select placeholder="Select department">
                  {departments?.map((dept: any) => (
                    <Select.Option key={dept} value={dept}>
                      {dept}
                    </Select.Option>
                  ))}
                  <Select.Option value="IT">IT</Select.Option>
                  <Select.Option value="HR">HR</Select.Option>
                  <Select.Option value="Finance">Finance</Select.Option>
                  <Select.Option value="Operations">Operations</Select.Option>
                  <Select.Option value="Marketing">Marketing</Select.Option>
                </Select>
              </Form.Item>
            )}

            <div style={{ marginBottom: 32 }}>
              <SectionLabel>Add Files</SectionLabel>
              <UploadBox>
                <Upload
                  multiple
                  fileList={fileList}
                  beforeUpload={() => false}
                  onChange={handleFilesChange}
                  itemRender={(originNode, file, fileList, actions) => (
                    <div
                      style={{
                        marginTop: 8,
                        padding: "8px 12px",
                        background: "white",
                        border: "1px solid #f3f4f6",
                        borderRadius: 6,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <FileText size={16} color="#6b7280" />
                        {file.name}
                      </span>
                      <Button
                        type="text"
                        size="small"
                        onClick={actions.remove}
                        danger
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                >
                  <UploadPlaceholder>
                    <FileText size={48} color="#9ca3af" />
                    <span>Upload project files</span>
                    <span style={{ fontSize: 12, color: "#9ca3af" }}>
                      Supports multiple files (PDF, DOC, XLS, etc.)
                    </span>
                    <Button type="primary" icon={<UploadIcon size={16} />}>
                      Add Files
                    </Button>
                  </UploadPlaceholder>
                </Upload>
              </UploadBox>
            </div>

            <Row gutter={16}>
              <Col span={12}>
                <Button block size="large" onClick={() => navigate("..")}>
                  Cancel
                </Button>
              </Col>
              <Col span={12}>
                <Button
                  block
                  type="primary"
                  htmlType="submit"
                  size="large"
                  loading={loading}
                  icon={<UploadIcon size={16} />}
                >
                  Create Project
                </Button>
              </Col>
            </Row>
          </Form>
        </FormCard>
      </MainContent>
    </PageContainer>
  );
};

export default CreateProject;
