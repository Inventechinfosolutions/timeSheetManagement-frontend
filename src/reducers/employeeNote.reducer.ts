import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { EntityType, ReferenceType } from '../EmployeeDashboard/Employeenotes.enums';
import { EMPLOYEE_NOTES_API } from '../EmployeeDashboard/Employeenotes.types';

const apiUrl = EMPLOYEE_NOTES_API;

export const fetchEmployeeNotes = createAsyncThunk(
  'employeeNote/fetchNotes',
  async (
    { employeeId, search }: { employeeId: string; search?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.get(
        `${apiUrl}/${encodeURIComponent(employeeId)}`,
        { params: search?.trim() ? { search: search.trim() } : undefined }
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || 'Failed to fetch employee notes');
    }
  }
);

export const fetchEmployeeNote = createAsyncThunk(
  'employeeNote/fetchNote',
  async (
    { employeeId, id }: { employeeId: string; id: number | string },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.get(
        `${apiUrl}/${encodeURIComponent(employeeId)}/${encodeURIComponent(id)}`
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || 'Failed to fetch employee note');
    }
  }
);

export const exportEmployeeNote = createAsyncThunk(
  'employeeNote/export',
  async (
    payload: {
      htmlContent: string;
      title: string;
      format: string;
      employeeId?: string;
      noteId?: string | number;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.post(`${apiUrl}/export`, payload, {
        responseType: 'blob',
      });
      return {
        data: response.data,
        headers: response.headers,
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data || 'Failed to export note');
    }
  }
);

export const createEmployeeNote = createAsyncThunk(
  'employeeNote/createNote',
  async (noteData: any, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${apiUrl}`, noteData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || 'Failed to create note');
    }
  }
);

export const updateEmployeeNote = createAsyncThunk(
  'employeeNote/updateNote',
  async (
    { employeeId, id, noteData }: { employeeId: string; id: number | string; noteData: any },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.put(
        `${apiUrl}/${encodeURIComponent(employeeId)}/${encodeURIComponent(id)}`,
        noteData
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || 'Failed to update note');
    }
  }
);

export const deleteEmployeeNote = createAsyncThunk(
  'employeeNote/deleteNote',
  async (
    { employeeId, id }: { employeeId: string; id: number | string },
    { rejectWithValue }
  ) => {
    try {
      await axios.delete(
        `${apiUrl}/${encodeURIComponent(employeeId)}/${encodeURIComponent(id)}`
      );
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || 'Failed to delete note');
    }
  }
);


export const uploadEmployeeNoteFile = createAsyncThunk(
  'employeeNote/uploadFile',
  async (
    {
      entityId,
      refId,
      refType = ReferenceType.NOTE_ATTACHMENT,
      entityType = EntityType.EMPLOYEE_NOTE,
      formData,
    }: any,
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.post(
        `${apiUrl}/upload-file/entityId/${entityId}/refId/${refId}?refType=${refType}&entityType=${entityType}`,
        formData
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || 'Failed to upload file');
    }
  }
);

export const downloadEmployeeNoteFile = createAsyncThunk(
  'employeeNote/downloadFile',
  async (
    {
      entityId,
      refId,
      refType = ReferenceType.NOTE_ATTACHMENT,
      entityType = EntityType.EMPLOYEE_NOTE,
      key,
    }: any,
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.get(
        `${apiUrl}/entityId/${entityId}/refId/${refId}/download-file?key=${key}&refType=${refType}&entityType=${entityType}`,
        {
          responseType: 'blob',
        }
      );
      return {
        data: response.data,
        headers: response.headers,
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data || 'Failed to download file');
    }
  }
);

export const previewEmployeeNoteFile = createAsyncThunk(
  'employeeNote/previewFile',
  async (
    {
      entityId,
      refId,
      refType = ReferenceType.NOTE_ATTACHMENT,
      entityType = EntityType.EMPLOYEE_NOTE,
      key,
    }: any,
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.get(
        `${apiUrl}/entityId/${entityId}/refId/${refId}/view?key=${key}&refType=${refType}&entityType=${entityType}`,
        {
          responseType: 'blob',
        }
      );
      return {
        data: response.data,
        headers: response.headers,
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data || 'Failed to preview file');
    }
  }
);

export const deleteEmployeeNoteFile = createAsyncThunk(
  'employeeNote/deleteFile',
  async (
    {
      entityId,
      refId,
      refType = ReferenceType.NOTE_ATTACHMENT,
      entityType = EntityType.EMPLOYEE_NOTE,
      key,
    }: any,
    { rejectWithValue }
  ) => {
    try {
      await axios.delete(
        `${apiUrl}/entityId/${entityId}/refId/${refId}/delete?key=${key}&refType=${refType}&entityType=${entityType}`
      );
      return key;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || 'Failed to delete file');
    }
  }
);

interface EmployeeNoteState {
  notes: any[];
  loading: boolean;
  error: string | null;
}

const initialState: EmployeeNoteState = {
  notes: [],
  loading: false,
  error: null,
};

const employeeNoteSlice = createSlice({
  name: 'employeeNote',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmployeeNotes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployeeNotes.fulfilled, (state, action) => {
        state.notes = action.payload || [];
        state.loading = false;
      })
      .addCase(fetchEmployeeNotes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createEmployeeNote.fulfilled, (state, action) => {
        const note = action.payload?.data ?? action.payload;
        if (note?.id) {
          state.notes.unshift(note);
        }
      })
      .addCase(updateEmployeeNote.fulfilled, (state, action) => {
        const note = action.payload?.data ?? action.payload;
        if (!note?.id) return;
        const idx = state.notes.findIndex((n) => String(n.id) === String(note.id));
        if (idx >= 0) {
          state.notes[idx] = note;
        } else {
          state.notes.unshift(note);
        }
      })
      .addCase(deleteEmployeeNote.fulfilled, (state, action) => {
        const id = String(action.payload);
        state.notes = state.notes.filter(
          (n) => String(n.id) !== id && String(n.parentNoteId ?? '') !== id
        );
      });
  },
});

export default employeeNoteSlice.reducer;
