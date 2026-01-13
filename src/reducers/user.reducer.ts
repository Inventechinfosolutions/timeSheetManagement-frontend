import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { Storage } from '../utils/storage-util';

// ENUMS
export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum UserType {
  ADMIN = 'ADMIN',
  EMPLOYEE = 'EMPLOYEE',
}

// INTERFACES
export interface User {
  id?: string;
  loginId: string;
  aliasLoginName: string;
  userType?: UserType;
  status?: UserStatus;
  createdAt?: string;
  updatedAt?: string;
  resetRequired?: number;
}

export interface CreateUserDto {
  loginId: string;
  name: string;
  password: string;
}

export interface UserLoginDto {
  loginId: string;
  password: string;
}

export interface ChangePasswordDto {
  newPassword: string;
  confirmNewPassword: string;
}

export interface LoginResponse {
  userId: string;
  name: string;
  email: string;
  accessToken: string;
  userType?: UserType;
  resetRequired?: number;
  refreshToken?: string; // Not exposed in response, stored in httpOnly cookie
}

export interface AuthMeResponse {
  userId: string;
  name: string;
  email: string;
  accessToken: string;
  userType?: UserType;
  resetRequired?: number;
}

interface UserState {
  currentUser: User | null;           // Currently authenticated user
  accessToken: string | null;         // JWT access token
  isAuthenticated: boolean;           // Authentication status
  loading: boolean;                   // Global loading state for API calls
  error: string | null;               // Global error message
  passwordChangeSuccess: boolean;     // Flag for password change success
}

const initialState: UserState = {
  currentUser: null,
  accessToken: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  passwordChangeSuccess: false,
};

const apiUrl = '/api/v1/user'; 

// 1. Create User: POST /user/create
export const createUser = createAsyncThunk(
  'user/create',
  async (createUserDto: CreateUserDto, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${apiUrl}/create`, createUserDto);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create user');
    }
  }
);

// 2. User Login: POST /user/login
export const loginUser = createAsyncThunk(
  'user/login',
  async (userLoginDto: UserLoginDto, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${apiUrl}/login`, userLoginDto, {
        withCredentials: true, // Important: Send/receive cookies
      });
      
      const data = response.data.data as LoginResponse;
      
      // If userType is missing, fetch it
      if (!data.userType) {
         try {
             // We prioritize the token from the response
             const token = data.accessToken;
             const meResponse = await axios.get(`${apiUrl}/auth/me`, {
                withCredentials: true,
                headers: { Authorization: `Bearer ${token}` }
             });
             // Merge the userType and resetRequired from meResponse
             if (meResponse.data.data) {
                 return { 
                    ...data, 
                    userType: meResponse.data.data.userType,
                    resetRequired: meResponse.data.data.resetRequired
                 };
             }
         } catch (e) {
             console.warn("Failed to fetch user type after login", e);
             // Proceed without userType if fetch fails, or handle as needed
         }
      }
      
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

// 3. Auth Me (Verify/Refresh Token): GET /user/auth/me
export const authMe = createAsyncThunk(
  'user/authMe',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${apiUrl}/auth/me`, {
        withCredentials: true, // Important: Send cookies with request
      });
      return response.data.data as AuthMeResponse;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Authentication failed');
    }
  }
);

// 4. User Logout: GET /user/logout
export const logoutUser = createAsyncThunk(
  'user/logout',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${apiUrl}/logout`, {
        withCredentials: true, // Important: Clear cookies
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Logout failed');
    }
  }
);

// 5. Change Password: POST /user/change-password
export const changePassword = createAsyncThunk(
  'user/changePassword',
  async (changePasswordDto: ChangePasswordDto, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${apiUrl}/change-password`, changePasswordDto, {
        withCredentials: true, // Important: Send auth cookies
        headers: {
          Authorization: `Bearer ${Storage.session.get('TimeSheet-authenticationToken')}`, // Include access token
        },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Password change failed');
    }
  }
);

// Slice
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    // Synchronous action to clear errors in the UI
    clearError: (state) => {
      state.error = null;
    },
    // Clear password change success flag
    clearPasswordChangeSuccess: (state) => {
      state.passwordChangeSuccess = false;
    },
    // Set access token manually (e.g., from localStorage on app init)
    setAccessToken: (state, action: PayloadAction<string | null>) => {
      state.accessToken = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    // Reset state on Logout or component unmount
    resetUserState: () => initialState,
    // Set resetRequired flag
    setResetRequired: (state, action: PayloadAction<number>) => {
      if (state.currentUser) {
        state.currentUser.resetRequired = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // CREATE USER
      .addCase(createUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createUser.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        // User created successfully, but not logged in yet
        state.error = null;
      })
      .addCase(createUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to create user';
      })

      // LOGIN USER
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action: PayloadAction<LoginResponse>) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.accessToken = action.payload.accessToken;
        state.currentUser = {
          id: action.payload.userId,
          loginId: action.payload.email,
          aliasLoginName: action.payload.name,
          userType: action.payload.userType,
          resetRequired: action.payload.resetRequired,
        };
        state.error = null;
        
        // Store access token in sessionStorage for persistence
        Storage.session.set('TimeSheet-authenticationToken', action.payload.accessToken);
        // Clean up old localStorage token if exists
        localStorage.removeItem('accessToken');
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.accessToken = null;
        state.currentUser = null;
        state.error = action.payload as string || 'Login failed';
      })

      // AUTH ME (Token Verification/Refresh)
      .addCase(authMe.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(authMe.fulfilled, (state, action: PayloadAction<AuthMeResponse>) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.accessToken = action.payload.accessToken;
        state.currentUser = {
          id: action.payload.userId,
          loginId: action.payload.email,
          aliasLoginName: action.payload.name,
          userType: action.payload.userType,
          resetRequired: action.payload.resetRequired,
        };
        state.error = null;
        
        // Update access token in sessionStorage
        Storage.session.set('TimeSheet-authenticationToken', action.payload.accessToken);
        // Clean up old localStorage token if exists
        localStorage.removeItem('accessToken');
      })
      .addCase(authMe.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.accessToken = null;
        state.currentUser = null;
        state.error = action.payload as string || 'Authentication failed';
        
        // Clear stored token on auth failure
        Storage.session.remove('TimeSheet-authenticationToken');
      })

      // LOGOUT USER
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        // Reset to initial state on successful logout
        state.loading = false;
        state.isAuthenticated = false;
        state.accessToken = null;
        state.currentUser = null;
        state.error = null;
        state.passwordChangeSuccess = false;
        
        // Clear stored token
        Storage.session.remove('TimeSheet-authenticationToken');
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Logout failed';
        
        // Even if logout fails on server, clear local state
        state.isAuthenticated = false;
        state.accessToken = null;
        state.currentUser = null;

        Storage.session.remove('TimeSheet-authenticationToken');
      })

      // CHANGE PASSWORD
      .addCase(changePassword.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.passwordChangeSuccess = false;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.loading = false;
        state.passwordChangeSuccess = true;
        state.error = null;
        if (state.currentUser) {
          state.currentUser.resetRequired = 0;
        }
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.loading = false;
        state.passwordChangeSuccess = false;
        state.error = action.payload as string || 'Password change failed';
      });
  },
});

export const { 
  clearError, 
  clearPasswordChangeSuccess, 
  setAccessToken, 
  resetUserState,
  setResetRequired
} = userSlice.actions;

export default userSlice.reducer;
