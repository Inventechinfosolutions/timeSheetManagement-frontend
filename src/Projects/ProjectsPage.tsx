import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Plus, Folder, FileText, Calendar, User, Trash2, Edit, X } from 'lucide-react';
import axios from 'axios';

interface Project {
  id: number;
  name: string;
  description: string;
  photoUrl: string;
  files: Array<{
    name: string;
    url: string;
    size: number;
    type: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

const ProjectsPage = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<{id: number, name: string} | null>(null);
  const user = useSelector((state: any) => state.user);
  const navigate = useNavigate();
  
  const isAdmin = user?.currentUser?.userType === 'ADMIN';
  
  // Debug logging
  console.log('ProjectsPage - User state:', user);
  console.log('ProjectsPage - Current user:', user?.currentUser);
  console.log('ProjectsPage - Is Admin:', isAdmin);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/projects');
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = () => {
    navigate('/admin-dashboard/projects/create');
  };

  const handleProjectClick = (project: Project) => {
    navigate(`/admin-dashboard/projects/${project.id}`);
  };

  const handleDeleteProject = (projectId: number, projectName: string) => {
    console.log('Delete button clicked for project:', projectId, projectName);
    setProjectToDelete({ id: projectId, name: projectName });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!projectToDelete) return;
    
    try {
      console.log('Sending delete request for project:', projectToDelete.id);
      const response = await axios.delete(`http://localhost:3000/api/projects/${projectToDelete.id}`);
      console.log('Delete response:', response.status, response.data);
      // Refresh the projects list
      fetchProjects();
      // Close modal
      setShowDeleteModal(false);
      setProjectToDelete(null);
    } catch (error: any) {
      console.error('Error deleting project:', error);
      console.error('Error response:', error.response?.data);
      alert(`Failed to delete project: ${error.response?.data?.message || error.message}`);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setProjectToDelete(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Projects</h1>
          <p className="text-gray-600 mt-2">Manage your company projects</p>
        </div>
        <button
          onClick={handleCreateProject}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          <Plus size={20} />
          Create Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12">
          <Folder size={64} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-500 mb-2">No projects yet</h3>
          <p className="text-gray-400 mb-6">Get started by creating your first project</p>
          <button
            onClick={handleCreateProject}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors mx-auto"
          >
            <Plus size={20} />
            Create Your First Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => handleProjectClick(project)}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="h-48 bg-gray-100 relative overflow-hidden">
                {project.photoUrl ? (
                  <img
                    src={`http://localhost:3000${project.photoUrl}`}
                    alt={project.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Folder size={48} className="text-gray-400" />
                  </div>
                )}
                <div className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-sm">
                  <Folder size={20} className="text-blue-600" />
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-semibold text-gray-800 truncate flex-1">
                    {project.name}
                  </h3>
                  {isAdmin && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProject(project.id, project.name);
                      }}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Project"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {project.description || 'No description provided'}
                </p>
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <FileText size={16} />
                    <span>{project.files?.length || 0} files</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar size={16} />
                    <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && projectToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-800">Delete Project</h3>
                <button
                  onClick={cancelDelete}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete the project <span className="font-semibold text-gray-800">"{projectToDelete.name}"</span>? 
                This action cannot be undone.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={cancelDelete}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Delete Project
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;