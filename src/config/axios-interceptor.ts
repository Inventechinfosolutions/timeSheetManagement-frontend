import axios, { type InternalAxiosRequestConfig, type AxiosResponse } from "axios";
import { Storage } from "../utils/storage-util";
import type { AppDispatch } from "../store";
import { increment, decrement, MIN_SPINNER_DURATION_MS } from "../reducers/apiLoading.reducer";
 
const TIMEOUT = 1 * 60 * 1000;
axios.defaults.timeout = TIMEOUT;
axios.defaults.baseURL = '/';
//axios.defaults.baseURL = 'http://localhost:3000';
axios.defaults.withCredentials = true;
 
declare module "axios" {
  interface InternalAxiosRequestConfig {
    _apiLoadingStartTime?: number;
    skipGlobalLoader?: boolean;
  }
  interface AxiosRequestConfig {
    skipGlobalLoader?: boolean;
  }
}
 
const checkShouldSkipLoader = (config?: any): boolean => {
  if (!config) return false;
  if (config.skipGlobalLoader) return true;
  if (config.headers) {
    if (config.headers["x-skip-loader"] === "true" || config.headers["X-Skip-Loader"] === "true") return true;
    if (typeof config.headers.get === "function") {
      const val = config.headers.get("x-skip-loader") || config.headers.get("X-Skip-Loader");
      if (val === "true" || val === true) return true;
    }
  }
  return false;
};

const setupAxiosInterceptors = (
  dispatch: AppDispatch,
  _onUnauthenticated: () => void
) => {
  const onRequestSuccess = (config: InternalAxiosRequestConfig) => {
    const shouldSkipLoader = checkShouldSkipLoader(config);

    if (!shouldSkipLoader) {
      config._apiLoadingStartTime = Date.now();
      dispatch(increment());
    }
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
 
    // Sanitize HTML error responses (e.g., Nginx 502 Bad Gateway HTML)
    if (error.response?.data && typeof error.response.data === 'string' && error.response.data.includes('<html')) {
      let friendlyMessage = "An unexpected server error occurred. Please contact support.";
      if (status === 502) {
        friendlyMessage = "Bad Gateway: The server is currently down or unreachable. Please try again later.";
      } else if (status === 504) {
        friendlyMessage = "Gateway Timeout: The server took too long to respond.";
      } else if (status === 503) {
        friendlyMessage = "Service Unavailable: The server is temporarily overloaded or down.";
      } else if (status === 404) {
        friendlyMessage = "Not Found: The requested resource could not be found.";
      }
      
      error.response.data = friendlyMessage;
      error.message = friendlyMessage;
    }
 
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
 
 
  const finishWithMinDelay = (config?: InternalAxiosRequestConfig) => {
    if (checkShouldSkipLoader(config)) return;

    const start = config?._apiLoadingStartTime ?? Date.now();
    const elapsed = Date.now() - start;
    const delay = Math.max(0, MIN_SPINNER_DURATION_MS - elapsed);
    setTimeout(() => dispatch(decrement()), delay);
  };
 
  axios.interceptors.request.use(
    (config) => onRequestSuccess(config),
    (error) => {
      if (!checkShouldSkipLoader(error?.config)) {
        dispatch(decrement());
      }
      return Promise.reject(error);
    }
  );
 
  axios.interceptors.response.use(
    (response) => {
      finishWithMinDelay(response.config as InternalAxiosRequestConfig);
      return onResponseSuccess(response);
    },
    (error) => {
      finishWithMinDelay(error.config as InternalAxiosRequestConfig);
      return onResponseError(error);
    }
  );
};
 
export default setupAxiosInterceptors;
 
 
 
 