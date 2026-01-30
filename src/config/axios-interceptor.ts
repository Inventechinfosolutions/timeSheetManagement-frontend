import axios, { type AxiosError, type InternalAxiosRequestConfig, type AxiosResponse } from "axios";
import { Storage } from "../utils/storage-util";

// Flag to prevent infinite logout loops
let isLoggingOut = false;

 
 
const TIMEOUT = 20 * 60 * 1000; // 20 minutes
axios.defaults.timeout = TIMEOUT;
axios.defaults.baseURL = 'http://localhost:3000';
//axios.defaults.baseURL = 'http://localhost:3000';
axios.defaults.withCredentials = true;
 
// Placeholder for setLoading
const setLoading = (loading: boolean) => {
  // TODO: Connect to your actual loading context
  console.log('Loading state:', loading);
};
 
const setupAxiosInterceptors = (_onUnauthenticated: () => void) => {
  const onRequestSuccess = (config: InternalAxiosRequestConfig) => {
    const token =
      Storage.local.get("TimeSheet-authenticationToken") ||
      Storage.session.get("TimeSheet-authenticationToken");
   
    const user = Storage.session.get("user");  
    const existingContentType =
      config.headers?.["Content-Type"] || config.headers?.["content-type"];
   
    config.headers.Accept = "application/json";
    if (!existingContentType) {
        config.headers["Content-Type"] = "application/json";
    }
 
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      config.headers.user = user || "";
    }
 
    config.withCredentials = true;
    return config;
  };
 
  const onResponseSuccess = (response: AxiosResponse) => {
    // console.log("Response Cookies:", document.cookie);
    return response;
  };
 
  const onResponseError = async (error: AxiosError) => {
    const status = error.status || (error.response ? error.response.status : 0);

    // Only handle 401 Unauthorized errors
    if (status === 401) {
      // Check if this is a real authentication error (not a validation error)
      const errorData = error.response?.data as any;
      const errorMessage = 
        errorData?.message || 
        errorData?.error || 
        error.message || 
        '';
      
      // Don't clear token for validation errors (400) or other non-auth errors
      // Only clear if it's explicitly an authentication/authorization issue
      const isAuthError = 
        errorMessage.toLowerCase().includes('unauthorized') ||
        errorMessage.toLowerCase().includes('authentication') ||
        errorMessage.toLowerCase().includes('token expired') ||
        errorMessage.toLowerCase().includes('token invalid') ||
        errorMessage.toLowerCase().includes('session expired') ||
        errorMessage.toLowerCase().includes('please login') ||
        errorMessage.toLowerCase().includes('access denied');
      
      // If it's a clear auth error or no specific error message (likely auth issue)
      if (isAuthError || (!errorMessage && status === 401)) {
        // Prevent multiple logout calls
        if (isLoggingOut) {
          return Promise.reject(error);
        }
        
        isLoggingOut = true;
        
        // Get token before clearing (needed for logout API call)
        const token =
          Storage.local.get("TimeSheet-authenticationToken") ||
          Storage.session.get("TimeSheet-authenticationToken");
        
        // Call logout API to properly clean up session on backend
        const performLogout = async () => {
          if (token) {
            try {
              // Create a separate axios instance to avoid interceptor loop
              const logoutAxios = axios.create({
                baseURL: axios.defaults.baseURL,
                timeout: 5000, // Short timeout for logout
                withCredentials: true,
              });
              
              // Call logout API
              await logoutAxios.get('/api/user/logout', {
                headers: {
                  Authorization: `Bearer ${token}`,
                  Accept: 'application/json',
                },
              });
              
              console.log('Logout API called successfully');
            } catch (logoutError: any) {
              // Ignore logout errors - session might already be expired
              // This is expected behavior when token is invalid
              console.warn('Logout API call completed (may have failed due to expired session)');
            }
          }
          
          // Clear tokens from both storage locations
          Storage.session.remove('TimeSheet-authenticationToken');
          Storage.local.remove('TimeSheet-authenticationToken');
          // Also clear user data
          Storage.session.remove('user');
          
          console.error('Authentication Error: Your session has expired. Please login again.');
          
          // Reset flag after a delay
          setTimeout(() => {
            isLoggingOut = false;
          }, 2000);
          
          // Redirect to login page
          _onUnauthenticated();
        };
        
        // Execute logout (don't await to avoid blocking)
        performLogout();
      } else {
        // For other 401 errors (like validation), just log but don't clear token
        console.warn('401 Error (non-auth):', errorMessage);
      }
    } 
    
    return Promise.reject(error);
  };

 
  axios.interceptors.request.use(onRequestSuccess);
  axios.interceptors.response.use(onResponseSuccess, onResponseError);
 
  // Add request interceptor to show loading
  axios.interceptors.request.use(
    (config) => {
      setLoading(true);
      return onRequestSuccess(config);
    },
    (error) => {
      setLoading(false);
      return Promise.reject(error);
    }
  );
 
  // Add response interceptor to hide loading
  axios.interceptors.response.use(
    (response) => {
      setLoading(false);
      return onResponseSuccess(response);
    },
    (error) => {
      setLoading(false);
      return onResponseError(error);
    }
  );
};
 
export default setupAxiosInterceptors;
 
 