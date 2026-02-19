import axios, { type InternalAxiosRequestConfig, type AxiosResponse } from "axios";
import { Storage } from "../utils/storage-util";

 
 
const TIMEOUT = 1 * 60 * 1000;
axios.defaults.timeout = TIMEOUT;
axios.defaults.baseURL = '/';
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
    // 1. Sliding Session: Check if the server sent a new token
    const newToken = response.headers['x-new-token'];
    if (newToken) {
      // Update the storage with the new sliding token
      if (Storage.local.get("TimeSheet-authenticationToken")) {
        Storage.local.set("TimeSheet-authenticationToken", newToken);
      } else {
        Storage.session.set("TimeSheet-authenticationToken", newToken);
      }
    }
    return response;
  };

  const onResponseError = async (error: any) => {
    const originalRequest = error.config;
    const status = error.status || (error.response ? error.response.status : 0);

    // 2. Handle 401: Attempt Refresh
    if (status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/refresh')) {
      const token = Storage.local.get("TimeSheet-authenticationToken") || Storage.session.get("TimeSheet-authenticationToken");
      
      // Only attempt refresh if we actually HAVE a token to begin with
      if (token) {
        originalRequest._retry = true;
        
        const refreshToken = Storage.session.get('TimeSheet-refreshToken') || Storage.local.get('TimeSheet-refreshToken');
        
        if (refreshToken) {
          try {
            const response = await axios.post('/auth/refresh', { refresh_token: refreshToken });
            const { accessToken, refreshToken: newRefreshToken } = response.data;

            // Update tokens in storage
            if (Storage.local.get("TimeSheet-authenticationToken")) {
              Storage.local.set("TimeSheet-authenticationToken", accessToken);
              Storage.local.set("TimeSheet-refreshToken", newRefreshToken);
            } else {
              Storage.session.set("TimeSheet-authenticationToken", accessToken);
              Storage.session.set("TimeSheet-refreshToken", newRefreshToken);
            }

            // Retry the original request with new token
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return axios(originalRequest);
          } catch (refreshError) {
            // Refresh failed, logout
            Storage.session.remove('TimeSheet-authenticationToken');
            Storage.local.remove('TimeSheet-authenticationToken');
            Storage.session.remove('TimeSheet-refreshToken');
            Storage.local.remove('TimeSheet-refreshToken');
            
            // Deduplicate event using simple static flag check
            if (!(window as any)._sessionExpiredDispatched) {
              (window as any)._sessionExpiredDispatched = true;
              window.dispatchEvent(new CustomEvent('session-expired'));
              setTimeout(() => { (window as any)._sessionExpiredDispatched = false; }, 5000);
            }
            return Promise.reject(refreshError);
          }
        }
      }
      
      // If we reach here, either no refresh token was present or the request wasn't authenticated
      // Only fire session-expired if we were actually expecting to be logged in
      if (token && !(window as any)._sessionExpiredDispatched) {
        (window as any)._sessionExpiredDispatched = true;
        window.dispatchEvent(new CustomEvent('session-expired'));
        setTimeout(() => { (window as any)._sessionExpiredDispatched = false; }, 5000);
      }
    }
    
    return Promise.reject(error);
  };

 
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
 
 
