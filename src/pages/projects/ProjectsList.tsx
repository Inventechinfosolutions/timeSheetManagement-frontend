import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../store";
import { getProjects, deleteProject } from "../../reducers/projects.reducer";
import ProjectCard from "../../components/projects/ProjectCard";
import { Button, Input, Empty, Spin, message, Row, Col } from "antd";
import { Plus, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Footer from "../../components/Footer";

const PageContainer = styled.div`
  min-height: 100vh;
  background-color: #f9fafb;
`;

const MainContent = styled.main`
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
  flex-wrap: wrap;
  gap: 16px;
`;

const HeaderTitle = styled.div`
  h1 {
    font-size: 24px;
    font-weight: 700;
    color: #111827;
    margin: 0 0 8px 0;
  }
  p {
    color: #6b7280;
    font-size: 14px;
    margin: 0;
  }
`;

const ActionsContainer = styled.div`
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
`;

const SearchInput = styled(Input)`
  width: 300px;
  border-radius: 8px;

  .ant-input-prefix {
    color: #9ca3af;
  }
`;

const CreateButton = styled(Button)`
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  background-color: #2563eb;

  &:hover {
    background-color: #1d4ed8 !important;
  }
`;

const ProjectsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
`;

const ProjectsList: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");

  const { projects, loading, updateSuccess } = useSelector(
    (state: RootState) => state.projects,
  );
  const { currentUser: user } = useSelector((state: RootState) => state.user);

  const isAdmin = user?.userType === "ADMIN" || user?.role === "ADMIN";

  useEffect(() => {
    dispatch(getProjects());
  }, [dispatch]);

  // Refresh list if an update (like delete) was successful
  useEffect(() => {
    if (updateSuccess) {
      dispatch(getProjects());
    }
  }, [updateSuccess, dispatch]);

  const handleDelete = async (id: number) => {
    try {
      await dispatch(deleteProject(id)).unwrap();
      message.success("Project deleted successfully");
    } catch (error) {
      message.error(
        typeof error === "string" ? error : "Failed to delete project",
      );
    }
  };

  const handleClick = (id: number) => {
    navigate(String(id));
  };

  const handleCreate = () => {
    navigate("create");
  };

  const filteredProjects = projects.filter(
    (project) =>
      project.projectName.toLowerCase().includes(searchText.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchText.toLowerCase()),
  );

  return (
    <PageContainer>
      <MainContent>
        <PageHeader>
          <HeaderTitle>
            <h1>Projects</h1>
            <p>Manage your company projects and documentation</p>
          </HeaderTitle>

          <ActionsContainer>
            <SearchInput
              placeholder="Search projects..."
              prefix={<Search size={18} />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            {user && ( // Only show if user is logged in (should be protected route anyway)
              <CreateButton
                type="primary"
                icon={<Plus size={18} />}
                onClick={handleCreate}
              >
                Create Project
              </CreateButton>
            )}
          </ActionsContainer>
        </PageHeader>

        {loading && projects.length === 0 ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "100px 0",
            }}
          >
            <Spin size="large" />
          </div>
        ) : filteredProjects.length > 0 ? (
          <ProjectsGrid>
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onDelete={handleDelete}
                onClick={handleClick}
                isAdmin={isAdmin}
                canEdit={
                  isAdmin || String(project.createdBy) === String(user?.id)
                }
              />
            ))}
          </ProjectsGrid>
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              searchText
                ? "No projects found matching your search"
                : "No projects found. Create one to get started!"
            }
          />
        )}
      </MainContent>
    </PageContainer>
  );
};

export default ProjectsList;
