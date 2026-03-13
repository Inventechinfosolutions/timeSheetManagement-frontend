import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
    ClipboardList, 
    Plus, 
    X, 
    Trash2, 
    Image as ImageIcon,
    CheckCircle2,
    Loader2,
    Files
} from 'lucide-react';
import { Modal, message } from 'antd';
import { RootState, AppDispatch } from '../store';
import { 
    getAllProjects, 
    createProject, 
    deleteProject,
    uploadProjectFile,
    getProjectFiles,
    downloadProjectFile,
    previewProjectFile,
    deleteProjectFile
} from '../reducers/projects.reducer';
import CommonMultipleUploader from '../EmployeeDashboard/CommonMultipleUploader';

const ProjectDocument: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { entities: projects, loading: isFetching, error: apiError } = useSelector((state: RootState) => state.projects);
    
    // UI State
    const [isCreating, setIsCreating] = useState(false);
    const [projectName, setProjectName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [manageDocsProject, setManageDocsProject] = useState<any>(null);

    useEffect(() => {
        dispatch(getAllProjects());
    }, [dispatch]);

    // Handle Image Selection for cover during creation
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                message.error("Image size should be less than 5MB");
                return;
            }
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Handle Form Submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!projectName.trim()) {
            message.warning("Project Name is required");
            return;
        }

        setLoading(true);

        try {
            const formData = new FormData();
            formData.append('projectName', projectName);
            formData.append('description', description);
            if (selectedImage) {
                formData.append('file', selectedImage);
            }

            await dispatch(createProject(formData)).unwrap();
            message.success("Project created successfully");

            // Reset Form
            setProjectName('');
            setDescription('');
            setSelectedImage(null);
            setImagePreview(null);
            setIsCreating(false);
        } catch (err: any) {
            console.error('Error creating project:', err);
            message.error(err.message || "Failed to create project");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteProject = async (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        Modal.confirm({
            title: 'Delete Project',
            content: 'Are you sure you want to delete this project? All associated documents will also be removed.',
            okText: 'Yes, Delete',
            okType: 'danger',
            cancelText: 'No',
            onOk: async () => {
                try {
                    await dispatch(deleteProject(id)).unwrap();
                    message.success("Project deleted successfully");
                } catch (err) {
                    message.error("Failed to delete project");
                }
            }
        });
    };

    return (
        <div className="p-4 md:p-8 bg-[#F4F7FE] min-h-screen">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-2xl text-[#4318FF] shadow-sm">
                        <ClipboardList size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-[#2B3674]">Project Documents</h1>
                        <p className="text-[#A3AED0] text-sm hidden md:block">Manage and organize your project-related documentation.</p>
                    </div>
                </div>

                <button 
                    onClick={() => setIsCreating(true)}
                    className="flex items-center justify-center gap-2 bg-[#4318FF] hover:bg-[#3311DB] text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg active:scale-95 whitespace-nowrap"
                >
                    <Plus size={20} />
                    Create New Project
                </button>
            </div>

            {/* Global Error message */}
            {apiError && (
                <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3 text-sm font-medium border border-red-100 animate-in fade-in slide-in-from-top-2">
                    {apiError}
                </div>
            )}

            {/* Creation Modal */}
            {isCreating && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="flex justify-between items-center p-6 md:p-8 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-[#2B3674]">New Project Card</h2>
                            <button 
                                onClick={() => setIsCreating(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-[#2B3674] ml-1">Project Name</label>
                                <input 
                                    type="text"
                                    value={projectName}
                                    onChange={(e) => setProjectName(e.target.value)}
                                    placeholder="Enter project name..."
                                    disabled={loading}
                                    className="w-full px-5 py-3.5 rounded-2xl border border-gray-200 outline-none focus:border-[#4318FF] transition-all text-[#2B3674] bg-gray-50/50 disabled:opacity-50"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-[#2B3674] ml-1">Description</label>
                                <textarea 
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Briefly describe the project..."
                                    rows={3}
                                    disabled={loading}
                                    className="w-full px-5 py-3.5 rounded-2xl border border-gray-200 outline-none focus:border-[#4318FF] transition-all text-[#2B3674] bg-gray-50/50 resize-none disabled:opacity-50"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-[#2B3674] ml-1">Upload Cover Image</label>
                                <div 
                                    className={`relative border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center gap-3 transition-all
                                        ${imagePreview ? 'border-[#4318FF] bg-blue-50/10' : 'border-gray-200 hover:border-gray-300 bg-gray-50/50'}
                                        ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                    `}
                                >
                                    {imagePreview ? (
                                        <div className="relative group w-full max-w-[200px] aspect-video">
                                            <img 
                                                src={imagePreview} 
                                                alt="Preview" 
                                                className="w-full h-full object-cover rounded-xl shadow-md"
                                            />
                                            {!loading && (
                                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-xl">
                                                    <button 
                                                        type="button"
                                                        onClick={(e) => {e.preventDefault(); setSelectedImage(null); setImagePreview(null);}}
                                                        className="p-2 bg-red-600 text-white rounded-full shadow-lg"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            <div className="p-4 bg-white rounded-2xl shadow-sm text-gray-300">
                                                <ImageIcon size={32} />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm font-bold text-[#2B3674]">Drop your image here, or browse</p>
                                                <p className="text-xs text-gray-400 mt-1">Supports: JPG, PNG (Max 5MB)</p>
                                            </div>
                                        </>
                                    )}
                                    <input 
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        disabled={loading}
                                        className={`absolute inset-0 opacity-0 ${loading ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button 
                                    type="button"
                                    onClick={() => setIsCreating(false)}
                                    disabled={loading}
                                    className="flex-1 py-3.5 rounded-2xl font-bold text-[#2B3674] border border-gray-200 hover:bg-gray-50 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 py-3.5 bg-[#4318FF] hover:bg-[#3311DB] text-white rounded-2xl font-bold shadow-lg shadow-[#4318FF40] transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 size={20} className="animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 size={20} />
                                            Confirm & Create
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Document Management Modal */}
            <Modal
                title={<h2 className="text-xl font-bold text-[#2B3674] pt-4 px-2">Project Documents: {manageDocsProject?.projectName}</h2>}
                open={!!manageDocsProject}
                onCancel={() => setManageDocsProject(null)}
                footer={null}
                width={800}
                className="custom-modal"
                bodyStyle={{ padding: '24px' }}
            >
                {manageDocsProject && (
                    <CommonMultipleUploader
                        entityType="PROJECT"
                        entityId={manageDocsProject.id}
                        refId={manageDocsProject.id}
                        refType="PROJECT_DOCUMENT"
                        uploadFile={uploadProjectFile}
                        getFiles={getProjectFiles}
                        downloadFile={downloadProjectFile}
                        previewFile={previewProjectFile}
                        deleteFile={deleteProjectFile}
                        maxFiles={20}
                    />
                )}
            </Modal>

            {/* Projects Grid */}
            {isFetching ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 size={48} className="text-[#4318FF] animate-spin mb-4" />
                    <p className="text-[#A3AED0] font-medium">Loading projects...</p>
                </div>
            ) : projects.length === 0 ? (
                <div className="bg-white rounded-[40px] p-20 shadow-sm border border-gray-50 flex flex-col items-center justify-center text-center">
                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                        <ClipboardList size={48} className="text-gray-200" />
                    </div>
                    <h3 className="text-xl font-bold text-[#2B3674]">No Projects Found</h3>
                    <p className="text-[#A3AED0] max-w-xs mt-2">
                        You haven't created any project cards yet.
                    </p>
                    <button 
                        onClick={() => setIsCreating(true)}
                        className="mt-8 flex items-center gap-2 text-[#4318FF] font-bold hover:underline"
                    >
                        <Plus size={18} />
                        Add your first project
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {projects.map((project) => (
                        <div 
                            key={project.id}
                            className="bg-white rounded-[32px] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group flex flex-col"
                        >
                            {/* Card Image */}
                            <div className="relative aspect-video bg-gray-100 overflow-hidden">
                                {project.image ? (
                                    <img 
                                        src={project.image} 
                                        alt={project.projectName}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                        <ImageIcon size={48} />
                                    </div>
                                )}
                                <div className="absolute top-4 right-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 flex gap-2">
                                    <button 
                                        onClick={(e) => handleDeleteProject(project.id, e)}
                                        className="p-2.5 bg-white/90 backdrop-blur-sm text-red-500 rounded-xl shadow-lg hover:bg-red-50 transition-colors"
                                        title="Delete Project"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Card Info */}
                            <div className="p-6 flex-1 flex flex-col">
                                <span className="text-[10px] font-bold text-[#A3AED0] uppercase tracking-widest mb-2 block">
                                    {new Date(project.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                </span>
                                <h3 className="text-lg font-bold text-[#2B3674] mb-2 line-clamp-1">{project.projectName}</h3>
                                <p className="text-sm text-[#A3AED0] line-clamp-2 leading-relaxed flex-1">
                                    {project.description || "No description provided."}
                                </p>
                                
                                <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between">
                                    <button 
                                        onClick={() => setManageDocsProject(project)}
                                        className="flex items-center gap-2 text-sm font-bold text-[#4318FF] hover:underline"
                                    >
                                        <Files size={16} />
                                        Documents
                                    </button>
                                    <button className="text-[12px] font-bold text-[#707EAE] hover:text-[#2B3674] transition-colors">Details</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProjectDocument;
