import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import {
  NotesState,
  Note,
  NoteType,
  CreateNotePayload,
  UpdateNotePayload,
  CreateSubNotePayload,
  QueryNotesParams,
  NoteStats,
} from '../types/notes.types';

const API_BASE = '/api/notes';

const initialState: NotesState = {
  notes: [],
  totalNotesCount: 0,
  selectedNote: null,
  activeTab: 'PERSONAL',
  selectedProject: '',
  searchQuery: '',
  projects: [],
  stats: {
    totalNotes: 0,
    personalNotes: 0,
    projectNotes: 0,
    pinnedNotes: 0,
    totalAttachments: 0,
  },
  loading: false,
  actionLoading: false,
  error: null,
};

// Fetch Notes
export const fetchNotes = createAsyncThunk(
  'notes/fetchNotes',
  async (params: QueryNotesParams = {}, { rejectWithValue }) => {
    try {
      const searchParams = new URLSearchParams();
      if (params.type) searchParams.append('type', params.type);
      if (params.projectName) searchParams.append('projectName', params.projectName);
      if (params.search) searchParams.append('search', params.search);
      if (params.isPinned !== undefined) searchParams.append('isPinned', String(params.isPinned));
      if (params.isArchived !== undefined) searchParams.append('isArchived', String(params.isArchived));

      const queryStr = searchParams.toString();
      const url = queryStr ? `${API_BASE}?${queryStr}` : API_BASE;
      const response = await axios.get(url);
      return response.data; // { data: Note[], total: number }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch notes');
    }
  }
);

// Fetch Note Stats
export const fetchNoteStats = createAsyncThunk(
  'notes/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE}/stats`);
      return response.data as NoteStats;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch note stats');
    }
  }
);

// Fetch Distinct Projects
export const fetchProjectsList = createAsyncThunk(
  'notes/fetchProjects',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE}/projects`);
      return response.data as string[];
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch projects');
    }
  }
);

// Fetch Note By ID
export const fetchNoteById = createAsyncThunk(
  'notes/fetchById',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE}/${id}`);
      return response.data as Note;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch note details');
    }
  }
);

// Create Note (Supports Multi-part Files and Sub-notes)
export const createNote = createAsyncThunk(
  'notes/createNote',
  async (payload: CreateNotePayload, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('title', payload.title);
      if (payload.description) formData.append('description', payload.description);
      if (payload.type) formData.append('type', payload.type);
      if (payload.projectName) formData.append('projectName', payload.projectName);
      if (payload.parentId) formData.append('parentId', String(payload.parentId));
      if (payload.color) formData.append('color', payload.color);
      if (payload.isPinned !== undefined) formData.append('isPinned', String(payload.isPinned));

      if (payload.subNotes && payload.subNotes.length > 0) {
        formData.append('subNotes', JSON.stringify(payload.subNotes));
      }

      if (payload.files && payload.files.length > 0) {
        payload.files.forEach((file) => {
          formData.append('files', file);
        });
      }

      const response = await axios.post(API_BASE, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data as Note;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create note');
    }
  }
);

// Update Note
export const updateNote = createAsyncThunk(
  'notes/updateNote',
  async (payload: UpdateNotePayload, { rejectWithValue }) => {
    try {
      const { id, ...data } = payload;
      const response = await axios.patch(`${API_BASE}/${id}`, data);
      return response.data as Note;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update note');
    }
  }
);

// Delete Note
export const deleteNote = createAsyncThunk(
  'notes/deleteNote',
  async (id: number, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_BASE}/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete note');
    }
  }
);

// Toggle Pin
export const togglePinNote = createAsyncThunk(
  'notes/togglePin',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${API_BASE}/${id}/pin`);
      return response.data as Note;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to toggle pin');
    }
  }
);

// Create Sub-note
export const createSubNote = createAsyncThunk(
  'notes/createSubNote',
  async (payload: CreateSubNotePayload, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('title', payload.title);
      if (payload.description) formData.append('description', payload.description);
      if (payload.color) formData.append('color', payload.color);
      if (payload.orderIndex !== undefined) formData.append('orderIndex', String(payload.orderIndex));

      if (payload.files && payload.files.length > 0) {
        payload.files.forEach((file) => {
          formData.append('files', file);
        });
      }

      const response = await axios.post(`${API_BASE}/${payload.parentId}/sub-notes`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return { parentId: payload.parentId, subNote: response.data as Note };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create sub-note');
    }
  }
);

// Upload Attachments to Existing Note
export const uploadNoteAttachments = createAsyncThunk(
  'notes/uploadAttachments',
  async ({ noteId, files }: { noteId: number; files: File[] }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));

      const response = await axios.post(`${API_BASE}/${noteId}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return { noteId, attachments: response.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to upload attachments');
    }
  }
);

// Delete Note Attachment from object_store
export const deleteNoteAttachment = createAsyncThunk(
  'notes/deleteAttachment',
  async ({ noteId, key }: { noteId?: number; key: string }, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_BASE}/attachments/${key}`);
      return { noteId, key };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete attachment');
    }
  }
);

// Preview Attachment (Fetches blob via API with authorization headers)
export const previewNoteAttachment = createAsyncThunk(
  'notes/previewAttachment',
  async (key: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE}/attachments/${key}/view`, {
        responseType: 'blob',
      });
      return {
        data: response.data,
        headers: response.headers,
        key,
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to preview file');
    }
  }
);

// Download Attachment (Fetches blob via API with authorization headers and triggers download)
export const downloadNoteAttachment = createAsyncThunk(
  'notes/downloadAttachment',
  async ({ key, fileName }: { key: string; fileName?: string }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE}/attachments/${key}/download`, {
        responseType: 'blob',
      });
      const contentType = response.headers?.['content-type'] || 'application/octet-stream';
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName || 'download');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      return { key, fileName: fileName || 'download' };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to download file');
    }
  }
);

// Preview Attachment URL helper
export const getNoteAttachmentPreviewUrl = (key: string): string => {
  return `${API_BASE}/attachments/${key}/view`;
};

const notesSlice = createSlice({
  name: 'notes',
  initialState,
  reducers: {
    setActiveTab: (state, action: PayloadAction<NoteType>) => {
      state.activeTab = action.payload;
    },
    setSelectedProject: (state, action: PayloadAction<string>) => {
      state.selectedProject = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setSelectedNote: (state, action: PayloadAction<Note | null>) => {
      state.selectedNote = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Notes
      .addCase(fetchNotes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotes.fulfilled, (state, action) => {
        state.loading = false;
        state.notes = action.payload?.data || [];
        state.totalNotesCount = action.payload?.total || 0;
      })
      .addCase(fetchNotes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Stats
      .addCase(fetchNoteStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })

      // Projects
      .addCase(fetchProjectsList.fulfilled, (state, action) => {
        state.projects = action.payload || [];
      })

      // Note Details
      .addCase(fetchNoteById.fulfilled, (state, action) => {
        state.selectedNote = action.payload;
      })

      // Create Note
      .addCase(createNote.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(createNote.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.notes.unshift(action.payload);
        state.totalNotesCount += 1;
        if (action.payload.type === 'PERSONAL') state.stats.personalNotes += 1;
        if (action.payload.type === 'PROJECT') state.stats.projectNotes += 1;
        state.stats.totalNotes += 1;
      })
      .addCase(createNote.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      })

      // Update Note
      .addCase(updateNote.fulfilled, (state, action) => {
        const index = state.notes.findIndex((n) => n.id === action.payload.id);
        if (index !== -1) {
          state.notes[index] = action.payload;
        }
        if (state.selectedNote?.id === action.payload.id) {
          state.selectedNote = action.payload;
        }
      })

      // Delete Note
      .addCase(deleteNote.fulfilled, (state, action) => {
        const deletedId = action.payload;
        const noteToDelete = state.notes.find((n) => n.id === deletedId);
        if (noteToDelete) {
          if (noteToDelete.type === 'PERSONAL') state.stats.personalNotes = Math.max(0, state.stats.personalNotes - 1);
          if (noteToDelete.type === 'PROJECT') state.stats.projectNotes = Math.max(0, state.stats.projectNotes - 1);
          state.stats.totalNotes = Math.max(0, state.stats.totalNotes - 1);
        }
        state.notes = state.notes.filter((n) => n.id !== deletedId);
        if (state.selectedNote?.id === deletedId) {
          state.selectedNote = null;
        }
      })

      // Toggle Pin
      .addCase(togglePinNote.fulfilled, (state, action) => {
        const index = state.notes.findIndex((n) => n.id === action.payload.id);
        if (index !== -1) {
          state.notes[index] = action.payload;
        }
        if (state.selectedNote?.id === action.payload.id) {
          state.selectedNote = action.payload;
        }
        state.notes.sort((a, b) => {
          if (a.isPinned === b.isPinned) {
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
          }
          return a.isPinned ? -1 : 1;
        });
      })

      // Create Sub-note
      .addCase(createSubNote.fulfilled, (state, action) => {
        const { parentId, subNote } = action.payload;
        const parent = state.notes.find((n) => n.id === parentId);
        if (parent) {
          if (!parent.subNotes) parent.subNotes = [];
          parent.subNotes.push(subNote);
        }
        if (state.selectedNote?.id === parentId) {
          if (!state.selectedNote.subNotes) state.selectedNote.subNotes = [];
          state.selectedNote.subNotes.push(subNote);
        }
      })

      // Delete Attachment
      .addCase(deleteNoteAttachment.fulfilled, (state, action) => {
        const { noteId, key } = action.payload;
        const note = state.notes.find((n) => n.id === noteId);
        if (note && note.attachments) {
          note.attachments = note.attachments.filter((a) => a.key !== key);
        }
        // Also check subNotes
        state.notes.forEach((n) => {
          n.subNotes?.forEach((sub) => {
            if (sub.id === noteId && sub.attachments) {
              sub.attachments = sub.attachments.filter((a) => a.key !== key);
            }
          });
        });
        if (state.selectedNote && state.selectedNote.id === noteId && state.selectedNote.attachments) {
          state.selectedNote.attachments = state.selectedNote.attachments.filter((a) => a.key !== key);
        }
      });
  },
});

export const {
  setActiveTab,
  setSelectedProject,
  setSearchQuery,
  setSelectedNote,
  clearError,
} = notesSlice.actions;

export default notesSlice.reducer;
