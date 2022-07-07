import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

export default function createService(baseURL: string, storage: any, timeout = 10000): AxiosInstance {
  const service = axios.create({ baseURL, timeout });

  service.interceptors.request.use(
    (config: AxiosRequestConfig) => {
      if (storage.engine === 'ls') {
        const token = storage.getToken();
        if (token) {
          if (!config.headers) {
            config.headers = {};
          }
          config.headers.authorization = `Bearer ${encodeURIComponent(token)}`;
        }
      }

      return config;
    },
    (error) => Promise.reject(error)
  );

  return service;
}
