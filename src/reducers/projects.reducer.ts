import { createAsyncThunk, createSlice, PayloadAction, ActionReducerMapBuilder, isFulfilled, isPending } from '@reduxjs/toolkit';
import axios from 'axios';

const apiUrl = '/api/projects';

interface ThunkConfig {
  dispatch: any;
  state: any;
  rejectValue: string;
}

export interface ProjectAttachment {
  id: number;
  fileName: string;
  fileUrl: string;
  fileKey: string;
  modelId?: number;
  createdAt: Date;
}

export interface ProjectModel {
  id: number;
  modelName: string;
  projectId: number;
  attachments?: ProjectAttachment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: number;
  projectName: string;
  department: string;
  description?: string;
  photoUrl?: string;
  photoKey?: string;
  hasModels: boolean;
  models?: ProjectModel[];
  attachments?: ProjectAttachment[];
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

interface ProjectsState {
  loading: boolean;
  errorMessage: string | null;
  projects: Project[];
  currentProject: Project | null;
  updating: boolean;
  updateSuccess: boolean;
  uploadLoading: boolean;
}

const initialState: ProjectsState = {
  loading: false,
  errorMessage: null,
  projects: [],
  currentProject: null,
  updating: false,
  updateSuccess: false,
  uploadLoading: false,
};

// Get all projects (department filtered)
export const getProjects = createAsyncThunk<Project[], void, ThunkConfig>(
  'projects/fetch_list',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(apiUrl);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Request failed');
    }
  }
);

// Get single project
export const getProject = createAsyncThunk<Project, number, ThunkConfig>(
  'projects/fetch_one',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${apiUrl}/${id}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Request failed');
    }
  }
);

// Create project
export const createProject = createAsyncThunk<
  Project,
  { projectName: string; description?: string; hasModels: boolean; department?: string },
  ThunkConfig
>(
  'projects/create',
  async (entity, { dispatch, rejectWithValue }) => {
    try {
      const response = await axios.post(apiUrl, entity);
      dispatch(getProjects());
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Request failed');
    }
  }
);

// Update project
export const updateProject = createAsyncThunk<
  Project,
  { id: number; updates: Partial<Project> },
  ThunkConfig
>(
  'projects/update',
  async ({ id, updates }, { dispatch, rejectWithValue }) => {
    try {
      const response = await axios.put(`${apiUrl}/${id}`, updates);
      dispatch(getProject(id));
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Request failed');
    }
  }
);

// Delete project
export const deleteProject = createAsyncThunk<void, number, ThunkConfig>(
  'projects/delete',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      await axios.delete(`${apiUrl}/${id}`);
      dispatch(getProjects());
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Request failed');
    }
  }
);

// Upload project photo
export const uploadProjectPhoto = createAsyncThunk<
  any,
  { projectId: number; file: File },
  ThunkConfig
>(
  'projects/upload_photo',
  async ({ projectId, file }, { dispatch, rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('photo', file);
      
      const response = await axios.post(`${apiUrl}/${projectId}/upload-photo`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      dispatch(getProject(projectId));
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Upload failed');
    }
  }
);

// Upload project documents (no models)
export const uploadProjectDocuments = createAsyncThunk<
  any,
  { projectId: number; files: File[] },
  ThunkConfig
>(
  'projects/upload_documents',
  async ({ projectId, files }, { dispatch, rejectWithValue }) => {
    try {
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));
      
      const response = await axios.post(`${apiUrl}/${projectId}/upload-documents`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      dispatch(getProject(projectId));
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Upload failed');
    }
  }
);

// Delete project attachment
export const deleteProjectAttachment = createAsyncThunk<
  void,
  { projectId: number; attachmentId: number },
  ThunkConfig
>(
  'projects/delete_attachment',
  async ({ projectId, attachmentId }, { dispatch, rejectWithValue }) => {
    try {
      await axios.delete(`${apiUrl}/${projectId}/attachments/${attachmentId}`);
      dispatch(getProject(projectId));
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Delete failed');
    }
  }
);

// Create model
export const createModel = createAsyncThunk<
  ProjectModel,
  { projectId: number; modelName: string },
  ThunkConfig
>(
  'projects/create_model',
  async ({ projectId, modelName }, { dispatch, rejectWithValue }) => {
    try {
      const response = await axios.post(`${apiUrl}/${projectId}/models`, { modelName });
      dispatch(getProject(projectId));
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Request failed');
    }
  }
);

// Update model
export const updateModel = createAsyncThunk<
  ProjectModel,
  { projectId: number; modelId: number; modelName: string },
  ThunkConfig
>(
  'projects/update_model',
  async ({ projectId, modelId, modelName }, { dispatch, rejectWithValue }) => {
    try {
      const response = await axios.put(`${apiUrl}/${projectId}/models/${modelId}`, { modelName });
      dispatch(getProject(projectId));
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Request failed');
    }
  }
);

// Delete model
export const deleteModel = createAsyncThunk<
  void,
  { projectId: number; modelId: number },
  ThunkConfig
>(
  'projects/delete_model',
  async ({ projectId, modelId }, { dispatch, rejectWithValue }) => {
    try {
      await axios.delete(`${apiUrl}/${projectId}/models/${modelId}`);
      dispatch(getProject(projectId));
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Delete failed');
    }
  }
);

// Upload model documents
export const uploadModelDocuments = createAsyncThunk<
  any,
  { projectId: number; modelId: number; files: File[] },
  ThunkConfig
>(
  'projects/upload_model_documents',
  async ({ projectId, modelId, files }, { dispatch, rejectWithValue }) => {
    try {
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));
      
      const response = await axios.post(`${apiUrl}/${projectId}/models/${modelId}/upload-documents`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      dispatch(getProject(projectId));
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Upload failed');
    }
  }
);

// Delete model attachment
export const deleteModelAttachment = createAsyncThunk<
  void,
  { projectId: number; modelId: number; attachmentId: number },
  ThunkConfig
>(
  'projects/delete_model_attachment',
  async ({ projectId, modelId, attachmentId }, { dispatch, rejectWithValue }) => {
    try {
      await axios.delete(`${apiUrl}/${projectId}/models/${modelId}/attachments/${attachmentId}`);
      dispatch(getProject(projectId));
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Delete failed');
    }
  }
);

export const ProjectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    reset: () => initialState,
    clearCurrentProject: (state) => {
      state.currentProject = null;
    },
    resetUpdateSuccess: (state) => {
      state.updateSuccess = false;
    },
  },
  extraReducers: (builder: ActionReducerMapBuilder<ProjectsState>) => {
    builder
      .addCase(getProjects.fulfilled, (state, action: PayloadAction<Project[]>) => {
        state.loading = false;
        state.projects = action.payload;
      })
      .addCase(getProject.fulfilled, (state, action: PayloadAction<Project>) => {
        state.loading = false;
        state.currentProject = action.payload;
      })
      .addCase(deleteProject.fulfilled, (state) => {
        state.updating = false;
        state.updateSuccess = true;
        state.currentProject = null;
      })
      .addMatcher(
        isFulfilled(createProject, updateProject, createModel, updateModel, deleteModel),
        (state) => {
          state.updating = false;
          state.updateSuccess = true;
        }
      )
      .addMatcher(
        isFulfilled(uploadProjectPhoto, uploadProjectDocuments, uploadModelDocuments),
        (state) => {
          state.uploadLoading = false;
          state.updateSuccess = true;
        }
      )
      .addMatcher(
        isPending(uploadProjectPhoto, uploadProjectDocuments, uploadModelDocuments),
        (state) => {
          state.uploadLoading = true;
          state.errorMessage = null;
        }
      )
      .addMatcher(
        isPending(getProjects, getProject, createProject, updateProject, deleteProject, createModel, updateModel, deleteModel),
        (state) => {
          state.errorMessage = null;
          state.updateSuccess = false;
          state.loading = true;
          state.updating = true;
        }
      )
      .addMatcher(
        (action: any) => action.type.startsWith('projects/') && action.type.endsWith('/rejected'),
        (state, action: any) => {
          state.updating = false;
          state.loading = false;
          state.uploadLoading = false;
          state.errorMessage = action.payload || action.error?.message || 'Operation failed';
        }
      );
  },
});

export const { reset, clearCurrentProject, resetUpdateSuccess } = ProjectsSlice.actions;

export default ProjectsSlice.reducer;
