import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const apiUrl = "/api/projects";

export interface Project {
  id: number;
  projectName: string;
  description: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

interface ProjectsState {
  entities: Project[];
  loading: boolean;
  error: string | null;
  fileLoading: boolean;
  uploadedFiles: any[];
}

const initialState: ProjectsState = {
  entities: [],
  loading: false,
  error: null,
  fileLoading: false,
  uploadedFiles: [],
};

// Async Thunks
export const getAllProjects = createAsyncThunk(
  "projects/getAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(apiUrl);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Failed to fetch projects");
    }
  }
);

export const createProject = createAsyncThunk(
  "projects/create",
  async (formData: FormData, { rejectWithValue }) => {
    try {
      const response = await axios.post(apiUrl, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Failed to create project");
    }
  }
);

export const deleteProject = createAsyncThunk(
  "projects/delete",
  async (id: number, { rejectWithValue }) => {
    try {
      await axios.delete(`${apiUrl}/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Failed to delete project");
    }
  }
);

// File Management Thunks
export const uploadProjectFile = createAsyncThunk(
  "projects/uploadFile",
  async ({ entityId, refId, refType, entityType, formData }: any, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${apiUrl}/upload-file/entityId/${entityId}/refId/${refId}?refType=${refType}&entityType=${entityType}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Failed to upload file");
    }
  }
);

export const getProjectFiles = createAsyncThunk(
  "projects/getFiles",
  async ({ entityId, refId, refType, entityType }: any, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${apiUrl}/entityId/${entityId}/refId/${refId}/get-files?refType=${refType}&entityType=${entityType}`
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Failed to fetch files");
    }
  }
);

export const downloadProjectFile = createAsyncThunk(
  "projects/downloadFile",
  async ({ entityId, refId, refType, entityType, key }: any, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${apiUrl}/entityId/${entityId}/refId/${refId}/download-file?key=${key}&refType=${refType}&entityType=${entityType}`,
        { responseType: "blob" }
      );
      return { data: response.data, headers: response.headers };
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Failed to download file");
    }
  }
);

export const previewProjectFile = createAsyncThunk(
  "projects/previewFile",
  async ({ entityId, refId, refType, entityType, key }: any, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${apiUrl}/entityId/${entityId}/refId/${refId}/view?key=${key}&refType=${refType}&entityType=${entityType}`,
        { responseType: "blob" }
      );
      return { data: response.data, headers: response.headers };
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Failed to preview file");
    }
  }
);

export const deleteProjectFile = createAsyncThunk(
  "projects/deleteFile",
  async ({ entityId, refId, refType, entityType, key }: any, { rejectWithValue }) => {
    try {
      await axios.delete(
        `${apiUrl}/entityId/${entityId}/refId/${refId}/delete?key=${key}&refType=${refType}&entityType=${entityType}`
      );
      return key;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Failed to delete file");
    }
  }
);

const projectsSlice = createSlice({
  name: "projects",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getAllProjects.pending, (state) => {
        state.loading = true;
      })
      .addCase(getAllProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.entities = action.payload;
      })
      .addCase(getAllProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.entities.unshift(action.payload);
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.entities = state.entities.filter((p) => p.id !== action.payload);
      })
      // File handling
      .addCase(uploadProjectFile.pending, (state) => {
        state.fileLoading = true;
      })
      .addCase(uploadProjectFile.fulfilled, (state, action) => {
        state.fileLoading = false;
        const uploadedData = action.payload.data?.data || action.payload.data || action.payload;
        if (Array.isArray(uploadedData)) {
          state.uploadedFiles.push(...uploadedData);
        } else {
          state.uploadedFiles.push(uploadedData);
        }
      })
      .addCase(uploadProjectFile.rejected, (state, action) => {
        state.fileLoading = false;
        state.error = action.payload as string;
      })
      .addCase(getProjectFiles.fulfilled, (state, action) => {
        state.uploadedFiles = action.payload.data || action.payload;
      })
      .addCase(deleteProjectFile.fulfilled, (state, action) => {
        state.uploadedFiles = state.uploadedFiles.filter((f) => f.key !== action.payload);
      });
  },
});

export default projectsSlice.reducer;
