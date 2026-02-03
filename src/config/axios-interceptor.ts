import axios, { type AxiosError, type InternalAxiosRequestConfig, type AxiosResponse } from "axios";
import { Storage } from "../utils/storage-util";

 
 
const TIMEOUT = 1 * 60 * 1000;
axios.defaults.timeout = TIMEOUT;
// axios.defaults.baseURL = '/';
axios.defaults.baseURL = 'http://localhost:3000';
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
 
  const onResponseError = (error: AxiosError) => {
    const status = error.status || (error.response ? error.response.status : 0);
 
    if (status === 401) {
      Storage.session.remove('TimeSheet-authenticationToken');
      console.error('Session Expired: Your session has expired. Please login again.');
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
 
 
