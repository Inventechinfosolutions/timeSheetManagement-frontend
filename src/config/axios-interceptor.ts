import axios, { type AxiosError, type InternalAxiosRequestConfig, type AxiosResponse } from "axios";
import { Storage } from "../utils/storage-util";
import { message } from "antd";

const TIMEOUT = 1 * 60 * 1000;
axios.defaults.timeout = TIMEOUT;
axios.defaults.baseURL = 'http://localhost:3000';
//axios.defaults.baseURL = 'http://localhost:3000';
axios.defaults.withCredentials = true;

// Placeholder for setLoading
const setLoading = (loading: boolean) => {
  // TODO: Connect to your actual loading context
  console.log('Loading state:', loading);
};

const setupAxiosInterceptors = (onUnauthenticated: () => void) => {
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

  const onResponseError = (err: AxiosError) => {
    const status = err.status || (err.response ? err.response.status : 0);

    if (status === 401) {
      // Clear storage

      Storage.session.remove('TimeSheet-authenticationToken');

      // Show notification
      console.error('Session Expired: Your session has expired. Please login again.');

      // Call onUnauthenticated which will trigger navigation to signin
      if (onUnauthenticated) {
        onUnauthenticated();
      }
    } else if (status === 403) {
      window.location.replace("/error-pages/error-403");
    } else if (status === 404) {
      // window.location.replace('/error-pages/error-404');
    } else if (status === 500) {
      // window.location.replace('/error-pages/error-500');
    } else if (status === 503) {
      window.location.replace("/error-pages/error-503");
    } else if (!err.config?.skipErrorMessage) { 
        // console.error("An unexpected error occurred. Please try again later.");
    } else if (status === 400) {
        message.error(err.response.data.message, 3);
    }

    return Promise.reject(err);
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
