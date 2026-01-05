import axios, {AxiosInstance, AxiosRequestConfig} from 'axios';
import {getData} from '../hooks/useAsyncStorage';

export const Google_Maps_Api_Key = `AIzaSyC8oQ4dsrPXmPNjJ85YO1KWzaVY2Lt7Uh4`;
export const appName = 'Kinmarvel';

const isLive = true;

export const SOCKET_SERVER_URL = isLive
  ? 'https://fameely-api.deliciousdabbas.com'
  : 'http://192.168.0.122:3000';

export const baseUrl = isLive
  ? 'https://fameely-api.deliciousdabbas.com/api'
  : 'http://192.168.0.122:3000/api';

export const fileViewURL = isLive
  ? 'https://fameely-api.deliciousdabbas.com/api/file/fetch/'
  : 'http://192.168.0.122:3000/api/file/fetch/';

// Standard Axios Instance
const API_AXIOS: AxiosInstance = axios.create({
  baseURL: baseUrl,
  timeout: 50000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for attaching the token
API_AXIOS.interceptors.request.use(
  async (config: AxiosRequestConfig) => {
    const authToken = await getData('authToken');
    if (authToken && config.headers) {
      config.headers['Authorization'] = `Bearer ${authToken}`;
    }
    return config;
  },
  error => Promise.reject(error),
);

export {API_AXIOS};

// Multipart Axios Instance
const API_AXIOS_MULTIPART: AxiosInstance = axios.create({
  baseURL: baseUrl,
  timeout: 50000,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

// Request interceptor for attaching the token to multipart requests
API_AXIOS_MULTIPART.interceptors.request.use(
  async (config: AxiosRequestConfig) => {
    const authToken = await getData('authToken');
    if (authToken && config.headers) {
      config.headers['Authorization'] = `Bearer ${authToken}`;
    }
    return config;
  },
  error => Promise.reject(error),
);

export {API_AXIOS_MULTIPART};
