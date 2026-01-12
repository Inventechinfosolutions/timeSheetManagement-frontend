/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

// ============ Types & Interfaces ============

export interface UserLoginDto {
  loginId: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  accessToken: string;
  userId: number;
  name: string;
  email: string;
}

export interface EmployeeActivationResponse {
  success: boolean;
  message: string;
  accessToken: string;
  userId: number;
  fullName: string;
  email: string;
  employeeId: number;
}

export interface ResetPasswordDto {
  token: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

interface PublicState {
  // Login
  loginResponse: LoginResponse | null;
  loginLoading: boolean;
  loginError: string | null;
  
  // Employee Activation
  activationResponse: EmployeeActivationResponse | null;
  activationLoading: boolean;
  activationError: string | null;
  
  // Reset Password
  resetPasswordResponse: ResetPasswordResponse | null;
  resetPasswordLoading: boolean;
  resetPasswordError: string | null;
}

// ============ Initial State ============

const initialState: PublicState = {
  loginResponse: null,
  loginLoading: false,
  loginError: null,
  
  activationResponse: null,
  activationLoading: false,
  activationError: null,
  
  resetPasswordResponse: null,
  resetPasswordLoading: false,
  resetPasswordError: null,
};

// ============ API Configuration ============

const apiUrl = "/api/v1";

// ============ Async Thunks ============

/**
 * User Login
 * POST /api/v1/public/login
 */
export const userLogin = createAsyncThunk(
  "public/user_login",
  async (userDetails: UserLoginDto, { rejectWithValue }) => {
    try {
      const response = await axios.post<LoginResponse>(
        `${apiUrl}/public/login`,
        userDetails
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(
          error.response?.data?.message || error.message || "Login failed"
        );
      }
      return rejectWithValue("An unknown error occurred during login");
    }
  }
);

/**
 * Verify Employee Activation Link
 * GET /api/v1/public/verify-activation-employee?token=xxx
 */
export const verifyActivationEmployee = createAsyncThunk(
  "public/verify_activation_employee",
  async ({ token }: { token: string }, { rejectWithValue }) => {
    try {
      const response = await axios.get<EmployeeActivationResponse>(
        `${apiUrl}/public/verify-activation-employee?token=${token}`
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(
          error.response?.data?.message || error.message || "Activation verification failed"
        );
      }
      return rejectWithValue("An unknown error occurred during activation verification");
    }
  }
);

/**
 * Reset Employee Password
 * POST /api/v1/public/reset-password-employee
 */
export const resetPasswordEmployee = createAsyncThunk(
  "public/reset_password_employee",
  async (resetPasswordDto: ResetPasswordDto, { rejectWithValue }) => {
    try {
      const response = await axios.post<ResetPasswordResponse>(
        `${apiUrl}/public/reset-password-employee`,
        resetPasswordDto
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(
          error.response?.data?.message || error.message || "Password reset failed"
        );
      }
      return rejectWithValue("An unknown error occurred during password reset");
    }
  }
);

// ============ Slice ============

export const PublicSlice = createSlice({
  name: "public",
  initialState,
  reducers: {
    // Clear login state
    clearLoginState: (state) => {
      state.loginResponse = null;
      state.loginLoading = false;
      state.loginError = null;
    },
    // Clear activation state
    clearActivationState: (state) => {
      state.activationResponse = null;
      state.activationLoading = false;
      state.activationError = null;
    },
    // Clear reset password state
    clearResetPasswordState: (state) => {
      state.resetPasswordResponse = null;
      state.resetPasswordLoading = false;
      state.resetPasswordError = null;
    },
    // Clear all public state
    clearAllPublicState: () => initialState,
  },
  extraReducers(builder) {
    // ========== User Login ==========
    builder
      .addCase(userLogin.pending, (state) => {
        state.loginLoading = true;
        state.loginError = null;
      })
      .addCase(userLogin.fulfilled, (state, action) => {
        state.loginLoading = false;
        state.loginResponse = action.payload;
        state.loginError = null;
      })
      .addCase(userLogin.rejected, (state, action) => {
        state.loginLoading = false;
        state.loginError = action.payload as string || action.error.message || "Login failed";
      });

    // ========== Verify Activation Employee ==========
    builder
      .addCase(verifyActivationEmployee.pending, (state) => {
        state.activationLoading = true;
        state.activationError = null;
      })
      .addCase(verifyActivationEmployee.fulfilled, (state, action) => {
        state.activationLoading = false;
        state.activationResponse = action.payload;
        state.activationError = null;
      })
      .addCase(verifyActivationEmployee.rejected, (state, action) => {
        state.activationLoading = false;
        state.activationError = action.payload as string || action.error.message || "Activation verification failed";
      });

    // ========== Reset Password Employee ==========
    builder
      .addCase(resetPasswordEmployee.pending, (state) => {
        state.resetPasswordLoading = true;
        state.resetPasswordError = null;
      })
      .addCase(resetPasswordEmployee.fulfilled, (state, action) => {
        state.resetPasswordLoading = false;
        state.resetPasswordResponse = action.payload;
        state.resetPasswordError = null;
      })
      .addCase(resetPasswordEmployee.rejected, (state, action) => {
        state.resetPasswordLoading = false;
        state.resetPasswordError = action.payload as string || action.error.message || "Password reset failed";
      });
  },
});

// ============ Exports ============

export const {
  clearLoginState,
  clearActivationState,
  clearResetPasswordState,
  clearAllPublicState,
} = PublicSlice.actions;

export default PublicSlice.reducer;
