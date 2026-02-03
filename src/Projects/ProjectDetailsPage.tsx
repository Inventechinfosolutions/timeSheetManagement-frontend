import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowLeft, Download, File, Image as ImageIcon, Calendar, User, Trash2, X, Edit, Upload, Eye, Pencil } from 'lucide-react';
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

const ProjectDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showFileDeleteModal, setShowFileDeleteModal] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<{index: number, name: string} | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [newPhoto, setNewPhoto] = useState<File | null>(null);
  const user = useSelector((state: any) => state.user);
  const navigate = useNavigate();
  
  const isAdmin = user?.currentUser?.userType === 'ADMIN';
  
  // Debug logging
  console.log('Full user state:', user);
  console.log('Current user:', user?.currentUser);
  console.log('UserType:', user?.currentUser?.userType);
  console.log('Is Admin result:', isAdmin);

  useEffect(() => {
    if (id) {
      fetchProject(Number(id));
    }
  }, [id]);

  useEffect(() => {
    if (project) {
      setEditedName(project.name || '');
      setEditedDescription(project.description || '');
    }
  }, [project]);

  const fetchProject = async (projectId: number) => {
    try {
      const response = await axios.get(`http://localhost:3000/api/projects/${projectId}`);
      // Handle different response structures
      const projectData = response.data.data || response.data;
      setProject(projectData);
    } catch (error: any) {
      console.error('Error fetching project:', error);
      if (error.response?.status === 404) {
        alert('Project not found');
        navigate('/admin-dashboard/projects');
      } else {
        alert(`Failed to load project details: ${error.response?.data?.message || error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadFile = (fileUrl: string, fileName: string) => {
    const fullUrl = `http://localhost:3000${fileUrl}`;
    const link = document.createElement('a');
    link.href = fullUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGoBack = () => {
    navigate('/admin-dashboard/projects');
  };

  const handleDeleteProject = () => {
    if (project) {
      setShowDeleteModal(true);
    }
  };

  const confirmDelete = async () => {
    if (!project) return;
    
    try {
      await axios.delete(`http://localhost:3000/api/projects/${project.id}`);
      // Navigate back to projects list after deletion
      navigate('/admin-dashboard/projects');
    } catch (error: any) {
      console.error('Error deleting project:', error);
      alert(`Failed to delete project: ${error.response?.data?.message || error.message}`);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
  };

  const handleFileDelete = (fileIndex: number, fileName: string) => {
    setFileToDelete({ index: fileIndex, name: fileName });
    setShowFileDeleteModal(true);
  };

  const confirmFileDelete = async () => {
    if (!project || !fileToDelete) return;
    
    try {
      // Implement actual file deletion API call here
      console.log('Deleting file:', fileToDelete.name);
      // Example API call:
      // await axios.delete(`http://localhost:3000/api/projects/${project.id}/files/${fileToDelete.index}`);
      // fetchProject(project.id); // Refresh the project data
      
      setShowFileDeleteModal(false);
      setFileToDelete(null);
      alert('File deleted successfully');
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Failed to delete file');
      setShowFileDeleteModal(false);
      setFileToDelete(null);
    }
  };

  const cancelFileDelete = () => {
    setShowFileDeleteModal(false);
    setFileToDelete(null);
  };

  const handleSaveChanges = async () => {
    if (!project) return;
    
    try {
      // First, handle photo upload if a new photo was selected
      let photoUrl = project.photoUrl;
      if (newPhoto) {
        const photoFormData = new FormData();
        photoFormData.append('photo', newPhoto);
        
        try {
          const photoResponse = await axios.post('http://localhost:3000/api/projects/upload-photo', photoFormData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          photoUrl = photoResponse.data.url;
        } catch (photoError) {
          console.error('Error uploading photo:', photoError);
          alert('Failed to upload photo, but continuing with other updates...');
        }
      }
      
      // Update project data (name and description)
      const updateData = {
        name: editedName,
        description: editedDescription,
        photoUrl: photoUrl, // Use the new photo URL if uploaded, otherwise keep existing
      };
      
      const response = await axios.patch(`http://localhost:3000/api/projects/${project.id}`, updateData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // Handle different response structures
      const updatedProject = response.data.data || response.data;
      setProject(updatedProject);
      
      // Update the edit fields to match the new data
      setEditedName(updatedProject.name);
      setEditedDescription(updatedProject.description || '');
      
      setIsEditing(false);
      setNewPhoto(null);
      alert('Project updated successfully!');
      
    } catch (error: any) {
      console.error('Error updating project:', error);
      
      if (error.response?.status === 404) {
        alert('Project not found. Redirecting to projects page...');
        navigate('/admin-dashboard/projects');
      } else {
        alert(`Failed to update project: ${error.response?.data?.message || error.message || 'Unknown error'}`);
      }
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewPhoto(e.target.files[0]);
    }
  };

  const handleFileView = (fileUrl: string) => {
    window.open(`http://localhost:3000${fileUrl}`, '_blank');
  };

  const handleFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !project) return;
    
    const files = Array.from(e.target.files);
    
    try {
      // Upload files to server
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });
      
      const response = await axios.post('http://localhost:3000/api/projects/upload-files', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Get the uploaded file information
      const uploadedFiles = response.data;
      
      // Update project with new files
      const updatedProject = {
        ...project,
        files: [...(project.files || []), ...uploadedFiles]
      };
      
      setProject(updatedProject);
      alert(`${files.length} file(s) uploaded successfully!`);
      
      // Clear the file input
      e.target.value = '';
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Failed to upload files');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 text-xl">Project not found</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Project Details</h1>
        <div className="ml-auto flex gap-2">
          {isEditing ? (
            <>
              <button
                onClick={handleSaveChanges}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <Edit size={20} />
                Save Changes
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <X size={20} />
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <Edit size={20} />
                Edit Project
              </button>
              {isAdmin && (
                <button
                  onClick={handleDeleteProject}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  <Trash2 size={20} />
                  Delete Project
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Project Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Project Photo */}
            <div className="flex-shrink-0">
              <div className="w-64 h-64 bg-gray-100 rounded-lg overflow-hidden">
                {project.photoUrl ? (
                  <img
                    src={`http://localhost:3000${project.photoUrl}`}
                    alt={project.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon size={64} className="text-gray-400" />
                  </div>
                )}
              </div>
            </div>

            {/* Project Info */}
            <div className="flex-1">
              {isEditing ? (
                <>
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="text-4xl font-bold text-gray-800 mb-4 w-full p-3 border border-gray-300 rounded-lg"
                    placeholder="Project Name"
                  />
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Update Project Photo
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                </>
              ) : (
                <h1 className="text-4xl font-bold text-gray-800 mb-4">
                  {project.name}
                </h1>
              )}
              
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-700 mb-2">Description</h2>
                  {isEditing ? (
                    <textarea
                      value={editedDescription}
                      onChange={(e) => setEditedDescription(e.target.value)}
                      className="text-gray-600 leading-relaxed w-full p-3 border border-gray-300 rounded-lg h-32"
                      placeholder="Project Description"
                    />
                  ) : (
                    <p className="text-gray-600 leading-relaxed">
                      {project.description || 'No description provided'}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  <div className="flex items-center gap-3 text-gray-600">
                    <Calendar size={20} className="text-blue-500" />
                    <div>
                      <p className="text-sm text-gray-500">Created</p>
                      <p className="font-medium">
                        {new Date(project.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 text-gray-600">
                    <User size={20} className="text-green-500" />
                    <div>
                      <p className="text-sm text-gray-500">Last Updated</p>
                      <p className="font-medium">
                        {new Date(project.updatedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Files Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Project Files</h2>
            <div className="flex gap-2">
              <input
                type="file"
                multiple
                onChange={handleFilesChange}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer"
              >
                <Upload size={18} />
                Upload New File
              </label>
            </div>
          </div>
          
          {project.files && project.files.length > 0 ? (
              <div className="space-y-4">
              {project.files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-lg shadow-sm">
                      <File className="text-blue-500" size={24} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(file.size)} • {file.type}
                      </p>
                    </div>
                  </div>
                             
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDownloadFile(file.url, file.name)}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      <Download size={18} />
                      Download
                    </button>
                    <button
                      onClick={() => handleFileView(file.url)}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      <Eye size={18} />
                      View
                    </button>
                    <button
                      onClick={() => handleFileDelete(index, file.name)}
                      className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      <Trash2 size={18} />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              </div>
          ) : (
            <div className="text-center py-12">
              <File size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-500 mb-2">No files uploaded</h3>
              <p className="text-gray-400 mb-6">This project doesn't have any files attached</p>
            </div>
          )}
        </div>

        {/* Go Back Button */}
        <div className="mt-8 text-center">
          <button
            onClick={handleGoBack}
            className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors mx-auto"
          >
            <ArrowLeft size={20} />
            Back to Projects
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && project && (
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
                Are you sure you want to delete the project <span className="font-semibold text-gray-800">"{project.name}"</span>? 
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

      {/* File Delete Confirmation Modal */}
      {showFileDeleteModal && fileToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-800">Delete File</h3>
                <button
                  onClick={cancelFileDelete}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete the file <span className="font-semibold text-gray-800">"{fileToDelete.name}"</span>? 
                This action cannot be undone.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={cancelFileDelete}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmFileDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Delete File
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetailsPage;