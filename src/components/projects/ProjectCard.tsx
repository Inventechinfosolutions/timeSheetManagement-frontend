import React from "react";
import styled from "styled-components";
import { Project } from "../../reducers/projects.reducer";
import { Card, Button, Tooltip, Popconfirm } from "antd";
import { FolderOpen, Trash2, FileText, Calendar, Box } from "lucide-react";
import { useNavigate } from "react-router-dom";

const StyledCard = styled(Card)`
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  border: 1px solid #e5e7eb;

  &:hover {
    transform: translateY(-4px);
    box-shadow:
      0 10px 15px -3px rgba(0, 0, 0, 0.1),
      0 4px 6px -2px rgba(0, 0, 0, 0.05);
    border-color: #3b82f6;
  }

  .ant-card-body {
    padding: 0;
  }
`;

const CardImage = styled.div<{ $bgUrl?: string }>`
  height: 160px;
  background-color: #f3f4f6;
  background-image: ${(props) =>
    props.$bgUrl ? `url(${props.$bgUrl})` : "none"};
  background-size: cover;
  background-position: center;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CardContent = styled.div`
  padding: 16px;
`;

const ProjectTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ProjectDepartment = styled.div`
  display: inline-block;
  padding: 2px 8px;
  background-color: #eff6ff;
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 500;
  border-radius: 9999px;
  margin-bottom: 12px;
`;

const Description = styled.p`
  color: #6b7280;
  font-size: 14px;
  line-height: 1.5;
  height: 42px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  margin-bottom: 16px;
`;

const MetaRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid #f3f4f6;
  color: #6b7280;
  font-size: 13px;
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const DeleteButton = styled(Button)`
  position: absolute;
  top: 12px;
  right: 12px;
  opacity: 0;
  transition: opacity 0.2s;

  ${StyledCard}:hover & {
    opacity: 1;
  }
`;

const FolderIcon = styled.div`
  width: 40px;
  height: 40px;
  background-color: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3b82f6;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  position: absolute;
  top: 12px;
  left: 12px;
`;

interface ProjectCardProps {
  project: Project;
  onDelete: (id: number) => void;
  onClick: (id: number) => void;
  isAdmin: boolean;
  canEdit: boolean;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onDelete,
  onClick,
  canEdit,
}) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const confirmDelete = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onDelete(project.id);
  };

  const itemCount = project.hasModels
    ? project.models?.length || 0
    : project.attachments?.length || 0;

  const itemLabel = project.hasModels ? "models" : "files";

  return (
    <StyledCard onClick={() => onClick(project.id)} hoverable>
      <CardImage $bgUrl={project.photoUrl}>
        {!project.photoUrl && (
          <Box size={48} color="#9ca3af" strokeWidth={1.5} />
        )}

        <FolderIcon>
          <FolderOpen size={20} />
        </FolderIcon>

        {canEdit && (
          <div onClick={handleDelete}>
            <Popconfirm
              title="Delete Project"
              description="Are you sure you want to delete this project? This will delete all associated models and documents."
              onConfirm={confirmDelete}
              okText="Yes"
              cancelText="No"
              okButtonProps={{ danger: true }}
            >
              <DeleteButton type="text" danger icon={<Trash2 size={16} />} />
            </Popconfirm>
          </div>
        )}
      </CardImage>

      <CardContent>
        <ProjectTitle title={project.projectName}>
          {project.projectName}
        </ProjectTitle>
        <ProjectDepartment>{project.department}</ProjectDepartment>
        <Description>
          {project.description || "No description provided"}
        </Description>

        <MetaRow>
          <MetaItem>
            {project.hasModels ? <Box size={14} /> : <FileText size={14} />}
            <span>
              {itemCount} {itemLabel}
            </span>
          </MetaItem>
          <MetaItem>
            <Calendar size={14} />
            <span>{new Date(project.createdAt).toLocaleDateString()}</span>
          </MetaItem>
        </MetaRow>
      </CardContent>
    </StyledCard>
  );
};

export default ProjectCard;
