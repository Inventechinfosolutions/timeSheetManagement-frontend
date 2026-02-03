import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Plus, X, File, Image, Save, XCircle } from 'lucide-react';
import axios from 'axios';

interface UploadedFile {
  name: string;
  url: string;
  size: number;
  type: string;
  file?: File;
}

const CreateProjectPage = () => {
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!projectName.trim()) {
      newErrors.projectName = 'Project name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      setPhoto(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const newFiles = selectedFiles.map(file => ({
      name: file.name,
      url: '',
      size: file.size,
      type: file.type,
      file: file
    }));
    
    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removePhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
    if (photoInputRef.current) {
      photoInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const uploadPhoto = async () => {
    if (!photo) return null;
    
    const formData = new FormData();
    formData.append('photo', photo);
    
    try {
      const response = await axios.post('http://localhost:3000/api/projects/upload-photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.url;
    } catch (error) {
      console.error('Error uploading photo:', error);
      return null;
    }
  };

  const uploadFiles = async () => {
    if (files.length === 0) return [];
    
    const fileUploads = files.filter(f => f.file);
    if (fileUploads.length === 0) return files;
    
    const formData = new FormData();
    fileUploads.forEach(fileObj => {
      if (fileObj.file) {
        formData.append('files', fileObj.file);
      }
    });
    
    try {
      const response = await axios.post('http://localhost:3000/api/projects/upload-files', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading files:', error);
      return [];
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // Upload photo
      const photoUrl = await uploadPhoto();
      
      // Upload files
      const uploadedFiles = await uploadFiles();
      
      // Create project
      const projectData = {
        name: projectName,
        description: description,
        photoUrl: photoUrl,
        files: uploadedFiles
      };
      
      await axios.post('http://localhost:3000/api/projects', projectData);
      
      // Navigate back to projects page
      navigate('/admin-dashboard/projects');
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? All changes will be lost.')) {
      navigate('/admin-dashboard/projects');
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate('/admin-dashboard/projects')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Projects
        </button>
        <h1 className="text-3xl font-bold text-gray-800">Create New Project</h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        {/* Project Name */}
        <div className="mb-8">
          <label htmlFor="projectName" className="block text-lg font-semibold text-gray-800 mb-2">
            Project Name *
          </label>
          <input
            type="text"
            id="projectName"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
              errors.projectName ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter project name"
          />
          {errors.projectName && (
            <p className="text-red-500 text-sm mt-1">{errors.projectName}</p>
          )}
        </div>

        {/* Project Photo */}
        <div className="mb-8">
          <label className="block text-lg font-semibold text-gray-800 mb-2">
            Project Photo
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
            {photoPreview ? (
              <div className="relative inline-block">
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="max-h-48 rounded-lg shadow-md"
                />
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div>
                <Image className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-600 mb-4">Upload a project photo</p>
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="flex items-center gap-2 mx-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  <Upload size={20} />
                  Choose Photo
                </button>
              </div>
            )}
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Description */}
        <div className="mb-8">
          <label htmlFor="description" className="block text-lg font-semibold text-gray-800 mb-2">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="Enter project description"
          />
        </div>

        {/* Files Upload */}
        <div className="mb-8">
          <label className="block text-lg font-semibold text-gray-800 mb-2">
            Add Files
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 transition-colors">
            <div className="flex flex-col items-center gap-4">
              <File className="text-gray-400" size={32} />
              <div className="text-center">
                <p className="text-gray-600 mb-2">Upload project files</p>
                <p className="text-sm text-gray-500">Supports multiple files (PDF, DOC, XLS, etc.)</p>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                <Plus size={20} />
                Add Files
              </button>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFilesChange}
              className="hidden"
            />
          </div>

          {/* Uploaded Files Preview */}
          {files.length > 0 && (
            <div className="mt-6 space-y-3">
              <h3 className="font-medium text-gray-800">Uploaded Files:</h3>
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <File className="text-blue-500" size={20} />
                    <div>
                      <p className="font-medium text-gray-800">{file.name}</p>
                      <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            <XCircle size={20} />
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Creating...
              </>
            ) : (
              <>
                <Save size={20} />
                Create Project
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateProjectPage;