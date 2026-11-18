import React from "react";
import { ChevronDown } from "lucide-react";
import "./ProjectExpandIcon.css";

interface ProjectExpandIconProps {
  expanded: boolean;
  title?: string;
}

/** Large 3D chevron — invites open when collapsed; flips when expanded. */
export const ProjectExpandIcon: React.FC<ProjectExpandIconProps> = ({
  expanded,
  title = expanded ? "Collapse project" : "Expand project",
}) => (
  <span
    className={`project-expand-3d ${expanded ? "is-open" : "is-closed"}`}
    title={title}
    aria-hidden="true"
  >
    <span className="project-expand-3d-face">
      <ChevronDown className="project-expand-3d-chevron" strokeWidth={2.75} />
    </span>
  </span>
);

export default ProjectExpandIcon;
