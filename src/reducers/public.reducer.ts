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

export interface ForgotPasswordOtpDto {
  loginId: string;
  email: string;
}

export interface VerifyOtpDto {
  loginId: string;
  otp: string;
}

export interface ResetPasswordOtpDto {
  loginId: string;
  newPassword: string;
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

  // OTP Flow
  otpSent: boolean;
  otpVerified: boolean;
  otpLoading: boolean;
  otpError: string | null;
  resetSuccess: boolean;
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

  otpSent: false,
  otpVerified: false,
  otpLoading: false,
  otpError: null,
  resetSuccess: false,
};

// ============ API Configuration ============

const apiUrl = "/api";

// ============ Async Thunks ============

/**
 * User Login
 * POST /api/public/login
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
 * GET /api/public/verify-activation-employee?token=xxx
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
 * POST /api/public/reset-password-employee
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

/**
 * Step 1: Request OTP
 * POST /api/auth/forgot-password
 */
export const forgotPasswordOtp = createAsyncThunk(
  "public/forgot_password_otp",
  async (dto: ForgotPasswordOtpDto, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${apiUrl}/auth/forgot-password`, dto);
      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(error.response?.data?.message || error.message || "Failed to send OTP");
      }
      return rejectWithValue("An unknown error occurred while sending OTP");
    }
  }
);

/**
 * Step 2: Verify OTP
 * POST /api/auth/verify-otp
 */
export const verifyOtp = createAsyncThunk(
  "public/verify_otp",
  async (dto: VerifyOtpDto, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${apiUrl}/auth/verify-otp`, dto);
      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(error.response?.data?.message || error.message || "Invalid OTP");
      }
      return rejectWithValue("An unknown error occurred while verifying OTP");
    }
  }
);

/**
 * Step 3: Reset Password
 * POST /api/auth/reset-password
 */
export const resetPasswordOtp = createAsyncThunk(
  "public/reset_password_otp",
  async (dto: ResetPasswordOtpDto, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${apiUrl}/auth/reset-password`, dto);
      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(error.response?.data?.message || error.message || "Failed to reset password");
      }
      return rejectWithValue("An unknown error occurred while resetting password");
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
    // Clear OTP flow state
    clearOtpState: (state) => {
      state.otpSent = false;
      state.otpVerified = false;
      state.otpLoading = false;
      state.otpError = null;
      state.resetSuccess = false;
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

    // ========== OTP Flow ==========
    builder
      .addCase(forgotPasswordOtp.pending, (state) => {
        state.otpLoading = true;
        state.otpError = null;
      })
      .addCase(forgotPasswordOtp.fulfilled, (state) => {
        state.otpLoading = false;
        state.otpSent = true;
      })
      .addCase(forgotPasswordOtp.rejected, (state, action) => {
        state.otpLoading = false;
        state.otpError = action.payload as string;
      })
      .addCase(verifyOtp.pending, (state) => {
        state.otpLoading = true;
        state.otpError = null;
      })
      .addCase(verifyOtp.fulfilled, (state) => {
        state.otpLoading = false;
        state.otpVerified = true;
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.otpLoading = false;
        state.otpError = action.payload as string;
      })
      .addCase(resetPasswordOtp.pending, (state) => {
        state.otpLoading = true;
        state.otpError = null;
      })
      .addCase(resetPasswordOtp.fulfilled, (state) => {
        state.otpLoading = false;
        state.resetSuccess = true;
      })
      .addCase(resetPasswordOtp.rejected, (state, action) => {
        state.otpLoading = false;
        state.otpError = action.payload as string;
      });
  },
});

// ============ Exports ============

export const {
  clearLoginState,
  clearActivationState,
  clearResetPasswordState,
  clearOtpState,
  clearAllPublicState,
} = PublicSlice.actions;

export default PublicSlice.reducer;
